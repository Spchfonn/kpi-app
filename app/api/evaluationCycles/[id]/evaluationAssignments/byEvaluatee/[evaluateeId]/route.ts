import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

const bodySchema = z.object({
	evaluatorItems: z
		.array(
		z.object({
			evaluatorId: z.string().min(1),
			weightPercent: z.coerce.number().min(0).max(100).default(0),
		})
		)
		.default([]),
});

function uniqByEvaluatorId(items: { evaluatorId: string; weightPercent: number }[]) {
	const m = new Map<string, { evaluatorId: string; weightPercent: number }>();
	for (const it of items) {
		m.set(it.evaluatorId, {
		evaluatorId: it.evaluatorId,
		weightPercent: Number.isFinite(it.weightPercent) ? it.weightPercent : 0,
		});
	}
	return [...m.values()];
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; evaluateeId: string }> }) {
	const { id, evaluateeId } = await params;

	const cycleId = Number(id);
	if (!Number.isFinite(cycleId)) {
		return NextResponse.json({ ok: false, message: "invalid cycle id" }, { status: 400 });
	}
	if (!evaluateeId) {
		return NextResponse.json({ ok: false, message: "invalid evaluateeId" }, { status: 400 });
	}

	const body = await req.json().catch(() => null);
	const v = bodySchema.safeParse(body);
	if (!v.success) {
		return NextResponse.json(
		{ ok: false, message: "validation error", issues: v.error.issues },
		{ status: 400 }
		);
	}
	
	const desiredItems = uniqByEvaluatorId(v.data.evaluatorItems);
	const desiredEvaluatorIds = new Set(desiredItems.map((x) => x.evaluatorId));
	
	const sum = desiredItems.reduce((s, x) => s + (Number(x.weightPercent) || 0), 0);
	if (Math.abs(sum - 100) > 0.01) {
		return NextResponse.json(
			{ ok: false, message: "weightPercent sum must be 100", sum },
			{ status: 400 }
		);
	}

	// current assignments of evaluatee in this cycle
	const current = await prisma.evaluationAssignment.findMany({
		where: { cycleId, evaluateeId },
		select: { id: true, evaluatorId: true },
	});

	const currentEvaluatorIds = new Set(current.map((a) => a.evaluatorId));

	const toAdd = desiredItems.filter((x) => !currentEvaluatorIds.has(x.evaluatorId));
	const toRemove = current.filter((a) => !desiredEvaluatorIds.has(a.evaluatorId));

	// update weight for existing rows (intersection)
	const toUpdate = desiredItems.filter((x) => currentEvaluatorIds.has(x.evaluatorId));

	// block removal if those assignments already have plans
	if (toRemove.length > 0) {
		const removeAssignmentIds = toRemove.map((a) => a.id);

		const planCount = await prisma.kpiPlan.count({
			where: { assignmentId: { in: removeAssignmentIds } },
		});

		if (planCount > 0) {
			return NextResponse.json(
				{
				ok: false,
				message:
					"Cannot remove some evaluators because those assignments already have KPI plans",
				blockedAssignmentIds: removeAssignmentIds,
				},
				{ status: 409 }
			);
		}
	}

	await prisma.$transaction(async (tx) => {
		// remove
		if (toRemove.length > 0) {
			await tx.evaluationAssignment.deleteMany({
				where: { id: { in: toRemove.map((a) => a.id) } },
			});
		}

		// add
		if (toAdd.length > 0) {
			await tx.evaluationAssignment.createMany({
				data: toAdd.map((x) => ({
				cycleId,
				evaluatorId: x.evaluatorId,
				evaluateeId,
				weightPercent: x.weightPercent ?? 0,
				})),
				skipDuplicates: true,
			});
		}

		// update weights (different value per row -> use Promise.all update)
		if (toUpdate.length > 0) {
			await Promise.all(
				toUpdate.map((x) =>
				tx.evaluationAssignment.updateMany({
					where: { cycleId, evaluateeId, evaluatorId: x.evaluatorId },
					data: { weightPercent: x.weightPercent ?? 0 },
				})
				)
			);
		}
	});

	return NextResponse.json({ ok: true });
}