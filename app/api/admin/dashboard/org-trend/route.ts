import { prisma } from "@/prisma/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {

    // 1) ดึงเฉพาะ cycle ที่มี CycleActivity type SUMMARY และ enabled = true
    const cycles = await prisma.evaluationCycle.findMany({
      where: {
        activities: {
          some: {
            type: "SUMMARY",
            enabled: true,
          },
        },
      },
      orderBy: [{ year: "asc" }, { round: "asc" }],
      include: {
        assignments: {
          where: { evalStatus: "SUBMITTED" },
          include: {
            evaluatee: {
              select: {
                organization: { select: { id: true, name: true } },
              },
            },
            evaluatedPlan: {
              select: {
                nodes: {
                  where: { nodeType: "ITEM" },
                  select: {
                    weightPercent: true,
                    currentSubmission: { select: { finalScore: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // 2) คำนวณ trendData (เฉลี่ยคะแนนตามแผนก ต่อ cycle)
    const trendData = cycles.map((cycle) => {
      const deptMap = new Map<string, { totalScore: number; count: number }>();

      cycle.assignments.forEach((assignment) => {
        const deptName = assignment.evaluatee.organization?.name || "Unknown Dept";
        const planNodes = assignment.evaluatedPlan?.nodes || [];

        let empScore = 0;
        let empWeight = 0;

        planNodes.forEach((node) => {
          const w = node.weightPercent ? Number(node.weightPercent) : 0;
          const s = node.currentSubmission?.finalScore ?? 0;
          empScore += s * w;
          empWeight += w;
        });

        // normalized
        const avgScore = empWeight > 0 ? (empScore / empWeight) : 0;
		const finalEmpScore = (avgScore / 5) * 100;

        if (empWeight > 0) {
          const current = deptMap.get(deptName) || { totalScore: 0, count: 0 };
          deptMap.set(deptName, {
            totalScore: current.totalScore + finalEmpScore,
            count: current.count + 1,
          });
        }
      });

      const deptScores: Record<string, number> = {};
      deptMap.forEach((val, key) => {
        deptScores[key] = parseFloat((val.totalScore / val.count).toFixed(2));
      });

      return {
        cycleId: cycle.id,
        cycleName: cycle.name,
        ...deptScores,
      };
    });

    return NextResponse.json({ data: trendData });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch trend data" }, { status: 500 });
  }
}