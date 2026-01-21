import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { Prisma } from "@prisma/client";

const schema = z.object({
		cycleId: z.number().int().positive(),
		evaluatorId: z.uuid(),
		evaluateeId: z.uuid(),
		weightPercent: z.number().min(0).max(100),
	}).superRefine((v, ctx) => {
	if (v.evaluatorId === v.evaluateeId) {
		ctx.addIssue({
		code: "custom",
		path: ["evaluateeId"],
		message: "evaluateeId must be different from evaluatorId",
		});
	}
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const v = schema.safeParse(body);
		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const { cycleId, evaluatorId, evaluateeId, weightPercent } = v.data;

		// check cycle exists
		const cycle = await prisma.evaluationCycle.findUnique({ where: { id: cycleId }, select: { id: true } });
		if (!cycle) {
			return NextResponse.json({ ok: false, message: "EvaluationCycle not found" }, { status: 404 });
		}

		// check employees exist
		const [evaluator, evaluatee] = await Promise.all([
			prisma.employee.findUnique({ where: { id: evaluatorId }, select: { id: true } }),
			prisma.employee.findUnique({ where: { id: evaluateeId }, select: { id: true } }),
		]);
		if (!evaluator) return NextResponse.json({ ok: false, message: "Evaluator not found" }, { status: 404 });
		if (!evaluatee) return NextResponse.json({ ok: false, message: "Evaluatee not found" }, { status: 404 });

		// create assignment (unique: cycleId+evaluatorId+evaluateeId)
		const created = await prisma.evaluationAssignment.create({
			data: {
				cycleId,
				evaluatorId,
				evaluateeId,
				weightPercent: new Prisma.Decimal(weightPercent),
			},
		});

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (err: any) {
		// handle unique conflict nicely
		if (err?.code === "P2002") {
			return NextResponse.json({ ok: false, message: "Assignment already exists for this cycle/evaluator/evaluatee" }, { status: 409 });
		}
		console.error("POST /api/evaluationAssignments error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}

// (optional) list assignments for admin page
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const cycleIdStr = searchParams.get("cycleId");
		const cycleId = cycleIdStr ? Number(cycleIdStr) : null;

		const rows = await prisma.evaluationAssignment.findMany({
			where: cycleId ? { cycleId } : undefined,
			orderBy: { createdAt: "desc" },
			include: {
				cycle: { select: { id: true, code: true, name: true, status: true } },
				evaluator: { select: { id: true, name: true, lastName: true, employeeNo: true } },
				evaluatee: { select: { id: true, name: true, lastName: true, employeeNo: true } },
				currentPlan: { select: { id: true, version: true, status: true } },
			},
		});

		return NextResponse.json({ ok: true, data: rows }, { status: 200 });
	} catch (err: any) {
		console.error("GET /api/evaluationAssignments error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}