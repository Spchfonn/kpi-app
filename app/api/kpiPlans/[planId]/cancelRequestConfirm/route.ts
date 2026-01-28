import { AuthError, requireUser } from "@/app/lib/auth";
import { createNotification } from "@/app/lib/notifications";
import { prisma } from "@/prisma/client";
import { NotificationType } from "@prisma/client";

export async function POST(_req: Request, ctx: { params: Promise<{ planId: string }> }) {
	try {
		const user = await requireUser();
		const { planId } = await ctx.params;

		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			include: {
				assignment: {
				include: {
					cycle: true,
					evaluator: { include: { user: true } },
					evaluatee: { include: { user: true } },
				},
				},
			},
		});

		if (!plan) return Response.json({ ok: false, message: "Plan not found" }, { status: 404 });

		if (!plan.confirmRequestedAt) {
			return Response.json({ ok: true, data: { id: plan.id, confirmRequestedAt: null }, });
		}

		// must be evaluator
		const evaluatorUserId = plan.assignment.evaluator.user?.id;
		if (!evaluatorUserId || evaluatorUserId !== user.id) {
			return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
		}

		const evaluateeUserId = plan.assignment.evaluatee.user?.id;
		if (!evaluateeUserId) {
			return Response.json({ ok: false, message: "Evaluatee has no user account" }, { status: 400 });
		}

		// 1) update plan state
		const updated = await prisma.kpiPlan.update({
			where: { id: planId },
			data: { confirmRequestedAt: null },
			select: { id: true, confirmRequestedAt: true },
		});	  

		// 2) send cancel notification
		await createNotification({
			type: NotificationType.EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI,
			actorEmployeeId: plan.assignment.evaluatorId,
			cycleId: plan.assignment.cycleId,
			meta: {
				assignmentId: plan.assignmentId,
				planId: plan.id,
			},
			recipientUserIds: [evaluateeUserId],
		});

		return Response.json({ ok: true, data: updated });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ ok: false, message: e.message }, { status: e.status });
		console.error(e);
		return Response.json({ ok: false, message: "Server error" }, { status: 500 });
	}
}