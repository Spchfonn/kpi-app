import { prisma } from "@/prisma/client";

function bad(message: string, status = 400) {
	return Response.json({ ok: false, message }, { status });
}

type NodeDto = {
	id: string;
	nodeType: "GROUP" | "ITEM";
	title: string;
	description: string | null;
	weightPercent: number;
	typeId: string | null;
	unit: string | null;
	startDate: string | null;
	endDate: string | null;
	sortOrder: number;
	children: NodeDto[];
	displayNo?: string;
};

const toIso = (d: Date | null) => (d ? d.toISOString() : null);

function buildTree(rows: Array<{
	id: string;
	parentId: string | null;
	nodeType: any;
	title: string;
	description: string | null;
	weightPercent: any;
	typeId: string | null;
	unit: string | null;
	startDate: Date | null;
	endDate: Date | null;
	sortOrder: number;
	}>): NodeDto[] {

	const byId = new Map<string, NodeDto>();
	const roots: NodeDto[] = [];

	for (const r of rows) {
		byId.set(r.id, {
			id: r.id,
			nodeType: r.nodeType,
			title: r.title,
			description: r.description ?? null,
			weightPercent: Number(r.weightPercent ?? 0),
			typeId: r.typeId ?? null,
			unit: r.unit ?? null,
			startDate: toIso(r.startDate),
			endDate: toIso(r.endDate),
			sortOrder: r.sortOrder ?? 0,
			children: [],
		});
	}

	for (const r of rows) {
		const n = byId.get(r.id)!;
		if (!r.parentId) roots.push(n);
		else {
			const p = byId.get(r.parentId);
			if (p) p.children.push(n);
			else roots.push(n);
		}
	}

	const sortRec = (arr: NodeDto[]) => {
		arr.sort((a, b) => a.sortOrder - b.sortOrder);
		for (const x of arr) sortRec(x.children);
	};
	sortRec(roots);

	// displayNo: 1 / 1.1 / 1.2 ...
	const dfs = (arr: NodeDto[], prefix: string) => {
		arr.forEach((n, i) => {
			const no = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
			n.displayNo = no;
			if (n.children.length) dfs(n.children, no);
		});
	};
	dfs(roots, "");

	return roots;
}

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
	
		const cyclePublicId = searchParams.get("cyclePublicId") || "";
		const sourceEmployeeId = searchParams.get("sourceEmployeeId") || "";
	
		if (!cyclePublicId) return bad("missing cyclePublicId");
		if (!sourceEmployeeId) return bad("missing sourceEmployeeId");
	
		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true, publicId: true, startDate: true, endDate: true },
		});
		if (!cycle) return bad("cycle not found", 404);
	
		// find "any" assignment for this owner in this cycle (no evaluator constraint)
		// Prefer one that actually has currentPlanId
		const assignment = await prisma.evaluationAssignment.findFirst({
			where: {
				cycleId: cycle.id,
				evaluateeId: sourceEmployeeId,
				currentPlanId: { not: null },
			},
			select: { id: true, currentPlanId: true },
			orderBy: { updatedAt: "desc" as any },
		});
	
		if (!assignment?.currentPlanId) {
			return bad("source plan not found for this employee in this cycle", 404);
		}
	
		const sourcePlanId = assignment.currentPlanId;
	
		const rows = await prisma.kpiNode.findMany({
			where: { planId: sourcePlanId },
			select: {
				id: true,
				parentId: true,
				nodeType: true,
				title: true,
				description: true,
				weightPercent: true,
				typeId: true,
				type: { select: { id: true, type: true, name: true, rubric: true } },
				unit: true,
				startDate: true,
				endDate: true,
				sortOrder: true,
			},
			orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
		});
	
		const tree = buildTree(rows as any);
	
		return Response.json({
			ok: true,
			data: {
				sourcePlanId,
				cycle: {
					publicId: cycle.publicId,
					startDate: cycle.startDate.toISOString(),
					endDate: cycle.endDate.toISOString(),
				},
				tree,
			},
		});
	} catch (e: any) {
		console.error(e);
		return Response.json({ ok: false, message: e?.message ?? "server error" }, { status: 500 });
	}
}