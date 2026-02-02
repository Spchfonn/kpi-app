import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

// util: remove duplicate by key
function uniqBy<T>(arr: T[], keyFn: (x: T) => string) {
	const m = new Map<string, T>();
	for (const x of arr) m.set(keyFn(x), x);
	return [...m.values()];
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id: cyclePublicId } = await params;
	if (!cyclePublicId) {
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

	// 1) lookup cycle db id
	const cycle = await prisma.evaluationCycle.findUnique({
		where: { publicId: cyclePublicId },
		select: { id: true },
	});

	if (!cycle) {
		return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });
	}

	const cycleId = cycle.id;

	// 2) fetch assignments
	const assignments = await prisma.evaluationAssignment.findMany({
		where: { cycleId },
		select: {
			id: true,
			weightPercent: true,
			evaluator: {
				select: {
				id: true,
				employeeNo: true,
				name: true,
				lastName: true,
				position: { select: { name: true } },
				level: { select: { name: true } },
				},
			},
			evaluatee: {
				select: {
				id: true,
				employeeNo: true,
				name: true,
				lastName: true,
				position: { select: { name: true } },
				level: { select: { name: true } },
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
			assignments.map((a) => a.evaluator).filter(Boolean) as any[],
			(u: any) => u.id
		);

		const groups = evaluators.map((ev: any) => {
			const rows = assignments.filter((a) => a.evaluator?.id === ev.id);

			const evaluatees = rows.map((a) => ({
				...a.evaluatee!,
				weightPercent: a.weightPercent ?? 0,
				pairId: a.id,
			}));

			return { evaluator: ev, evaluatees };
		});

		return NextResponse.json({ ok: true, data: groups });
	}

	/**
	 * groupBy = evaluatee
	 */
	const evaluatees = uniqBy(
		assignments.map((a) => a.evaluatee).filter(Boolean) as any[],
		(u: any) => u.id
	);

	const groups = evaluatees.map((ee: any) => {
		const rows = assignments.filter((a) => a.evaluatee?.id === ee.id);

		const evaluators = rows.map((a) => ({
			...a.evaluator!,
			weightPercent: a.weightPercent ?? 0,
			pairId: a.id,
		}));

		return { evaluator: ee, evaluatees: evaluators };
	});

	return NextResponse.json({ ok: true, data: groups });
}