import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadAssignmentContext } from "@/app/api/_lib/loadContext";
import { requireGate, forbid } from "@/app/api/_lib/kpiWorkflow";
import { isEvaluator } from "@/app/api/_lib/guards";

export async function POST(_: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
	try {
		const { assignmentId } = await params;
		const { user, assignment, gates } = await loadAssignmentContext(assignmentId);

		requireGate(gates, "EVALUATE");

		if (!user.isAdmin && !isEvaluator(user, assignment)) forbid("evaluator only");
		if (assignment.evalStatus === "SUBMITTED") forbid("already submitted");

		if (!assignment.currentPlanId) {
			forbid("no currentPlanId");
			throw new Error();
		}
		if (assignment.needsReEval) forbid("KPI changed; re-evaluation required");
		if (assignment.evaluatedPlanId && assignment.evaluatedPlanId !== assignment.currentPlanId) {
			forbid("evaluatedPlanId != currentPlanId");
		}

		// currentPlan must be ACTIVE/CONFIRMED
		const p = await prisma.kpiPlan.findUnique({
			where: { id: assignment.currentPlanId! },
			select: { status: true, confirmStatus: true },
		});
		if (!p) {
			forbid("current plan not found", 404);
			throw new Error();
		}
		if (!(p.status === "ACTIVE" && p.confirmStatus === "CONFIRMED")) {
			forbid("current plan must be ACTIVE/CONFIRMED to submit evaluation");
		}

		const now = new Date();

		await prisma.evaluationAssignment.update({
			where: { id: assignment.id },
			data: {
				evalStatus: "SUBMITTED",
				submittedAt: now,
				submittedById: user.employeeId ?? undefined,
			},
		});

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}