import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const bodySchema = z.object({
	evaluateeIds: z.array(z.string().min(1)).default([]),
});

function uniq(arr: string[]) {
	return [...new Set(arr)];
}

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string; evaluatorId: string }> }
	) {
	const { id, evaluatorId } = await params;

	const cycleId = Number(id);
	if (!Number.isFinite(cycleId)) {
		return NextResponse.json({ ok: false, message: "invalid cycle id" }, { status: 400 });
	}
	if (!evaluatorId) {
		return NextResponse.json({ ok: false, message: "invalid evaluatorId" }, { status: 400 });
	}

	const body = await req.json().catch(() => null);
	const v = bodySchema.safeParse(body);
	if (!v.success) {
		return NextResponse.json(
			{ ok: false, message: "validation error", issues: v.error.issues },
			{ status: 400 }
		);
	}

	const desired = uniq(v.data.evaluateeIds);

	// get current assignments of evaluator in this cycle
	const current = await prisma.evaluationAssignment.findMany({
		where: { cycleId, evaluatorId },
		select: { id: true, evaluateeId: true },
	});

	const currentIds = new Set(current.map((a) => a.evaluateeId));
	const desiredIds = new Set(desired);

	const toAdd = desired.filter((eid) => !currentIds.has(eid));
	const toRemove = current.filter((a) => !desiredIds.has(a.evaluateeId));

	// avoid assignment that has KpiPlan
	if (toRemove.length > 0) {
		const removeAssignmentIds = toRemove.map((a) => a.id);

		const planCount = await prisma.kpiPlan.count({
			where: { assignmentId: { in: removeAssignmentIds } },
		});

		if (planCount > 0) {
			return NextResponse.json(
				{
					ok: false,
					message: "Cannot remove some evaluatees because those assignments already have KPI plans",
					blockedAssignmentIds: removeAssignmentIds,
				},
				{ status: 409 }
			);
		}
	}

	// transaction: remove & add
	await prisma.$transaction(async (tx) => {
		if (toRemove.length > 0) {
			await tx.evaluationAssignment.deleteMany({
				where: { id: { in: toRemove.map((a) => a.id) } },
			});
		}

		if (toAdd.length > 0) {
			await tx.evaluationAssignment.createMany({
				data: toAdd.map((evaluateeId) => ({
					cycleId,
					evaluatorId,
					evaluateeId,
					weightPercent: 0,
				})),
				skipDuplicates: true,
			});
		}
	});

	// return updated group
	const refreshed = await prisma.evaluationAssignment.findMany({
		where: { cycleId, evaluatorId },
		select: {
			evaluator: {
				select: { id: true, employeeNo: true, name: true, position: true, level: true },
			},
			evaluatee: {
				select: { id: true, employeeNo: true, name: true, position: true, level: true },
			},
		},
	});

	const evaluator = refreshed[0]?.evaluator ?? null;
	const evaluatees = refreshed.map((x) => x.evaluatee);

	return NextResponse.json({
		ok: true,
		data: evaluator ? { evaluator, evaluatees } : { evaluator: null, evaluatees: [] },
	});
}