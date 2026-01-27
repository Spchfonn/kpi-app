import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

type Body = {
	planId: string;
};

// ---- helpers ----
function clamp(n: number, lo: number, hi: number) {
	return Math.max(lo, Math.min(hi, n));
}

function toNumberDecimal(v: any): number {
	// Prisma Decimal มัก toString()
	const n = typeof v === "number" ? v : Number(v?.toString?.() ?? v);
	return Number.isFinite(n) ? n : 0;
}

function scoreFromQuantOrCustom(payload: any): number | null {
	const s = payload?.score;
	if (s === null || s === undefined || s === "") return null;
	const n = Number(s);
	if (!Number.isFinite(n)) return null;
	return clamp(n, 0, 5);
}

/**
 * rubric.kind = "QUALITATIVE_CHECKLIST"
 * rubric.checklist = [{ item: string, weight_percent: number }, ...]
 * checkedIds = ["1","2",...]
 *
 * return 0-5
 */

function getCheckedIds(payloadAny: any): string[] {
	const v = payloadAny?.checkedIds;
	return Array.isArray(v) ? v.map(String) : [];
}

function scoreFromQualitativeChecklist(rubric: any, checkedIds: string[]): number | null {
	if (!rubric || rubric.kind !== "QUALITATIVE_CHECKLIST") return null;

	const list = Array.isArray(rubric.checklist) ? rubric.checklist : [];
	if (!list.length) return 0;

	const set = new Set(checkedIds.map(String));

	let sumWeight = 0;
	for (let i = 0; i < list.length; i++) {
		const id = String(i + 1);
		if (set.has(id)) {
			const w = Number(list[i]?.weight_percent ?? 0);
			if (Number.isFinite(w)) sumWeight += w;
		}
	}

	// weight_percent ex. 100 → map to 5
	const score0to5 = (sumWeight / 100) * 5;
	return clamp(Math.round(score0to5), 0, 5);
}

export async function POST(req: Request) {
	try {
		const body: Body = await req.json();
		const planId = body.planId;

		if (!planId) {
			return NextResponse.json({ ok: false, message: "planId is required" }, { status: 400 });
		}

		// 1) load all ITEM nodes in this plan + currentSubmission + type/rubric
		const nodes = await prisma.kpiNode.findMany({
			where: { planId, nodeType: "ITEM" },
			select: {
				id: true,
				title: true,
				weightPercent: true,
				type: { select: { type: true, rubric: true } },
				currentSubmission: {
					select: {
						id: true,
						version: true,
						payload: true,
						calculatedScore: true,
						finalScore: true,
					},
				},
			},
			orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		});

		// 2) validate completeness
		const incomplete: Array<{ nodeId: string; title: string; reason: string }> = [];

		for (const n of nodes) {
			const kpiType = n.type?.type;

			if (kpiType === "QUALITATIVE") continue;

			const sub = n.currentSubmission;
			if (!sub) {
				incomplete.push({ nodeId: n.id, title: n.title, reason: "ยังไม่มีการประเมิน" });
				continue;
			}

			const payload = (sub.payload ?? {}) as any;
			const score = scoreFromQuantOrCustom(payload);
			if (score === null) {
				incomplete.push({ nodeId: n.id, title: n.title, reason: "ยังไม่ได้กรอกคะแนน" });
			}
		}

		if (incomplete.length) {
			return NextResponse.json(
				{ ok: false, message: "ยังประเมินไม่ครบทุกข้อ", data: { incomplete } },
				{ status: 400 }
			);
		}

		// 3) compute per node score + aggregate
		let sumWeight = 0;
		let sumWeightedPercent = 0;

		const computed = nodes.map((n) => {
			const weight = toNumberDecimal(n.weightPercent); // 0-100
			sumWeight += weight;

			const sub = n.currentSubmission;
			const payload = (sub?.payload ?? {}) as any;

			const kpiType = n.type?.type; // QUANTITATIVE | QUALITATIVE | CUSTOM
			let score0to5: number | null = null;

			if (kpiType === "QUALITATIVE") {
				const checkedIds = Array.isArray(payload?.checkedIds) ? payload.checkedIds.map(String) : [];
				const computedScore = scoreFromQualitativeChecklist(n.type?.rubric, checkedIds);

				score0to5 = computedScore ?? 0;
			}
			else {
				score0to5 = scoreFromQuantOrCustom(payload)!;
			}

			const weightedPercent = score0to5 === null ? 0 : (score0to5 / 5) * weight;

			sumWeightedPercent += weightedPercent;

			return {
				nodeId: n.id,
				title: n.title,
				weightPercent: weight,
				submissionId: sub?.id ?? null,
				submissionVersion: sub?.version ?? null,
				score0to5,
				weightedPercent, // contribution
			};
		});

		// overall percent
		const overallPercent = sumWeight > 0 ? (sumWeightedPercent / sumWeight) * 100 : 0;

		// 4) update calculatedScore/finalScore back to currentSubmission (if has)
		//    - calculatedScore: 0-5
		//    - finalScore: equal to calculatedScore
		await prisma.$transaction(async (tx) => {
			for (const item of computed) {
				if (!item.submissionId) continue;

				await tx.kpiSubmission.update({
					where: { id: item.submissionId },
					data: {
						calculatedScore: Math.round(item.score0to5),
						finalScore: Math.round(item.score0to5),
					},
				});
			}
		});

		return NextResponse.json(
			{
				ok: true,
				data: {
					overallPercent: Math.round(overallPercent * 100) / 100, // 2 decimals
					sumWeight,
					items: computed,
				},
			},
			{ status: 200 }
		);
	} catch (err: any) {
		console.error("POST /api/submissions/summary error:", err);
		return NextResponse.json(
			{ ok: false, message: err?.message ?? "Internal Server Error" },
			{ status: 500 }
		);
	}
}