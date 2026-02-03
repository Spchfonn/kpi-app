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

function assignmentPayload(a: {
	id: string;
	evalStatus: any;
	submittedAt: Date | null;
  }) {
	return {
	  id: a.id,
	  evalStatus: a.evalStatus,
	  submittedAt: a.submittedAt,
	};
}

// helper: order nodes consistent
const nodesInclude = {
	nodes: { orderBy: [{ parentId: "asc" as const }, { sortOrder: "asc" as const }] },
};  

export async function POST(req: Request, ctx: { params: Promise<{ assignmentId: string }> }) {
	try {
		const user = await requireUser();

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
			select: {
				id: true,
				cycleId: true,
				evaluatorId: true,
				evaluateeId: true,
				currentPlanId: true,
				evalStatus: true,
				submittedAt: true,
			},
		});
		if (!assignment) {
			return NextResponse.json({ ok: false, message: "Assignment not found" }, { status: 404 });
		}

		const cycle = await prisma.evaluationCycle.findUnique({
			where: { id: assignment.cycleId },
			select: { id: true, kpiDefineMode: true },
		});
		if (!cycle) forbid("cycle not found", 404);
		  
		if (!user.isAdmin && !isDefineOwner(user, cycle, assignment)) {
			return NextResponse.json({ ok:false, message:"forbidden" }, { status:403 });
		}

		const out = await prisma.$transaction(async (tx) => {
			// reuse latest DRAFT if exists (กัน create ซ้ำ)
			if (status === "DRAFT") {
				const existingDraft = await tx.kpiPlan.findFirst({
					where: { assignmentId, status: "DRAFT" },
					orderBy: [{ version: "desc" }],
					include: nodesInclude,
				});
		
				if (existingDraft) {
					return { assignment, plan: existingDraft, reused: true };
				}
			}
	  
			// next version
			const last = await tx.kpiPlan.findFirst({
				where: { assignmentId },
				orderBy: { version: "desc" },
				select: { version: true },
			});
			const nextVersion = (last?.version ?? 0) + 1;
	  
			const plan = await tx.kpiPlan.create({
				data: { assignmentId, version: nextVersion, status },
				include: nodesInclude,
			});
	  
			// ถ้าสร้าง ACTIVE ให้ set เป็น currentPlan ของ assignment ด้วย
			if (status === "ACTIVE") {
				await tx.evaluationAssignment.update({
					where: { id: assignmentId },
					data: { currentPlanId: plan.id },
				});
			}
	  
			return { assignment, plan, reused: false };
		  });

		  return NextResponse.json(
				{
				ok: true,
				data: {
					assignment: assignmentPayload(out.assignment),
					plan: out.plan,
				},
				reused: out.reused,
				},
				{ status: out.reused ? 200 : 201 }
		  	);
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
				submittedAt: true,
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

		// helper to load latest plan (include draft)
		const loadLatestPlan = async () => {
			return prisma.kpiPlan.findFirst({
				where: { assignmentId: assignment.id },
				orderBy: [{ version: "desc" }],
				include: { nodes: { orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }] } },
			});
		};
	  
		let plan: any = null;

		// admin: currentPlan if exists, else latest plan
		if (user.isAdmin) {
			plan = assignment.currentPlanId
			  ? await loadPlanById(assignment.currentPlanId)
			  : await loadLatestPlan();
	  
			return NextResponse.json({
				ok: true,
				data: { assignment: assignmentPayload(assignment), plan },
			});
		}

		// define owner: currentPlan if exists, else latest plan (including DRAFT)
		if (isDefineOwner(user, cycle, assignment)) {
			plan = assignment.currentPlanId
			  ? await loadPlanById(assignment.currentPlanId)
			  : await loadLatestPlan();
	  
			return NextResponse.json({
				ok: true,
				data: { assignment: assignmentPayload(assignment), plan },
			});
		}

		// confirmer: latest visible plan only (REQUESTED/CONFIRMED/REJECTED)
		if (isConfirmer(user, cycle, assignment)) {
			plan = await prisma.kpiPlan.findFirst({
				where: {
					assignmentId: assignment.id,
					confirmStatus: { in: ["REQUESTED", "CONFIRMED", "REJECTED"] },
				},
				orderBy: [{ version: "desc" }],
				include: nodesInclude,
			});
			return NextResponse.json({ ok: true, data: { assignment: assignmentPayload(assignment), plan } });
		}

		return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}