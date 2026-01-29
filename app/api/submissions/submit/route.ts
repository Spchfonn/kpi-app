import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { AssignmentEvalStatus, NotificationType, PlanConfirmStatus } from "@prisma/client";
import { requireUser } from "@/app/lib/auth";

type Body = { planId: string };

function clamp(n: number, lo: number, hi: number) {
  	return Math.max(lo, Math.min(hi, n));
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

function scoreFromQuantOrCustom(payload: any): number | null {
	const s = payload?.score;
	if (s === null || s === undefined || s === "") return null;
	const n = Number(s);
	if (!Number.isFinite(n)) return null;
	return clamp(n, 0, 5);
}

async function createNotificationForEmployees(tx: any, args: {
	type: NotificationType;
	actorEmployeeId?: string | null;
	cycleId?: number | null;
	meta?: any;
	recipientEmployeeIds: string[];
  }) {
	const users = await tx.user.findMany({
		where: { employeeId: { in: args.recipientEmployeeIds } },
		select: { id: true },
	});
  
	if (!users.length) return;
  
	const noti = await tx.notification.create({
		data: {
			type: args.type,
			actorId: args.actorEmployeeId ?? null,
			cycleId: args.cycleId ?? null,
			meta: args.meta ?? null,
			recipients: {
				createMany: {
					data: users.map((u: any) => ({ userId: u.id })),
					skipDuplicates: true,
				},
			},
		},
		select: { id: true },
	});
  
	return noti.id;
}

export async function POST(req: Request) {
	try {
		const user = await requireUser();
		const { planId } = await req.json();
		if (!planId) {
			return NextResponse.json({ ok: false, message: "planId is required" }, { status: 400 });
		}

		// 1) load plan + assignment + cycle + check status
		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				confirmStatus: true,
				assignmentId: true,
				assignment: {
					select: {
						id: true,
						cycleId: true,
						evaluatorId: true,
						evaluateeId: true,
						evalStatus: true,
						currentPlanId: true,
					},
				},
			},
		});

		if (!plan || !plan.assignment) {
			return NextResponse.json({ ok: false, message: "Plan not found" }, { status: 404 });
		}
	  
		// current plan only
		if (plan.assignment.currentPlanId !== plan.id) {
			return NextResponse.json({ ok: false, message: "ไม่ใช่ current plan ของ assignment" }, { status: 400 });
		}
	  
		if (plan.assignment.evalStatus === "SUBMITTED") {
			return NextResponse.json({ ok: false, message: "ส่งผลไปแล้ว" }, { status: 400 });
		}
	  
		// KPI must be confirmed before submit
		if (plan.confirmStatus !== ("CONFIRMED" as PlanConfirmStatus)) {
			return NextResponse.json({ ok: false, message: "KPI Plan ยังไม่ได้รับรอง" }, { status: 400 });
		}

		// 2) load all ITEM nodes + currentSubmission + rubric
		const nodes = await prisma.kpiNode.findMany({
			where: { planId, nodeType: "ITEM" },
			select: {
				id: true,
				title: true,
				weightPercent: true,
				type: { select: { type: true, rubric: true } },
				currentSubmission: { select: { id: true, payload: true } },
			},
		});

		// 3) validate completeness
		const incomplete: Array<{ nodeId: string; title: string; reason: string }> = [];
		for (const n of nodes) {
			const sub = n.currentSubmission;
			if (!sub) {
				incomplete.push({ nodeId: n.id, title: n.title, reason: "ยังไม่มีการประเมิน" });
				continue;
			}
			if (n.type?.type !== "QUALITATIVE") {
				const score = scoreFromQuantOrCustom(sub.payload ?? {});
				if (score === null) incomplete.push({ nodeId: n.id, title: n.title, reason: "ยังไม่ได้กรอกคะแนน" });
			}
		}
	  
		if (incomplete.length) {
			return NextResponse.json({ ok: false, message: "ยังประเมินไม่ครบทุกข้อ", data: { incomplete } }, { status: 400 });
		}

		// 4) compute new calculatedScore/finalScore for each currentSubmission
		const computed = nodes.map((n) => {
			const payload = (n.currentSubmission?.payload ?? {}) as any;
			let score0to5 = 0;
	  
			if (n.type?.type === "QUALITATIVE") {
				const checkedIds = Array.isArray(payload?.checkedIds) ? payload.checkedIds.map(String) : [];
				score0to5 = scoreFromQualitativeChecklist(n.type?.rubric, checkedIds);
			}
			else {
			  	score0to5 = scoreFromQuantOrCustom(payload)!;
			}
	  
			return { nodeId: n.id, submissionId: n.currentSubmission!.id, score0to5 };
		});

		// 5) update submissions + lock assignment
		await prisma.$transaction(async (tx) => {
			for (const c of computed) {
				await tx.kpiSubmission.update({
					where: { id: c.submissionId },
					data: {
						calculatedScore: Math.round(c.score0to5),
						finalScore: Math.round(c.score0to5),
					},
				});
			}

			await tx.evaluationAssignment.update({
				where: { id: plan.assignmentId },
				data: {
					evalStatus: "SUBMITTED" as AssignmentEvalStatus,
					submittedAt: new Date(),
					submittedById: user.employeeId,
				},
			});
		});

		return NextResponse.json({ ok: true, message: "Submitted" });
	} catch (err: any) {
		return NextResponse.json(
			{ ok: false, message: err?.message ?? "Submit failed" },
			{ status: 400 }
		);
	}
}