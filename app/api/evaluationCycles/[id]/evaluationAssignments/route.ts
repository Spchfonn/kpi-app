import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

// util: remove duplicate by key
function uniqBy<T>(arr: T[], keyFn: (x: T) => string) {
	const m = new Map<string, T>();
	for (const x of arr) m.set(keyFn(x), x);
	return [...m.values()];
}

export async function GET(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
	) {
	const { id } = await params
	const cycleId = Number(id);
	if (!Number.isFinite(cycleId)) {
		return NextResponse.json({ ok: false, message: "invalid id" }, { status: 400 });
	}

	const { searchParams } = new URL(req.url);
	const groupBy = searchParams.get("groupBy") ?? "evaluator";

	if (!["evaluator", "evaluatee"].includes(groupBy)) {
		return NextResponse.json(
			{ ok: false, message: "groupBy must be evaluator or evaluatee" },
			{ status: 400 }
		);
	}

	const assignments = await prisma.evaluationAssignment.findMany({
		where: { cycleId },
		select: {
			evaluator: {
				select: {
					id: true,
					employeeNo: true,
					name: true,
					lastName: true,
					position: true,
					level: true,
				},
			},
			evaluatee: {
				select: {
					id: true,
					employeeNo: true,
					name: true,
					lastName: true,
					position: true,
					level: true,
				},
			},
		},
	});

	/**
	 * groupBy = evaluator
	 * [
	 *   { evaluator: A, evaluatees: [B,C] },
	 *   { evaluator: D, evaluatees: [E] }
	 * ]
	 */
	if (groupBy === "evaluator") {
		const evaluators = uniqBy(
			assignments.map((a) => a.evaluator).filter(Boolean),
			(u) => u.id
		);

		const groups = evaluators.map((ev) => {
			const evaluatees = uniqBy(
				assignments
				.filter((a) => a.evaluator?.id === ev.id)
				.map((a) => a.evaluatee)
				.filter(Boolean),
				(u) => u.id
			);

			return { evaluator: ev, evaluatees };
		});

		return NextResponse.json({ ok: true, data: groups });
	}

	/**
	 * groupBy = evaluatee
	 */
	const evaluatees = uniqBy(
		assignments.map((a) => a.evaluatee).filter(Boolean),
		(u) => u.id
	);

	const groups = evaluatees.map((ee) => {
		const evaluators = uniqBy(
			assignments
				.filter((a) => a.evaluatee?.id === ee.id)
				.map((a) => a.evaluator)
				.filter(Boolean),
			(u) => u.id
		);

		return {
			evaluator: ee,
			evaluatees: evaluators,
		};
	});

  	return NextResponse.json({ ok: true, data: groups });
}