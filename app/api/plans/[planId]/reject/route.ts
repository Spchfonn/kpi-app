import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadPlanContext } from "@/app/api/_lib/loadContext";
import { requireGate, forbid } from "@/app/api/_lib/kpiWorkflow";
import { isConfirmer } from "@/app/api/_lib/guards";

export async function POST(req: Request, { params }: { params: Promise<{ planId: string }> }) {
	try {
		const { planId } = await params;
		const { user, plan, assignment, cycle, gates } = await loadPlanContext(planId);

		requireGate(gates, "DEFINE");
		if (cycle.closedAt) forbid("cycle closed");
		if (assignment.evalStatus === "SUBMITTED") forbid("assignment already submitted");
		if (plan.confirmStatus !== "REQUESTED") forbid("plan is not REQUESTED");
		if (!user.isAdmin && !isConfirmer(user, cycle, assignment)) forbid("not confirmer");
		if (plan.status === "ARCHIVED") forbid("archived plan");

		const body = await req.json().catch(() => ({}));
		const reason = (body?.reason ?? "").toString().trim();
		if (!reason) forbid("reason is required", 400);

		const now = new Date();

		const out = await prisma.$transaction(async (tx) => {
			await tx.kpiPlan.update({
				where: { id: plan.id },
				data: {
					confirmStatus: "REJECTED",
					rejectReason: reason,
					rejectedAt: now,
					rejectedById: user.employeeId ?? undefined,
					// (optional) เคลียร์ confirmed fields เผื่อเคย confirm มาก่อน
					confirmedAt: null,
					confirmedById: null,
				},
			});
	  
			const ev = await tx.kpiPlanConfirmEvent.create({
				data: {
					planId: plan.id,
					type: "REJECTED",
					fromStatus: "REQUESTED",
					toStatus: "REJECTED",
					actorId: user.employeeId ?? null,
					note: reason,
					createdAt: now,
				},
				select: { id: true },
			});
	  
			const receiverEmployeeId = assignment.evaluatorId;
	  
			const receiverUser = await tx.user.findFirst({
				where: { employeeId: receiverEmployeeId },
				select: { id: true },
			});
			if (!receiverUser) throw new Error("receiver user not found");
	  
			await tx.notification.create({
				data: {
					type: "EVALUATEE_REJECT_EVALUATOR_KPI",
					actorId: user.employeeId ?? null,
					cycleId: cycle.id,
		
					refPlanId: plan.id,
					refAssignmentId: assignment.id,
					refPlanEventId: ev.id,
		
					meta: {
					assignmentId: assignment.id,
					planId: plan.id,
					planEventId: ev.id,
					evaluateeId: assignment.evaluateeId,
					evaluatorId: assignment.evaluatorId,
					action: "REJECTED",
					rejectReason: reason,
					// cyclePublicId: cycle.publicId, // ใส่ได้ถ้ามีใน loadPlanContext
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