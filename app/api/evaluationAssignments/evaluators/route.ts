import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { PREFIX_TH } from "../../employees/route"; 

const schema = z.object({
  cyclePublicId: z.uuid(),
  evaluateeId: z.uuid(),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const v = schema.safeParse({
      cyclePublicId: searchParams.get("cyclePublicId") ?? "",
      evaluateeId: searchParams.get("evaluateeId") ?? "",
    });

    if (!v.success) {
      return NextResponse.json({ ok: false, errors: v.error.format() }, { status: 400 });
    }

    const { cyclePublicId, evaluateeId } = v.data;

    // 1) Find Cycle (เพื่อเอา internal ID)
    const cycle = await prisma.evaluationCycle.findUnique({
      where: { publicId: cyclePublicId },
      select: { id: true, publicId: true, name: true, status: true, kpiDefineMode: true },
    });

    if (!cycle) {
      return NextResponse.json({ ok: false, message: "Invalid cyclePublicId" }, { status: 400 });
    }

    // 2) Find Assignments where I am the evaluatee (หาคนมาประเมินเรา)
    const assignments = await prisma.evaluationAssignment.findMany({
      where: {
        cycleId: cycle.id,
        evaluateeId, // filter ด้วย evaluateeId
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
			evalStatus: true,
        currentPlanId: true,
        weightPercent: true,
        currentPlan: {
            select: {
                confirmStatus: true
            }
        },
        evaluator: {
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

    // 3) Map data shape
		const data = assignments.map((a) => ({
			assignmentId: a.id,
			evalStatus: a.evalStatus,
			currentPlanId: a.currentPlanId,
			weightPercent: a.weightPercent,
      confirmStatus: a.currentPlan?.confirmStatus,
			evaluator: {
				id: a.evaluator.id,
				fullName: `${PREFIX_TH[a.evaluator.prefixName]}${a.evaluator.name} ${a.evaluator.lastName}`,
				title: `${a.evaluator.position?.name ?? ""} ${a.evaluator.level?.code ?? ""}`.trim(),
				organization: a.evaluator.organization?.name ?? "",
			},
		}));

		return NextResponse.json(
			{ ok: true, data: { cycle: { id: cycle.publicId, name: cycle.name, status: cycle.status }, items: data, kpiDefineMode: cycle?.kpiDefineMode } },
			{ status: 200 }
   	);
	} catch (err: any) {
		console.error("GET /api/evaluationAssignments/evaluators error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
  }
}