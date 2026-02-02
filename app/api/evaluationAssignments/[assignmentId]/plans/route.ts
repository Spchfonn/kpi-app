import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";
import { forbid } from "@/app/api/_lib/kpiWorkflow";
import { isConfirmer, isDefineOwner } from "@/app/api/_lib/guards";

const schema = z.object({
	// optional: สร้าง draft หรือสร้างแล้ว active เลย
	status: z.enum(["DRAFT", "ACTIVE"]).optional(),
});

export async function POST(req: Request, ctx: { params: Promise<{ assignmentId: string }> }) {
	try {

		const { assignmentId } = await ctx.params;

		// console.log("DEBUG url", req.url);
		// console.log("DEBUG params", ctx.params);
		// console.log("DEBUG assignmentId", assignmentId);

		// console.log("DEBUG params keys:", Object.keys(ctx.params ?? {}));
		// console.log("DEBUG params:", ctx.params);

		if (!assignmentId) {
		return NextResponse.json(
			{ ok: false, message: "assignmentId missing from route params", debugUrl: req.url },
			{ status: 400 }
		);
		}

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
		console.error("POST /api/evaluationAssignments/[assignmentId]/plans error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}

export async function GET(_: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
	try {
		const { assignmentId } = await params;
		const user = await requireUser();

		const assignment = await prisma.evaluationAssignment.findUnique({
			where: { id: assignmentId },
			select: {
				id: true,
				cycleId: true,
				evaluatorId: true,
				evaluateeId: true,
				currentPlanId: true,
				evalStatus: true,
			},
		});
		if (!assignment) {
			forbid("assignment not found", 404);
			throw new Error();
		}

		const cycle = await prisma.evaluationCycle.findUnique({
			where: { id: assignment.cycleId },
			select: { id: true, kpiDefineMode: true },
		});
		if (!cycle) forbid("cycle not found", 404);

		// helper to load plan by id
		const loadPlanById = async (planId: string) => {
			return prisma.kpiPlan.findUnique({
				where: { id: planId },
				include: { nodes: { orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] } },
			});
		};
	  
		let plan: any = null;

		// admin: currentPlan
		if (user.isAdmin) {
			plan = assignment.currentPlanId ? await loadPlanById(assignment.currentPlanId) : null;
			return NextResponse.json({ ok: true, data: { assignment: { id: assignment.id, evalStatus: assignment.evalStatus }, plan } });
		}

		// define owner: currentPlan (including draft)
		if (isDefineOwner(user, cycle, assignment)) {
			plan = assignment.currentPlanId ? await loadPlanById(assignment.currentPlanId) : null;
			return NextResponse.json({ ok: true, data: { assignment: { id: assignment.id, evalStatus: assignment.evalStatus }, plan } });
		}

		// confirmer: latest visible plan only (REQUESTED/CONFIRMED/REJECTED)
		if (isConfirmer(user, cycle, assignment)) {
			plan = await prisma.kpiPlan.findFirst({
				where: {
					assignmentId: assignment.id,
					confirmStatus: { in: ["REQUESTED", "CONFIRMED", "REJECTED"] },
				},
				orderBy: [{ version: "desc" }],
				include: { nodes: { orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] } },
			});
			return NextResponse.json({ ok: true, data: { assignment: { id: assignment.id, evalStatus: assignment.evalStatus }, plan } });
		}

		return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}