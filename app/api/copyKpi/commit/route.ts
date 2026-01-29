import { prisma } from "@/prisma/client";

function bad(message: string, status = 400) {
	return Response.json({ ok: false, message }, { status });
}

type Body = {
	targetPlanId: string;
	sourcePlanId: string;
	nodeIds: string[];
};

type SrcRow = {
	id: string;
	parentId: string | null;
	nodeType: "GROUP" | "ITEM";
	title: string;
	description: string | null;
	weightPercent: any; // Decimal
	typeId: string | null;
	unit: string | null;
	startDate: Date | null;
	endDate: Date | null;
	sortOrder: number;
};

function collectItemsAndAncestors( selectedIds: string[], byId: Map<string, SrcRow> ) {
	const out = new Set<string>();
  
	// 1) get only selected item
	const itemIds = selectedIds.filter((id) => byId.get(id)?.nodeType === "ITEM");
	if (itemIds.length === 0) return { out, itemIds };
  
	// 2) get parent of selected item
	for (const id of itemIds) {
		let cur: SrcRow | undefined = byId.get(id);
		while (cur) {
			if (out.has(cur.id)) break;
			out.add(cur.id);
			if (!cur.parentId) break;
			cur = byId.get(cur.parentId);
		}
	}
  
	return { out, itemIds };
}

function buildChildrenMap(rows: SrcRow[]) {
	const m = new Map<string | null, SrcRow[]>();
	for (const r of rows) {
		const key = r.parentId ?? null;
		const arr = m.get(key) ?? [];
		arr.push(r);
		m.set(key, arr);
	}
	for (const [k, arr] of m.entries()) {
		arr.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
		m.set(k, arr);
	}
	return m;
}

function collectSubtree(startIds: string[], byId: Map<string, SrcRow>, childrenMap: Map<string | null, SrcRow[]>) {
	const out = new Set<string>();
	const stack = [...startIds];

	while (stack.length) {
		const id = stack.pop()!;
		if (out.has(id)) continue;

		const row = byId.get(id);
		if (!row) continue;

		out.add(id);

		if (row.nodeType === "GROUP") {
			const kids = childrenMap.get(id) ?? [];
			for (const k of kids) stack.push(k.id);
		}
	}

	return out;
}

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
	}>): any[] {

	const byId = new Map<string, any>();
	const roots: any[] = [];

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
		const n = byId.get(r.id);
		if (!r.parentId) roots.push(n);
		else {
			const p = byId.get(r.parentId);
			if (p) p.children.push(n);
			else roots.push(n);
		}
	}

	const sortRec = (arr: any[]) => {
		arr.sort((a, b) => a.sortOrder - b.sortOrder);
		for (const x of arr) sortRec(x.children);
	};
	sortRec(roots);

	const dfs = (arr: any[], prefix: string) => {
		arr.forEach((n, i) => {
			const no = prefix ? `${prefix}.${i + 1}` : `${i + 1}`;
			n.displayNo = no;
			if (n.children.length) dfs(n.children, no);
		});
	};
	dfs(roots, "");

	return roots;
}

export async function POST(req: Request) {
	try {
		const body = (await req.json()) as Body;
		const { targetPlanId, sourcePlanId, nodeIds } = body;

		if (!targetPlanId) return bad("missing targetPlanId");
		if (!sourcePlanId) return bad("missing sourcePlanId");
		if (!Array.isArray(nodeIds) || nodeIds.length === 0) return bad("missing nodeIds");

		// check plan
		const [targetPlan, sourcePlan] = await Promise.all([
			prisma.kpiPlan.findUnique({ where: { id: targetPlanId }, select: { id: true } }),
			prisma.kpiPlan.findUnique({ where: { id: sourcePlanId }, select: { id: true } }),
		]);
		if (!targetPlan) return bad("targetPlan not found", 404);
		if (!sourcePlan) return bad("sourcePlan not found", 404);

		// get all source nodes for create subtree
		const srcRows = (await prisma.kpiNode.findMany({
			where: { planId: sourcePlanId },
			select: {
				id: true,
				parentId: true,
				nodeType: true,
				title: true,
				description: true,
				weightPercent: true,
				typeId: true,
				unit: true,
				startDate: true,
				endDate: true,
				sortOrder: true,
			},
			orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
		})) as any as SrcRow[];

		const byId = new Map(srcRows.map((r) => [r.id, r]));
		const childrenMap = buildChildrenMap(srcRows);

		// copy only selected ITEM + its ancestors (groups)
		// ignore selected GROUP ids (they are implicit)
		const { out: requiredIds, itemIds } = collectItemsAndAncestors(nodeIds, byId);

		if (itemIds.length === 0) {
			return bad("please select at least 1 ITEM node to copy");
		}

		const toCopy = srcRows.filter((r) => requiredIds.has(r.id));
		if (toCopy.length === 0) return bad("no nodes to copy");

		// roots = nodes whose parent is not included (top of each copied chain)
		const selectedRoots = toCopy.filter((r) => !r.parentId || !requiredIds.has(r.parentId));

		// map oldId -> newId
		const idMap = new Map<string, string>();
		for (const r of toCopy) idMap.set(r.id, crypto.randomUUID());

		await prisma.$transaction(async (tx) => {
			// find latest sortOrder root of target to append in list
			const lastRoot = await tx.kpiNode.findFirst({
				where: { planId: targetPlanId, parentId: null },
				select: { sortOrder: true },
				orderBy: { sortOrder: "desc" },
			});
			let rootSortCursor = (lastRoot?.sortOrder ?? 0) + 1;

			// create parent before child: by pending loop
			const pending = new Set(toCopy.map((r) => r.id));

			for (let guard = 0; guard < 10000 && pending.size > 0; guard++) {
				let progressed = false;

				for (const oldId of Array.from(pending)) {
					const r = byId.get(oldId)!;

					const parentOld = r.parentId;
					const parentIsInCopiedSet = !!parentOld && requiredIds.has(parentOld);
					if (parentIsInCopiedSet && pending.has(parentOld!)) continue;

					const newId = idMap.get(oldId)!;

					const isPastedRoot = selectedRoots.some((x) => x.id === oldId);
					const parentNew = isPastedRoot ? null : parentIsInCopiedSet ? idMap.get(parentOld!)! : null;

					const sortOrderNew = isPastedRoot ? rootSortCursor++ : (r.sortOrder ?? 0);

					await tx.kpiNode.create({
						data: {
							id: newId,
							planId: targetPlanId,
							parentId: parentNew,

							nodeType: r.nodeType,
							title: r.title,
							description: r.description ?? null,
							weightPercent: r.weightPercent, // Decimal

							sortOrder: sortOrderNew,

							// ITEM only
							typeId: r.nodeType === "ITEM" ? r.typeId : null,
							unit: r.nodeType === "ITEM" ? r.unit : null,
							startDate: r.nodeType === "ITEM" ? r.startDate : null,
							endDate: r.nodeType === "ITEM" ? r.endDate : null,
						},
					});

					pending.delete(oldId);
					progressed = true;
				}

				if (!progressed) {
					throw new Error("cannot resolve parent-child creation order");
				}
			}
		});

		// send tree of target back (refresh defineKpi display)
		const targetRows = await prisma.kpiNode.findMany({
			where: { planId: targetPlanId },
			select: {
				id: true,
				parentId: true,
				nodeType: true,
				title: true,
				description: true,
				weightPercent: true,
				typeId: true,
				unit: true,
				startDate: true,
				endDate: true,
				sortOrder: true,
			},
			orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
		});

		return Response.json({
			ok: true,
			data: {
				tree: buildTree(targetRows as any),
			},
		});
	} catch (e: any) {
		console.error(e);
		return Response.json({ ok: false, message: e?.message ?? "server error" }, { status: 500 });
	}
}