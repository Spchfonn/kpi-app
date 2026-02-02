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
		if (plan.confirmStatus !== "REQUESTED") forbid("plan is not REQUESTED");
		if (!user.isAdmin && !isDefineOwner(user, cycle, assignment)) forbid("not allowed");

		const now = new Date();

		const ev = await prisma.$transaction(async (tx) => {
			await tx.kpiPlan.update({
				where: { id: plan.id },
				data: { confirmStatus: "CANCELLED" },
			});

			return tx.kpiPlanConfirmEvent.create({
				data: {
					planId: plan.id,
					type: "CANCELLED",
					fromStatus: "REQUESTED",
					toStatus: "CANCELLED",
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