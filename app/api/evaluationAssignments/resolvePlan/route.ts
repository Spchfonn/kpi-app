import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
	cyclePublicId: z.uuid(),
	evaluatorId: z.uuid(),
	evaluateeId: z.uuid(),
});

const PREFIX_TH: Record<"MR" | "MRS" | "MS", string> = {
	MR: "นาย",
	MRS: "นาง",
	MS: "นางสาว",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function createCurrentPlanWithRetry(assignmentId: string) {
	const MAX = 3;
  
	for (let attempt = 1; attempt <= MAX; attempt++) {
		try {
			return await prisma.$transaction(async (tx) => {
				// re-check currentPlanId in transaction for avoid race
				const a = await tx.evaluationAssignment.findUnique({
					where: { id: assignmentId },
					select: { currentPlanId: true },
				});
		
				if (a?.currentPlanId) {
					return { planId: a.currentPlanId, created: false as const };
				}
		
				const last = await tx.kpiPlan.findFirst({
					where: { assignmentId },
					orderBy: { version: "desc" },
					select: { version: true },
				});
		
				const nextVersion = (last?.version ?? 0) + 1;
		
				const plan = await tx.kpiPlan.create({
					data: { assignmentId, version: nextVersion, status: "DRAFT" },
					select: { id: true },
				});
		
				await tx.evaluationAssignment.update({
					where: { id: assignmentId },
					data: { currentPlanId: plan.id },
				});
		
				return { planId: plan.id, created: true as const };
			});
		} catch (err: any) {
			const msg = String(err?.message ?? "");
			const isWriteConflict =
			msg.includes("write conflict") || msg.includes("deadlock");
	
			if (isWriteConflict && attempt < MAX) {
				await sleep(60 * attempt);
				continue;
			}
			throw err;
		}
	}
  
	throw new Error("Failed to create plan after retries");
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);

		const v = schema.safeParse({
			cyclePublicId: searchParams.get("cyclePublicId") ?? "",
			evaluatorId: searchParams.get("evaluatorId") ?? "",
			evaluateeId: searchParams.get("evaluateeId") ?? "",
		});

		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const { cyclePublicId, evaluatorId, evaluateeId } = v.data;

		// 1) cycle from publicId (from sign in)
		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { 	id: true,
						publicId: true,
						name: true,
						status: true,
						startDate: true,
						endDate: true, },
		});

		if (!cycle) {
			return NextResponse.json({ ok: false, message: "Invalid cyclePublicId" }, { status: 400 });
		}

		// 2) get assignment
		const assignment = await prisma.evaluationAssignment.findUnique({
			where: {
				cycleId_evaluatorId_evaluateeId: {
						cycleId: cycle.id,
						evaluatorId,
						evaluateeId,
				},
			},
			select: {
				id: true,
				currentPlanId: true,
				cycleId: true,
				evaluatorId: true,
				evaluateeId: true,
				evaluatee: {
						// เพิ่มการ select ข้อมูลตำแหน่ง ระดับ และแผนกตรงนี้
						select: {
							prefixName: true,
							name: true,
							lastName: true,
							position: { select: { name: true } },     // ดึงชื่อตำแหน่ง
							level: { select: { name: true } },        // ดึงชื่อระดับ
							organization: { select: { name: true } }, // ดึงชื่อแผนก
						},
				}
			},
		});

		if (!assignment) {
			return NextResponse.json(
				{ ok: false, message: "No assignment for this evaluator/evaluatee in this cycle" },
				{ status: 403 }
			);
		}

		// 3) if has currentPlan, use it
		if (assignment.currentPlanId) {
			return NextResponse.json(
				{
					ok: true,
					data: {
						cycle: { 	id: cycle.publicId,
									name: cycle.name,
									status: cycle.status,
									startDate: cycle.startDate.toISOString(),
									endDate: cycle.endDate.toISOString(), },
						assignmentId: assignment.id,
						planId: assignment.currentPlanId,
						createdNewPlan: false,
						evaluatee: {
							fullNameTh: `${PREFIX_TH[assignment.evaluatee.prefixName]}${assignment.evaluatee.name} ${assignment.evaluatee.lastName}`,
							position: assignment.evaluatee.position,
							level: assignment.evaluatee.level,
							organization: assignment.evaluatee.organization,
						}
					},
				},
				{ status: 200 }
			);
		}

		// 4) if has not plan -> create new DRAFT plan and set currentPlanId
		const result = await createCurrentPlanWithRetry(assignment.id);

		return NextResponse.json(
		{
			ok: true,
			data: {
				cycle: { 	id: cycle.publicId,
							name: cycle.name,
							status: cycle.status,
							startDate: cycle.startDate.toISOString(),
							endDate: cycle.endDate.toISOString(), },
				assignmentId: assignment.id,
				planId: result.planId,
				createdNewPlan: result.created,
				evaluatee: {
					fullNameTh: `${PREFIX_TH[assignment.evaluatee.prefixName]}${assignment.evaluatee.name} ${assignment.evaluatee.lastName}`,
				}
			},
		},
		{ status: 200 }
		);
	} catch (err: any) {
		console.error("GET /api/evaluationAssignments/resolvePlan error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}