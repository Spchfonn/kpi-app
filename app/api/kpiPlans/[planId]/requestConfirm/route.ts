import { AuthError, requireUser } from "@/app/lib/auth";
import { createNotification } from "@/app/lib/notifications";
import { prisma } from "@/prisma/client";
import { NotificationType } from "@prisma/client";

export async function POST(_req: Request, ctx: { params: Promise<{ planId: string }> }) {
	try {
		const user = await requireUser();
		const { planId } = await ctx.params;

		// 1) load plan + assignment + evaluator/evaluatee
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

		if (plan.confirmRequestedAt) {
			return Response.json({ ok: true, data: { id: plan.id, confirmRequestedAt: plan.confirmRequestedAt } });
		}

		// 2) check that evaluator is belong to this assignment
		const evaluatorUserId = plan.assignment.evaluator.user?.id;
		if (!evaluatorUserId || evaluatorUserId !== user.id) {
			return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
		}

		const evaluateeUserId = plan.assignment.evaluatee.user?.id;
		if (!evaluateeUserId) {
			return Response.json({ ok: false, message: "Evaluatee has no user account" }, { status: 400 });
		}

		// 3) set pending
		const updated = await prisma.kpiPlan.update({
			where: { id: planId },
			data: { confirmRequestedAt: new Date() },
			select: { id: true, confirmRequestedAt: true },
		});

		// 4) meta for FE click noti then link to which page
		const meta = {
			assignmentId: plan.assignmentId,
			planId: plan.id,
			cycleId: plan.assignment.cycle.publicId,
			evaluateeId: plan.assignment.evaluateeId,
			// TODO: change url
			url: `/${plan.assignment.cycle.publicId}/evaluatee/confirmKpi/${plan.assignment.evaluateeId}?planId=${plan.id}`,
		};

		// 5) create notification
		await createNotification({
			type: NotificationType.EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI,
			actorEmployeeId: plan.assignment.evaluatorId, // actor: employeeId
			cycleId: plan.assignment.cycleId,
			meta,
			recipientUserIds: [evaluateeUserId],
		});

		return Response.json({ ok: true, data: updated });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ ok: false, message: e.message }, { status: e.status });
		console.error(e);
		return Response.json({ ok: false, message: "Server error" }, { status: 500 });
	}
}