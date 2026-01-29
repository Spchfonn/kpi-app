import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";
import { AssignmentEvalStatus } from "@prisma/client";

type EvalScoreState = {
	score: number | "";
	checkedIds?: string[];
};

type PutBody = {
	planId: string;
	scores: Record<string, EvalScoreState>; // key = nodeId
};

function isFiniteNumber(v: any): v is number {
	return typeof v === "number" && Number.isFinite(v);
}

// rubric.checklist = [{ item, weight_percent }, ...]
function calcQualitativeScoreFromRubric(rubric: any, checkedIds: string[]) {
	if (!rubric || rubric.kind !== "QUALITATIVE_CHECKLIST") return null;
  
	const items: any[] = Array.isArray(rubric.checklist) ? rubric.checklist : [];
	if (!items.length) return 0;
  
	const checkedSet = new Set(checkedIds.map((x) => String(x)));
  
	// sum weight_percent of selected items
	let sum = 0;
	for (let i = 0; i < items.length; i++) {
		const id = String(i + 1);
		if (checkedSet.has(id)) {
			const w = Number(items[i]?.weight_percent ?? 0);
			if (Number.isFinite(w)) sum += w;
		}
	}

	// compute score (maximum is 5)
	const score0to5 = Math.round((sum / 100) * 5);

	// clamp
	return Math.max(0, Math.min(5, score0to5));
}

export async function PUT(req: Request) {
	try {
		const user = await requireUser();

		const body: PutBody = await req.json();
		const planId: string | undefined = body.planId;
		const scores: Record<string, EvalScoreState> | undefined = body.scores;

		if (!planId) {
			return NextResponse.json({ ok: false, message: "planId is required" }, { status: 400 });
		}
		if (!scores || typeof scores !== "object") {
			return NextResponse.json({ ok: false, message: "scores is required" }, { status: 400 });
		}

		const nodeIds = Object.keys(scores);
		if (nodeIds.length === 0) {
			return NextResponse.json({ ok: true, message: "No scores to save", data: { count: 0 } }, { status: 200 });
		}

		// 0) guard: assignment SUBMITTED, cannot edit
		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				assignmentId: true,
				assignment: { select: { evalStatus: true } },
			},
		});
		if (!plan) {
			return NextResponse.json({ ok: false, message: "Plan not found" }, { status: 404 });
		}
		if (plan.assignment?.evalStatus === "SUBMITTED") {
			return NextResponse.json({ ok: false, message: "ส่งผลการประเมินแล้ว ไม่สามารถแก้ไขได้" }, { status: 400 });
		}

		// 1) validate nodes belong to plan + only ITEM
		const nodes = await prisma.kpiNode.findMany({
			where: { id: { in: nodeIds }, planId },
			select: { 	id: true,
						nodeType: true,
						type: { select: { type: true }} },
		});
	  
		const found = new Set(nodes.map((n) => n.id));
		const missing = nodeIds.filter((id) => !found.has(id));
		if (missing.length) {
			return NextResponse.json(
			  { ok: false, message: `Some nodeIds not in this plan: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}` },
			  { status: 400 }
			);
		}
	  
		const nonItem = nodes.filter((n) => n.nodeType !== "ITEM").map((n) => n.id);
		if (nonItem.length) {
			return NextResponse.json(
			  { ok: false, message: `Some nodeIds are not ITEM: ${nonItem.slice(0, 5).join(", ")}${nonItem.length > 5 ? "..." : ""}` },
			  { status: 400 }
			);
		}

		const nodeMap = new Map(nodes.map((n) => [n.id, n]));

		// 2) find latest version of each node (groupBy max)
		const maxByNode = await prisma.kpiSubmission.groupBy({
			by: ["nodeId"],
			where: { nodeId: { in: nodeIds } },
			_max: { version: true },
		});
	  
		const lastVersionMap = new Map<string, number>();
		for (const row of maxByNode) {
			lastVersionMap.set(row.nodeId, row._max.version ?? 0);
		}

		// 3) create new submissions + set currentSubmissionId
		const result = await prisma.$transaction(async (tx) => {
	  
			for (const nodeId of nodeIds) {
				const s = scores[nodeId];
				const node = nodeMap.get(nodeId)!;

				const kpiType = node.type?.type;   // "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM"
		
				const nextVersion = (lastVersionMap.get(nodeId) ?? 0) + 1;
		
				// normalize
				const rawScore = s?.score === "" ? null : Number(s?.score);
				const checkedIds = Array.isArray(s?.checkedIds) ? s.checkedIds.map(String) : [];

				// validate + build payload by type
				let payload: any = {};
		
				if (kpiType === "QUALITATIVE") {
					payload = { checkedIds };
		  		}
				else {
					// QUANTITATIVE / CUSTOM: use score 0-5
					if (rawScore !== null) {
						if (!isFiniteNumber(rawScore) || rawScore < 0 || rawScore > 5) {
							throw new Error(`Invalid score (0-5) for nodeId=${nodeId}`);
						}
					}
					payload = { score: rawScore };
				}

				const created = await tx.kpiSubmission.create({
					data: {
						nodeId,
						version: nextVersion,
						payload,
						calculatedScore: null,
						finalScore: null,
					},
					select: { id: true },
				});
		
				await tx.kpiNode.update({
					where: { id: nodeId },
					data: { currentSubmissionId: created.id },
					select: { id: true },
				});
			}

			// set assignment.evalStatus = IN_PROGRESS
			await tx.evaluationAssignment.update({
				where: { id: plan.assignmentId },
				data: {
				  	evalStatus: plan.assignment.evalStatus === "NOT_STARTED" ? ("IN_PROGRESS" as AssignmentEvalStatus) : undefined,
				},
			});
	  
			return { createdCount: nodeIds.length };
		});

		return NextResponse.json(
			{ ok: true, message: "Saved", data: result },
			{ status: 200 }
		);
	} catch (err: any) {
		console.error("PUT /api/submissions error:", err);
		return NextResponse.json(
			{ ok: false, message: err?.message ?? "Internal Server Error" },
			{ status: 500 }
		);
	}
}	

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const planId = url.searchParams.get("planId");
	
		if (!planId) {
			return NextResponse.json({ ok: false, message: "planId is required" }, { status: 400 });
		}
	
		// get all ITEM nodes and currentSubmission of this plan
		const nodes = await prisma.kpiNode.findMany({
			where: { planId, nodeType: "ITEM" },
			select: {
				id: true,
				currentSubmission: {
					select: {
					id: true,
					payload: true,
					},
				},
			},
		});
	
		const scores: Record<string, EvalScoreState> = {};
	
		for (const n of nodes) {
			const payload = (n.currentSubmission?.payload ?? {}) as any;
	
			const scoreRaw = payload?.score;
			const checkedIdsRaw = payload?.checkedIds;
	
			scores[n.id] = {
				score:
					scoreRaw === null || scoreRaw === undefined || scoreRaw === ""
					? ""
					: Number(scoreRaw),
		
				checkedIds: Array.isArray(checkedIdsRaw) ? checkedIdsRaw.map(String) : [],
			};
		}
	
		return NextResponse.json(
			{ ok: true, data: { scores } },
			{ status: 200 }
		);
	} catch (err: any) {
		console.error("GET /api/submissions error:", err);
		return NextResponse.json(
			{ ok: false, message: err?.message ?? "Internal Server Error" },
			{ status: 500 }
		);
	}
}