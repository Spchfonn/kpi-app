import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";
import { NotificationType } from "@prisma/client";

async function notifyPlan(tx: any, args: {
    type: NotificationType;
    actorEmployeeId: string;
    cycleId: number;
    planId: string;
    assignmentId: string;
    evaluatorId: string;
    evaluateeId: string;
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
        meta: {
            planId: args.planId,
            assignmentId: args.assignmentId,
            evaluatorId: args.evaluatorId,
            evaluateeId: args.evaluateeId,
        },
        refPlanId: args.planId,
        refAssignmentId: args.assignmentId,
        recipients: {
            createMany: { data: users.map((u: any) => ({ userId: u.id })), skipDuplicates: true },
        },
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
                assignment: { select: { cycleId: true, evaluatorId: true, evaluateeId: true, currentPlanId: true } },
            },
        });
        if (!plan || !plan.assignment) return NextResponse.json({ ok: false, message: "Plan not found" }, { status: 404 });

        // must be current plan
        if (plan.assignment.currentPlanId !== plan.id)
        return NextResponse.json({ ok: false, message: "ไม่ใช่ current plan" }, { status: 400 });

        // must be evaluatee
        if (user.employeeId !== plan.assignment.evaluateeId)
        return NextResponse.json({ ok: false, message: "ไม่มีสิทธิ์" }, { status: 403 });

        // must be REQUESTED and send to evaluatee
        if (plan.confirmStatus !== "REQUESTED" || plan.confirmTarget !== "EVALUATEE")
        return NextResponse.json({ ok: false, message: "คำขอไม่อยู่ในสถานะที่รับรองได้" }, { status: 400 });

        await prisma.$transaction(async (tx) => {
            await tx.kpiPlan.update({
                where: { id: planId },
                data: { confirmStatus: "REJECTED",
                        confirmTarget: null,
                        confirmRequestedAt: null,
                        confirmRequestedById: null, },
            });

            // mark previous request to DONE
            const evaluateeUser = await tx.user.findFirst({
                where: { employeeId: plan.assignment!.evaluateeId },
                select: { id: true },
            });
            if (evaluateeUser) {
                await tx.notificationRecipient.updateMany({
                    where: {
                        userId: evaluateeUser.id,
                        actionStatus: "OPEN",
                        notification: {
                        type: NotificationType.EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI,
                        refPlanId: planId,
                        },
                    },
                    data: { actionStatus: "DONE", actionAt: new Date() },
                });
            }

            // send noti to evaluator that evaluatee already rejected
            await notifyPlan(tx, {
                type: NotificationType.EVALUATEE_REJECT_EVALUATOR_KPI,
                actorEmployeeId: user.employeeId,
                cycleId: plan.assignment!.cycleId,
                planId,
                assignmentId: plan.assignmentId,
                evaluatorId: plan.assignment!.evaluatorId,
                evaluateeId: plan.assignment!.evaluateeId,
                recipientEmployeeIds: [plan.assignment!.evaluatorId],
            });
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
    }
}