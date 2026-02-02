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

		const ev = await prisma.$transaction(async (tx) => {
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

			return tx.kpiPlanConfirmEvent.create({
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
		});

		return NextResponse.json({ ok: true, refPlanEventId: ev.id });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}