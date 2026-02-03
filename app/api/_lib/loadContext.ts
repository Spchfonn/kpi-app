import { prisma } from "@/prisma/client";
import { getCycleGates, forbid } from "./kpiWorkflow";
import { requireUser } from "@/app/lib/auth";
import { assertCanViewPlan } from "./guards";

export async function loadPlanContext(planId: string) {
	const user = await requireUser();

	const plan = await prisma.kpiPlan.findUnique({
		where: { id: planId },
		select: {
			id: true,
			assignmentId: true,
			version: true,
			status: true,
			confirmStatus: true,
			confirmTarget: true,
			confirmRequestedById: true,
			contentHash: true,
		},
	});
	if (!plan) {
		forbid("plan not found", 404);
		throw new Error();
	}

	const assignment = await prisma.evaluationAssignment.findUnique({
		where: { id: plan.assignmentId },
		select: {
			id: true,
			cycleId: true,
			evaluatorId: true,
			evaluateeId: true,
			evalStatus: true,
			currentPlanId: true,
			needsReEval: true,
			evaluatedPlanId: true,
		},
	});
	if (!assignment) {
		forbid("assignment not found", 404);
		throw new Error();
	}

	const cycle = await prisma.evaluationCycle.findUnique({
		where: { id: assignment.cycleId },
		select: { id: true, publicId: true, kpiDefineMode: true, closedAt: true },
	});
	if (!cycle) {
		forbid("cycle not found", 404);
		throw new Error();
	}

	const gates = await getCycleGates(cycle.id);

	// Enforce visibility here
	assertCanViewPlan(user, cycle, assignment, plan!);

	return { user, plan, assignment, cycle, gates };
}

export async function loadAssignmentContext(assignmentId: string) {
	const user = await requireUser();

	const assignment = await prisma.evaluationAssignment.findUnique({
		where: { id: assignmentId },
		select: {
			id: true,
			cycleId: true,
			evaluatorId: true,
			evaluateeId: true,
			evalStatus: true,
			currentPlanId: true,
			needsReEval: true,
			evaluatedPlanId: true,
		},
	});
	if (!assignment) {
		forbid("assignment not found", 404);
		throw new Error();
	}

	const cycle = await prisma.evaluationCycle.findUnique({
		where: { id: assignment.cycleId },
		select: { id: true, publicId: true, kpiDefineMode: true, closedAt: true },
	});
	if (!cycle) {
		forbid("cycle not found", 404);
		throw new Error();
	}

	const gates = await getCycleGates(cycle.id);

	return { user, assignment, cycle, gates };
}