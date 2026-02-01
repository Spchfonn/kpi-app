import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

function bad(message: string, status = 400, extra?: any) {
	return NextResponse.json({ ok: false, message, ...(extra ?? {}) }, { status });
}

export async function DELETE(
	_req: Request,
	{ params }: { params: { assignmentId: string } | Promise<{ assignmentId: string }> }
	) {
	const p = await params;
	const assignmentId = p.assignmentId;

	if (!assignmentId || typeof assignmentId !== "string") {
		return bad("invalid id", 400);
	}

	// 1) หา assignment ก่อน
	const assignment = await prisma.evaluationAssignment.findUnique({
		where: { id: assignmentId },
		select: {
		id: true,
		cycleId: true,
		currentPlanId: true,
		},
	});

	if (!assignment) {
		return bad("not found", 404);
	}

	// 2) เช็คว่ามี plan ไหม (ถ้ามี ห้ามลบ)
	const planCount = await prisma.kpiPlan.count({
		where: { assignmentId },
	});

	if (planCount > 0) {
		return bad(
		"ลบไม่ได้ เนื่องจากคู่ประเมินนี้มีแผน KPI (KpiPlan) แล้ว",
		409,
		{ reason: { planCount, currentPlanId: assignment.currentPlanId } }
		);
	}

	try {
		// 3) ลบใน transaction (กันเคส currentPlanId ค้าง แม้ปกติควรเป็น null ถ้าไม่มี plan)
		await prisma.$transaction(async (tx) => {
		// กันไว้ก่อน: เคลียร์ currentPlanId (เผื่อเคยมีข้อมูลเพี้ยน)
		if (assignment.currentPlanId) {
			await tx.evaluationAssignment.update({
			where: { id: assignmentId },
			data: { currentPlanId: null },
			});
		}

		await tx.evaluationAssignment.delete({
			where: { id: assignmentId },
		});
		});

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return bad("delete failed", 500, { detail: e?.message ?? String(e) });
	}
}