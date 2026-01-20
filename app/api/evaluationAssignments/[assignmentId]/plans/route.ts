import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
	// optional: สร้าง draft หรือสร้างแล้ว active เลย
	status: z.enum(["DRAFT", "ACTIVE"]).optional(),
});

export async function POST(req: Request, ctx: { params: { assignmentId: string } }) {
	try {
		const assignmentId = ctx.params.assignmentId;

		const body = await req.json().catch(() => ({}));
		const v = schema.safeParse(body);
		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const status = v.data.status ?? "DRAFT";

		const assignment = await prisma.evaluationAssignment.findUnique({
			where: { id: assignmentId },
			select: { id: true },
		});
		if (!assignment) {
			return NextResponse.json({ ok: false, message: "Assignment not found" }, { status: 404 });
		}

		// next version
		const last = await prisma.kpiPlan.findFirst({
			where: { assignmentId },
			orderBy: { version: "desc" },
			select: { version: true },
		});
		const nextVersion = (last?.version ?? 0) + 1;

		const created = await prisma.$transaction(async (tx) => {
			const plan = await tx.kpiPlan.create({
				data: { assignmentId, version: nextVersion, status },
			});

			// ถ้าสร้าง ACTIVE ให้ set เป็น currentPlan ของ assignment ด้วย
			if (status === "ACTIVE") {
				await tx.evaluationAssignment.update({
					where: { id: assignmentId },
					data: { currentPlanId: plan.id },
				});
			}

			return plan;
		});

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (err: any) {
		console.error("POST /api/assignments/[assignmentId]/plans error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}