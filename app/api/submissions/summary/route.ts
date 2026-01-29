import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

type Body = { planId: string };

function clamp(n: number, lo: number, hi: number) {
  	return Math.max(lo, Math.min(hi, n));
}

function toNumberDecimal(v: any): number {
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

function scoreFromQualitativeChecklist(rubric: any, checkedIds: string[]): number {
	if (!rubric || rubric.kind !== "QUALITATIVE_CHECKLIST") return 0;

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

		const nodes = await prisma.kpiNode.findMany({
			where: { planId, nodeType: "ITEM" },
			select: {
				id: true,
				title: true,
				weightPercent: true,
				type: { select: { type: true, rubric: true } },
				currentSubmission: { select: { id: true, payload: true } },
			},
			orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
		});

		// validate completeness:
		// - QUANT/CUSTOM: ต้องมี submission + score
		// - QUALITATIVE: ต้องมี submission (เลือก 0 ได้)
		const incomplete: Array<{ nodeId: string; title: string; reason: string }> = [];

		for (const n of nodes) {
			const sub = n.currentSubmission;
			if (!sub) {
				incomplete.push({ nodeId: n.id, title: n.title, reason: "ยังไม่มีการประเมิน" });
				continue;
			}

			if (n.type?.type !== "QUALITATIVE") {
				const score = scoreFromQuantOrCustom(sub.payload ?? {});
				if (score === null) {
					incomplete.push({ nodeId: n.id, title: n.title, reason: "ยังไม่ได้กรอกคะแนน" });
				}
			}
		}

		if (incomplete.length) {
			return NextResponse.json({ ok: false, message: "ยังประเมินไม่ครบทุกข้อ", data: { incomplete } }, { status: 400 });
		}

		let sumWeight = 0;
		let sumWeightedPercent = 0;

		const items = nodes.map((n) => {
			const weight = toNumberDecimal(n.weightPercent);
			sumWeight += weight;

			const payload = (n.currentSubmission?.payload ?? {}) as any;

			let score0to5 = 0;
			if (n.type?.type === "QUALITATIVE") {
				const checkedIds = Array.isArray(payload?.checkedIds) ? payload.checkedIds.map(String) : [];
				score0to5 = scoreFromQualitativeChecklist(n.type?.rubric, checkedIds);
			}
			else {
				score0to5 = scoreFromQuantOrCustom(payload)!;
			}

			const weightedPercent = (score0to5 / 5) * weight;
			sumWeightedPercent += weightedPercent;

			return { nodeId: n.id, title: n.title, score0to5, weightPercent: weight, weightedPercent };
		});

		const overallPercent = sumWeight > 0 ? (sumWeightedPercent / sumWeight) * 100 : 0;

		return NextResponse.json(
			{ ok: true, data: { overallPercent: Math.round(overallPercent * 100) / 100, sumWeight, items } },
			{ status: 200 }
		);
	} catch (err: any) {
		console.error("POST /api/submissions/summary error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}