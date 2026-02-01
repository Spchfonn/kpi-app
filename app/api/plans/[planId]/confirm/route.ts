import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadPlanContext } from "@/app/api/_lib/loadContext";
import { requireGate, forbid } from "@/app/api/_lib/kpiWorkflow";
import { isConfirmer } from "@/app/api/_lib/guards";

export async function POST(_: Request, { params }: { params: Promise<{ planId: string }> }) {
	try {
		const { planId } = await params;
		const { user, plan, assignment, cycle, gates } = await loadPlanContext(planId);

		requireGate(gates, "DEFINE");
		if (cycle.closedAt) forbid("cycle closed");
		if (assignment.evalStatus === "SUBMITTED") forbid("assignment already submitted");
		if (plan.confirmStatus !== "REQUESTED") forbid("plan is not REQUESTED");
		if (!user.isAdmin && !isConfirmer(user, cycle, assignment)) forbid("not confirmer");
		if (plan.status === "ARCHIVED") forbid("archived plan");

		const now = new Date();

		const ev = await prisma.$transaction(async (tx) => {
			// archive any previous ACTIVE plan for this assignment
			await tx.kpiPlan.updateMany({
				where: { assignmentId: assignment.id, status: "ACTIVE", NOT: { id: plan.id } },
				data: { status: "ARCHIVED" },
			});

			await tx.kpiPlan.update({
				where: { id: plan.id },
				data: {
					confirmStatus: "CONFIRMED",
					confirmedAt: now,
					confirmedById: user.employeeId ?? undefined,
					status: "ACTIVE",
				},
			});

			// L2: if already in progress and evaluatedPlanId points to another plan -> needsReEval
			const willNeedReEval =
				assignment.evalStatus === "IN_PROGRESS" &&
				assignment.evaluatedPlanId != null &&
				assignment.evaluatedPlanId !== plan.id;

			await tx.evaluationAssignment.update({
				where: { id: assignment.id },
				data: {
					currentPlanId: plan.id,
					needsReEval: willNeedReEval ? true : assignment.needsReEval,
				},
			});

			return tx.kpiPlanConfirmEvent.create({
				data: {
					planId: plan.id,
					type: "CONFIRMED",
					fromStatus: "REQUESTED",
					toStatus: "CONFIRMED",
					actorId: user.employeeId ?? null,
					createdAt: now,
				},
				select: { id: true },
			});
		});

		return NextResponse.json({ ok: true, refPlanEventId: ev.id });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}