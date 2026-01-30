import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import type { NotificationType } from "@prisma/client";
import { requireUser } from "@/app/lib/auth";

async function notifyPlan(tx: any, args: {
	type: NotificationType;
	actorEmployeeId: string;
	cycleId: number;
	planId: string;
	assignmentId: string;
	recipientEmployeeIds: string[];
	}) {
	const users = await tx.user.findMany({
		where: { employeeId: { in: args.recipientEmployeeIds } },
		select: { id: true },
	});
	if (!users.length) return;

	await tx.notification.create({
		data: {
			type: args.type,
			actorId: args.actorEmployeeId,
			cycleId: args.cycleId,
			meta: { planId: args.planId, assignmentId: args.assignmentId },
			recipients: { createMany: { data: users.map((u: any) => ({ userId: u.id })), skipDuplicates: true } },
		},
	});
}

export async function POST(req: Request, ctx: { params: Promise<{ planId: string }> }) {
	try {
		const user = await requireUser();
		const { planId } = await ctx.params;

		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				confirmStatus: true,
				confirmTarget: true,
				confirmRequestedById: true,
				assignmentId: true,
				assignment: { select: { id: true, cycleId: true, evaluatorId: true, evaluateeId: true, currentPlanId: true } },
			},
		});
		if (!plan || !plan.assignment) return NextResponse.json({ ok: false, message: "Plan not found" }, { status: 404 });
		if (plan.assignment.currentPlanId !== plan.id) {
			return NextResponse.json({ ok: false, message: "ไม่ใช่ current plan ของ assignment" }, { status: 400 });
		}
		if (plan.confirmStatus !== "REQUESTED") {
			return NextResponse.json({ ok: false, message: "plan ไม่ได้อยู่ในสถานะ REQUESTED" }, { status: 400 });
		}

		if (plan.confirmTarget !== "EVALUATEE") {
			return NextResponse.json({ ok: false, message: "ยกเลิกได้เฉพาะคำขอที่ส่งไป evaluatee" }, { status: 400 });
		}

		const isEvaluator = user.employeeId === plan.assignment.evaluatorId;
		const isRequester = user.employeeId === plan.confirmRequestedById;
		if (!isEvaluator && !isRequester) return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์ยกเลิก" }, { status: 403 });

		const notiType: NotificationType = "EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI";
		const recipientEmployeeIds = [plan.assignment.evaluateeId];

		await prisma.$transaction(async (tx) => {
			await tx.kpiPlan.update({
				where: { id: planId },
				data: {
					confirmStatus: "CANCELLED",
					confirmTarget: null,
					confirmRequestedAt: null,
					confirmRequestedById: null,
				},
			});

			await notifyPlan(tx, {
				type: notiType,
				actorEmployeeId: user.employeeId,
				cycleId: plan.assignment.cycleId,
				planId,
				assignmentId: plan.assignmentId,
				recipientEmployeeIds,
			});
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err: any) {
		console.error("POST /api/kpiPlans/[planId]/cancelRequestConfirm error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}