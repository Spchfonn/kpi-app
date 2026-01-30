import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import type { NotificationType } from "@prisma/client";
import { requireUser } from "@/app/lib/auth";

type Body = { reason?: string };

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
		const body: Body = await req.json().catch(() => ({}));

		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				confirmStatus: true,
				confirmTarget: true,
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

		const mustBe = plan.confirmTarget === "EVALUATOR" ? plan.assignment.evaluatorId : plan.assignment.evaluateeId;
		if (user.employeeId !== mustBe) return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์ปฏิเสธ" }, { status: 403 });

		const notiType: NotificationType = plan.confirmTarget === "EVALUATOR" ? "EVALUATOR_REJECT_EVALUATEE_KPI" : "EVALUATEE_REJECT_EVALUATOR_KPI";

		const recipientEmployeeIds = [plan.assignment.evaluatorId, plan.assignment.evaluateeId].filter((x) => x !== user.employeeId);

		await prisma.$transaction(async (tx) => {
			await tx.kpiPlan.update({
				where: { id: planId },
				data: {
					confirmStatus: "REJECTED",
					rejectedAt: new Date(),
					rejectedById: user.employeeId,
					rejectReason: body.reason ?? null,
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
		console.error("POST /api/kpiPlans/[planId]/reject error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}