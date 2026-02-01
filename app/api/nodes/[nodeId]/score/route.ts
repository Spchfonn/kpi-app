import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";
import { forbid, requireGate } from "@/app/api/_lib/kpiWorkflow";
import { getCycleGates } from "@/app/api/_lib/kpiWorkflow";
import { isEvaluator } from "@/app/api/_lib/guards";

export async function POST(req: Request, { params }: { params: Promise<{ nodeId: string }> }) {
	try {
		const { nodeId } = await params;
		const user = await requireUser();

		const body = await req.json().catch(() => ({}));
		const payload = body?.payload ?? null;
		const calculatedScore = body?.calculatedScore ?? null;
		const finalScore = body?.finalScore ?? null;
		const note = (body?.note ?? "").toString().trim() || null;

		// Load node -> plan -> assignment -> cycle
		const node = await prisma.kpiNode.findUnique({
			where: { id: nodeId },
			select: {
				id: true,
				planId: true,
				currentSubmissionId: true,
				plan: {
				select: {
					id: true,
					status: true,
					confirmStatus: true,
					assignmentId: true,
					assignment: {
						select: {
							id: true,
							cycleId: true,
							evaluatorId: true,
							evaluateeId: true,
							evalStatus: true,
							currentPlanId: true,
							evaluatedPlanId: true,
							needsReEval: true,
						},
					},
				},
				},
			},
		});
		if (!node) {
			forbid("node not found", 404);
			throw new Error();
		} 

		const assignment = node.plan.assignment;
		const cycleId = assignment.cycleId;

		const gates = await getCycleGates(cycleId);
		requireGate(gates, "EVALUATE");

		// Only evaluator/admin can score
		if (!user.isAdmin && !isEvaluator(user, assignment)) forbid("evaluator only");
		if (assignment.evalStatus === "SUBMITTED") forbid("assignment already submitted");

		// must score on ACTIVE/CONFIRMED plan AND it must be assignment.currentPlanId
		if (!(node.plan.status === "ACTIVE" && node.plan.confirmStatus === "CONFIRMED")) {
			forbid("plan must be ACTIVE/CONFIRMED");
		}
		if (assignment.currentPlanId !== node.plan.id) forbid("must score on assignment.currentPlanId");

		// L2: if needsReEval true, still allow scoring (to fix), but ensure evaluatedPlanId aligns eventually
		const now = new Date();

		const out = await prisma.$transaction(async (tx) => {
			// Determine next submission version
			const last = await tx.kpiSubmission.findFirst({
				where: { nodeId: node.id },
				orderBy: { version: "desc" },
				select: { version: true },
			});
			const nextVersion = (last?.version ?? 0) + 1;

			const sub = await tx.kpiSubmission.create({
				data: {
					nodeId: node.id,
					version: nextVersion,
					payload,
					calculatedScore,
					finalScore,
					note,
				},
				select: { id: true, version: true },
			});

			// set node currentSubmissionId
			await tx.kpiNode.update({
				where: { id: node.id },
				data: { currentSubmissionId: sub.id },
			});

			// set evaluatedPlanId on first score
			const updates: any = {};
			if (!assignment.evaluatedPlanId) updates.evaluatedPlanId = assignment.currentPlanId;

			// mark in progress
			if (assignment.evalStatus === "NOT_STARTED") updates.evalStatus = "IN_PROGRESS";
			// if evaluator is scoring on current plan, they are actively re-evaluating => may clear needsReEval later when they submit
			// (We keep needsReEval until submitEvaluation checks evaluatedPlanId==currentPlanId and needsReEval=false; you can clear explicitly elsewhere)
			await tx.evaluationAssignment.update({
				where: { id: assignment.id },
				data: updates,
			});

			return { submissionId: sub.id, version: sub.version, updatedAt: now };
		});

		return NextResponse.json({ ok: true, ...out });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}