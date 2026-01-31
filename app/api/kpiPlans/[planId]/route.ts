import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

/**
 * GET /api/plans/:planId
 * - Return plan info + KPI tree (nested) + displayNo
 * - Ordering: sortOrder ASC, tie-break createdAt ASC
 */

function buildTreeWithDisplayNo(flatNodes: any[]) {
	const byId = new Map<string, any>();
	const roots: any[] = [];

	// create node shells
	for (const n of flatNodes) {
		byId.set(n.id, { ...n, children: [] });
	}

	// attach to parent
	for (const n of flatNodes) {
		const cur = byId.get(n.id);
		if (!n.parentId) roots.push(cur);
		else {
			const p = byId.get(n.parentId);
			if (p) p.children.push(cur);
			else roots.push(cur); // fallback if broken relation
		}
	}

	// sort + add displayNo recursively
	const addNo = (arr: any[], prefix: string | null) => {
		arr.sort(
		(a, b) =>
			a.sortOrder - b.sortOrder ||
			+new Date(a.createdAt) - +new Date(b.createdAt)
		);

		arr.forEach((node, idx) => {
			const no = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
			node.displayNo = no;
			if (node.children?.length) addNo(node.children, no);
		});
	};

	addNo(roots, null);
	return roots;
}

const PREFIX_TH: Record<"MR" | "MRS" | "MS", string> = { MR: "นาย", MRS: "นาง", MS: "นางสาว" };

function buildEmployeeName(e: any) {
	if (!e) return "-";
	const p = e.prefixName as "MR" | "MRS" | "MS" | null | undefined;
	const prefixTh = p ? PREFIX_TH[p] : "";
	const first = e.name ?? "";
	const last = e.lastName ? ` ${e.lastName}` : "";
	return `${prefixTh}${first}${last}`.trim() || e.employeeNo || "-";
}

export async function GET(
	_request: Request,
	ctx: { params: Promise<{ planId: string }> }
	) {
	try {
		const { planId } = await ctx.params;

		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				assignmentId: true,
				version: true,
				status: true,
				updatedAt: true,
				confirmRequestedAt: true,
				confirmStatus: true,
    			confirmTarget: true,
				assignment: {
					select: {
						cycle: { select: { startDate: true, endDate: true } },
						evaluatee: { select: { prefixName: true, name: true, lastName: true, employeeNo: true } },
						evaluator: { select: { prefixName: true, name: true, lastName: true, employeeNo: true } },
					},
				},
				nodes: {
					orderBy: [
						{ parentId: "asc" },
						{ sortOrder: "asc" },
						{ createdAt: "asc" },
					],
					include: {
						type: { select: { id: true, type: true, name: true, rubric: true } },
					},
				},
			},
		});

		if (!plan) {
			return NextResponse.json(
				{ ok: false, message: "Plan not found" },
				{ status: 404 }
			);
		}

		const tree = buildTreeWithDisplayNo(plan.nodes);

		const evaluatee = plan.assignment?.evaluatee;
		const evaluator = plan.assignment?.evaluator;

		return NextResponse.json(
		{
			ok: true,
			data: {
				id: plan.id,
				assignmentId: plan.assignmentId,
				version: plan.version,
				status: plan.status,
				updatedAt: plan.updatedAt,
				confirmRequestedAt: plan.confirmRequestedAt,
				confirmStatus: plan.confirmStatus,
				confirmTarget: plan.confirmTarget,
				cycle: plan.assignment?.cycle ?? null,
				evaluatee: evaluatee
					? { fullNameTh: buildEmployeeName(evaluatee), employeeNo: evaluatee.employeeNo }
					: null,
				evaluator: evaluator
					? { fullNameTh: buildEmployeeName(evaluator), employeeNo: evaluator.employeeNo }
					: null,
				tree,
			},
		},
		{ status: 200 }
		);
	} catch (err: any) {
		console.error("GET /api/plans/[planId] error:", err);
		return NextResponse.json(
			{ ok: false, message: err?.message ?? "Internal Server Error" },
			{ status: 500 }
		);
	}
}