import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { loadPlanContext } from "@/app/api/_lib/loadContext";
import { requireGate, forbid } from "@/app/api/_lib/kpiWorkflow";
import { isDefineOwner } from "@/app/api/_lib/guards";
import { computeKpiContentHash, replacePlanNodes } from "@/app/api/_lib/kpiContent";
import { DraftNodeInput } from "@/app/api/_lib/type";

export async function POST(req: Request, { params }: { params: Promise<{ planId: string }> }) {
    try {
        const { planId } = await params;
        const { user, plan, assignment, cycle, gates } = await loadPlanContext(planId);

        requireGate(gates, "DEFINE");
        if (cycle.closedAt) forbid("cycle closed");
        if (assignment.evalStatus === "SUBMITTED") forbid("assignment already submitted");

        if (!user.isAdmin && !isDefineOwner(user, cycle, assignment)) forbid("not define owner");
        if (!["DRAFT", "REJECTED"].includes(plan.confirmStatus)) forbid("plan not editable");
        if (plan.status === "ARCHIVED") forbid("archived plan");

        const body = await req.json().catch(() => ({}));
        const nodes = (body?.nodes ?? []) as DraftNodeInput[];
        const note = (body?.note ?? "").toString().trim() || null;
        if (!Array.isArray(nodes) || nodes.length === 0) forbid("nodes is required", 400);

        const newHash = computeKpiContentHash(nodes);

        const out = await prisma.$transaction(async (tx) => {
            // does this plan already have any review rounds?
            const hasPastReviewRound = await tx.kpiPlanConfirmEvent.findFirst({
                where: { planId: plan.id, type: { in: ["REQUESTED", "REJECTED"] } },
                select: { id: true },
            });

            const oldHash = plan.contentHash;
            const contentChanged = !oldHash || oldHash !== newHash;

            const mustNewVersion = !!hasPastReviewRound && contentChanged;

            const createCommentEvent = async (targetPlanId: string, meta?: any) => {
                const ev = await tx.kpiPlanConfirmEvent.create({
                    data: {
                        planId: targetPlanId,
                        type: "COMMENTED",
                        actorId: user.employeeId ?? null,
                        note,
                        meta: meta ?? { contentChanged, mustNewVersion },
                    },
                    select: { id: true },
                });
                return ev.id;
            };

            if (!mustNewVersion) {
                await replacePlanNodes(tx, plan.id, nodes);
                const evId = await createCommentEvent(plan.id);
                await tx.kpiPlan.update({
                    where: { id: plan.id },
                    data: { contentHash: newHash },
                });
                return { ok: true, planId: plan.id, version: plan.version, newVersionCreated: false, refPlanEventId: evId };
            }

            // create new version
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
                    contentHash: newHash,
                },
                select: { id: true, version: true },
            });

            await replacePlanNodes(tx, newPlan.id, nodes);

            // L2: if in progress and evaluation tied to another plan -> needsReEval
            const willNeedReEval =
                assignment.evalStatus === "IN_PROGRESS" &&
                assignment.evaluatedPlanId != null &&
                assignment.evaluatedPlanId !== newPlan.id;

            await tx.evaluationAssignment.update({
                where: { id: assignment.id },
                data: {
                    currentPlanId: newPlan.id,
                    needsReEval: willNeedReEval ? true : assignment.needsReEval,
                },
            });

            const evId = await createCommentEvent(newPlan.id, {
                policy: "v2_new_version",
                contentChanged: true,
                prevPlanId: plan.id,
                prevVersion: plan.version,
            });

            return { ok: true, planId: newPlan.id, version: newPlan.version, newVersionCreated: true, refPlanEventId: evId };
        });

        return NextResponse.json(out);
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
    }
}