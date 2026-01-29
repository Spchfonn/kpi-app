import { requireUser } from "@/app/lib/auth";
import { prisma } from "@/prisma/client";
import { NotificationType, PlanConfirmTarget } from "@prisma/client";
import { NextResponse } from "next/server";

async function notifyPlan(tx: any, args: {
	type: NotificationType;
	actorEmployeeId: string;
	cycleId: number;
	planId: string;
	assignmentId: string;
	recipientEmployeeIds: string[];
  }) {
	const users = await tx.user.findMany({
		where: { employeeId: { in: args.recipientEmployeeIds } },
		select: { id: true },
	});
	if (!users.length) return;
  
	await tx.notification.create({
		data: {
			type: args.type,
			actorId: args.actorEmployeeId,
			cycleId: args.cycleId,
			meta: { planId: args.planId, assignmentId: args.assignmentId },
			recipients: { createMany: { data: users.map((u: any) => ({ userId: u.id })), skipDuplicates: true }, },
		},
	});
}

export async function POST(_req: Request, ctx: { params: Promise<{ planId: string }> }) {
	try {
		const user = await requireUser();
		const { planId } = await ctx.params;

		// load plan + assignment + evaluator/evaluatee
		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				confirmStatus: true,
				assignmentId: true,
				assignment: { select: { id: true,
										cycleId: true,
										evaluatorId: true,
										evaluateeId: true,
										evalStatus: true,
										currentPlanId: true } },
			},
		});

		if (!plan || !plan.assignment) return Response.json({ ok: false, message: "Plan not found" }, { status: 404 });

		if (plan.assignment.evalStatus === "SUBMITTED") {
			return NextResponse.json({ ok: false, message: "ส่งผลการประเมินแล้ว ไม่สามารถขอรับรอง KPI ได้" }, { status: 400 });
		}

		if (plan.assignment.currentPlanId !== plan.id) {
			return NextResponse.json({ ok: false, message: "ไม่ใช่ current plan ของ assignment" }, { status: 400 });
		}

		// allow request from DRAFT/REJECTED/CANCELLED only
		if (!["DRAFT", "REJECTED", "CANCELLED"].includes(plan.confirmStatus)) {
			return NextResponse.json({ ok: false, message: "สถานะไม่อนุญาตให้ขอรับรอง" }, { status: 400 });
		}

		// decide target + notification type based on actor role
		const isEvaluator = user.employeeId === plan.assignment.evaluatorId;
		const isEvaluatee = user.employeeId === plan.assignment.evaluateeId;
		if (!isEvaluator && !isEvaluatee) {
		  	return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์" }, { status: 403 });
		}
	
		const confirmTarget: PlanConfirmTarget = isEvaluatee ? "EVALUATOR" : "EVALUATEE";
		const notiType: NotificationType = isEvaluatee
			? "EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI"
			: "EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI";
	
		const recipientEmployeeIds = [confirmTarget === "EVALUATOR" ? plan.assignment.evaluatorId : plan.assignment.evaluateeId];
	
		await prisma.$transaction(async (tx) => {
			await tx.kpiPlan.update({
				where: { id: planId },
				data: {
					confirmStatus: "REQUESTED",
					confirmTarget,
					confirmRequestedAt: new Date(),
					confirmRequestedById: user.employeeId,
					// clear previous confirm/reject (optional)
					confirmedAt: null,
					confirmedById: null,
					rejectedAt: null,
					rejectedById: null,
					rejectReason: null,
				},
			});

			await notifyPlan(tx, {
				type: notiType,
				actorEmployeeId: user.employeeId,
				cycleId: plan.assignment.cycleId,
				planId,
				assignmentId: plan.assignmentId,
				recipientEmployeeIds,
			});
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err: any) {
		console.error("POST /api/kpiPlans/[planId]/requestConfirm error:", err);
    	return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}