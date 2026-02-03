// app/api/dashboard/org-trend/route.ts
import { prisma } from "@/prisma/client";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

type CycleWithData = Prisma.EvaluationCycleGetPayload<{
  include: {
    assignments: {
      include: {
        evaluatee: {
          select: {
            organization: { select: { id: true; name: true } };
          };
        };
        evaluatedPlan: {
          select: {
            nodes: {
              select: {
                weightPercent: true;
                currentSubmission: { select: { finalScore: true } };
              };
            };
          };
        };
      };
    };
  };
}>;
export async function GET() {
  try {
    // 3. ดึงข้อมูล (Query เดิม)
    const cycles = await prisma.evaluationCycle.findMany({
      where: {
        status: { in: ["EVALUATE", "SUMMARY"] },
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

    // 4. ระบุ Type ใน .map ว่าตัวแปร cycle คือ CycleWithData
    const trendData = cycles.map((cycle: CycleWithData) => {
      // Group assignments by Department Name
      const deptMap = new Map<string, { totalScore: number; count: number }>();

      // TypeScript จะไม่ฟ้อง error ที่ assignment แล้ว เพราะรู้ Type จาก CycleWithData
      cycle.assignments.forEach((assignment) => {
        const deptName =
          assignment.evaluatee.organization?.name || "Unknown Dept";
        
        // Handle กรณี evaluatedPlan เป็น null (TypeScript จะบังคับให้เช็ค)
        const planNodes = assignment.evaluatedPlan?.nodes || [];

        // คำนวณคะแนนคนนี้
        let empScore = 0;
        let empWeight = 0;

        // TypeScript รู้จัก node แล้ว
        planNodes.forEach((node) => {
          const w = node.weightPercent ? Number(node.weightPercent) : 0;
          const s = node.currentSubmission?.finalScore ?? 0;
          empScore += s * w;
          empWeight += w;
        });

        const finalEmpScore = empWeight > 0 ? (empScore / empWeight) * 100 : 0;

        if (empWeight > 0) {
          const current = deptMap.get(deptName) || {
            totalScore: 0,
            count: 0,
          };
          deptMap.set(deptName, {
            totalScore: current.totalScore + finalEmpScore,
            count: current.count + 1,
          });
        }
      });

      // Format ข้อมูล
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
    return NextResponse.json(
      { error: "Failed to fetch trend data" },
      { status: 500 }
    );
  }
}