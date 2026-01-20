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

export async function GET(
	_request: Request,
	ctx: { params: { planId: string } }
	) {
	try {
		const planId = ctx.params.planId;

		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: {
				id: true,
				assignmentId: true,
				version: true,
				status: true,
				updatedAt: true,
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

		return NextResponse.json(
		{
			ok: true,
			data: {
				id: plan.id,
				assignmentId: plan.assignmentId,
				version: plan.version,
				status: plan.status,
				updatedAt: plan.updatedAt,
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