import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { PREFIX_TH } from "../../employees/route";

const schema = z.object({
	cyclePublicId: z.uuid(),
	evaluatorId: z.uuid(),
});

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		const v = schema.safeParse({
			cyclePublicId: searchParams.get("cyclePublicId") ?? "",
			evaluatorId: searchParams.get("evaluatorId") ?? "",
		});

		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const { cyclePublicId, evaluatorId } = v.data;

		// 1) cycle
		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true, publicId: true, name: true, status: true },
		});
		if (!cycle) {
			return NextResponse.json({ ok: false, message: "Invalid cyclePublicId" }, { status: 400 });
		}

		// 2) assignments where I am evaluator
		const assignments = await prisma.evaluationAssignment.findMany({
			where: {
				cycleId: cycle.id,
				evaluatorId,
			},
			orderBy: [{ createdAt: "asc" }],
			select: {
				id: true,
				evalStatus: true,
				weightPercent: true,
				currentPlanId: true,
				evaluatee: {
					select: {
						id: true,
						prefixName: true,
						name: true,
						lastName: true,
						nickname: true,
						employeeNo: true,
						email: true,
						isActive: true,
						organization: { select: { id: true, name: true } },
						position: { select: { id: true, name: true } },
						level: { select: { id: true, name: true, code: true } },
					},
				},
			},
		});

		// 3) shape for cards
		const data = assignments.map((a) => ({
			assignmentId: a.id,
			evalStatus: a.evalStatus,
			currentPlanId: a.currentPlanId,
			weightPercent: a.weightPercent, // decimal -> string usually
			evaluatee: {
				id: a.evaluatee.id,
				fullName: `${PREFIX_TH[a.evaluatee.prefixName]}${a.evaluatee.name} ${a.evaluatee.lastName}`,
				title: `${a.evaluatee.position?.name ?? ""} ${a.evaluatee.level?.code ?? ""}`.trim(),
				organization: a.evaluatee.organization?.name ?? "",
			},
		}));

		return NextResponse.json(
			{ ok: true, data: { cycle: { id: cycle.publicId, name: cycle.name, status: cycle.status }, items: data } },
			{ status: 200 }
		);
	} catch (err: any) {
		console.error("GET /api/evaluationAssignments/evaluatees error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}