import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadPlanContext } from "@/app/api/_lib/loadContext";
import { requireGate, forbid } from "@/app/api/_lib/kpiWorkflow";

export async function POST(req: Request, { params }: { params: Promise<{ planId: string }> }) {
    try {
        const { planId } = await params;
        const { user, plan, assignment, cycle, gates } = await loadPlanContext(planId);

        requireGate(gates, "DEFINE");
        if (cycle.closedAt) forbid("cycle closed");
        if (!user.isAdmin) forbid("admin only");
        if (assignment.evalStatus === "SUBMITTED") forbid("cannot reopen after submitted");
        if (!(plan.confirmStatus === "CONFIRMED" && plan.status === "ACTIVE")) forbid("only CONFIRMED/ACTIVE can reopen");

        const body = await req.json().catch(() => ({}));
        const note = (body?.note ?? "").toString().trim() || null;

        const now = new Date();

        const out = await prisma.$transaction(async (tx) => {
            const max = await tx.kpiPlan.findFirst({
                where: { assignmentId: assignment.id },
                orderBy: { version: "desc" },
                select: { version: true },
            });
            const nextVersion = (max?.version ?? 0) + 1;

            const newPlan = await tx.kpiPlan.create({
                data: {
                    assignmentId: assignment.id,
                    version: nextVersion,
                    status: "DRAFT",
                    confirmStatus: "DRAFT",
                    contentHash: null,
                },
                select: { id: true, version: true },
            });

            // copy nodes from old plan
            const oldNodes = await tx.kpiNode.findMany({
                where: { planId: plan.id },
                orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
                select: {
                id: true,
                nodeType: true,
                title: true,
                description: true,
                parentId: true,
                weightPercent: true,
                typeId: true,
                unit: true,
                startDate: true,
                endDate: true,
                sortOrder: true,
                },
            });

            const idMap = new Map<string, string>();

            for (const n of oldNodes) {
                const created = await tx.kpiNode.create({
                    data: {
                        planId: newPlan.id,
                        nodeType: n.nodeType,
                        title: n.title,
                        description: n.description,
                        parentId: null,
                        weightPercent: n.weightPercent,
                        typeId: n.typeId,
                        unit: n.unit,
                        startDate: n.startDate,
                        endDate: n.endDate,
                        sortOrder: n.sortOrder,
                        currentSubmissionId: null,
                    },
                    select: { id: true },
                });
                idMap.set(n.id, created.id);
            }

            for (const n of oldNodes) {
                if (!n.parentId) continue;
                await tx.kpiNode.update({
                    where: { id: idMap.get(n.id)! },
                    data: { parentId: idMap.get(n.parentId) ?? null },
                });
            }

            const needsReEval = assignment.evalStatus === "IN_PROGRESS" ? true : assignment.needsReEval;

            await tx.evaluationAssignment.update({
                where: { id: assignment.id },
                data: {
                    currentPlanId: newPlan.id,
                    needsReEval,
                // evaluatedPlanId stays as-is (points to plan evaluated before)
                },
            });

            const ev = await tx.kpiPlanConfirmEvent.create({
                data: {
                    planId: plan.id,
                    type: "REOPENED",
                    fromStatus: "CONFIRMED",
                    toStatus: "DRAFT",
                    actorId: user.employeeId ?? null,
                    note,
                    createdAt: now,
                    meta: { newPlanId: newPlan.id, newVersion: nextVersion },
                },
                select: { id: true },
            });

            return { newPlanId: newPlan.id, newVersion: nextVersion, refPlanEventId: ev.id };
        });

        return NextResponse.json({ ok: true, ...out });
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
    }
}