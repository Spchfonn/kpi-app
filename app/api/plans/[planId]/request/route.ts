import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadPlanContext } from "@/app/api/_lib/loadContext";
import { requireGate, forbid } from "@/app/api/_lib/kpiWorkflow";
import { isDefineOwner } from "@/app/api/_lib/guards";

export async function POST(_: Request, { params }: { params: Promise<{ planId: string }> }) {
	try {
		const { planId } = await params;
		const { user, plan, assignment, cycle, gates } = await loadPlanContext(planId);

		requireGate(gates, "DEFINE");
		if (cycle.closedAt) forbid("cycle closed");
		if (assignment.evalStatus === "SUBMITTED") forbid("assignment already submitted");
		if (!user.isAdmin && !isDefineOwner(user, cycle, assignment)) forbid("not define owner");

		if (plan.status === "ARCHIVED") forbid("archived plan");
		if (!["DRAFT", "REJECTED", "CANCELLED"].includes(plan.confirmStatus)) forbid("cannot request in this status");

		const confirmTarget = cycle.kpiDefineMode === "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS" ? "EVALUATEE" : "EVALUATOR";
		const now = new Date();

		const out = await prisma.$transaction(async (tx) => {
			await tx.evaluationAssignment.update({
				where: { id: assignment.id },
				data: { currentPlanId: plan.id },
			});
			
			await tx.kpiPlan.update({
				where: { id: plan.id },
				data: {
					confirmStatus: "REQUESTED",
					confirmTarget,
					confirmRequestedAt: now,
					confirmRequestedById: user.employeeId ?? undefined,
					rejectReason: null,
					rejectedAt: null,
					rejectedById: null,
				},
			});

			const ev = await tx.kpiPlanConfirmEvent.create({
				data: {
					planId: plan.id,
					type: "REQUESTED",
					fromStatus: plan.confirmStatus,
					toStatus: "REQUESTED",
					target: confirmTarget,
					actorId: user.employeeId ?? null,
					createdAt: now,
				},
				select: { id: true },
			});

			// 1) เลือก employee ผู้รับตาม target
			const receiverEmployeeId =
			confirmTarget === "EVALUATEE" ? assignment.evaluateeId : assignment.evaluatorId;
	
			// 2) หา userId ของ receiver (NotificationRecipient ผูกกับ User)
			const receiverUser = await tx.user.findFirst({
				where: { employeeId: receiverEmployeeId },
				select: { id: true },
			});
			if (!receiverUser) {
				// จะ throw หรือจะข้ามก็ได้ แต่แนะนำ throw เพื่อให้รู้ว่ามี mapping user-employee ขาด
				throw new Error("receiver user not found");
			}

			// 3) สร้าง notification + recipient
			await tx.notification.create({
				data: {
					type: "EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI" as any,
			
					actorId: user.employeeId ?? null,
					cycleId: cycle.id,
			
					refPlanId: plan.id,
					refAssignmentId: assignment.id,
					refPlanEventId: ev.id,
			
					meta: {
						cyclePublicId: cycle.publicId,
						confirmTarget,
					},
			
					recipients: {
						create: [{ userId: receiverUser.id }],
					},
				},
				select: { id: true },
			});
		
			return { refPlanEventId: ev.id };
		});

		return NextResponse.json({ ok: true, refPlanEventId: out.refPlanEventId });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}