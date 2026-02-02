import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadAssignmentContext } from "@/app/api/_lib/loadContext";
import { forbid } from "@/app/api/_lib/kpiWorkflow";
import { isEvaluator, isEvaluatee } from "@/app/api/_lib/guards";

export async function GET(_: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
	try {
		const { assignmentId } = await params;
		const { user, assignment, gates } = await loadAssignmentContext(assignmentId);

		// permission baseline: must be admin or participant
		const participant = isEvaluator(user, assignment) || isEvaluatee(user, assignment);
		if (!user.isAdmin && !participant) forbid("forbidden");

		// evaluatee can see scores only in SUMMARY gate
		const isEvalee = isEvaluatee(user, assignment);
		const canSeeScores = user.isAdmin || isEvaluator(user, assignment) || (isEvalee && gates.SUMMARY);

		if (!assignment.currentPlanId) {
			return NextResponse.json({ ok: true, data: { planId: null, scoresVisible: canSeeScores, items: [] } });
		}

		// Pull node scores from current plan
		const nodes = await prisma.kpiNode.findMany({
			where: { planId: assignment.currentPlanId },
			select: {
				id: true,
				title: true,
				nodeType: true,
				parentId: true,
				weightPercent: true,
				sortOrder: true,
				currentSubmission: canSeeScores
				? { select: { finalScore: true, calculatedScore: true, note: true, payload: true, updatedAt: true } }
				: false,
			},
			orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
		});

		return NextResponse.json({
			ok: true,
			data: {
				planId: assignment.currentPlanId,
				scoresVisible: canSeeScores,
				items: nodes.map((n: any) => ({
					id: n.id,
					title: n.title,
					nodeType: n.nodeType,
					parentId: n.parentId,
					weightPercent: n.weightPercent,
					sortOrder: n.sortOrder,
					submission: canSeeScores ? n.currentSubmission : null,
				})),
			},
		});
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}