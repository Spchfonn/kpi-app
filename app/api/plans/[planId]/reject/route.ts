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

		const body = await req.json().catch(() => ({}));
		const reason = (body?.reason ?? "").toString().trim();
		if (!reason) forbid("reason is required", 400);

		const now = new Date();

		const ev = await prisma.$transaction(async (tx) => {
			await tx.kpiPlan.update({
				where: { id: plan.id },
				data: {
					confirmStatus: "REJECTED",
					rejectReason: reason,
					rejectedAt: now,
					rejectedById: user.employeeId ?? undefined,
				},
			});

			return tx.kpiPlanConfirmEvent.create({
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
		});

		return NextResponse.json({ ok: true, refPlanEventId: ev.id });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}