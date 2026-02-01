import crypto from "crypto";
import { DraftNodeInput } from "./type";

// decimal normalize
function normDec(v: string | number | undefined | null) {
	if (v === undefined || v === null) return "0.00";
	const n = typeof v === "string" ? Number(v) : v;
	if (!Number.isFinite(n)) return "0.00";
	return n.toFixed(2);
}
function normStr(v: any) {
	return (v ?? "").toString().trim();
}
function normDateIso(v?: string | null) {
	if (!v) return null;
	const d = new Date(v);
	if (Number.isNaN(d.getTime())) return null;
	return new Date(Math.floor(d.getTime() / 1000) * 1000).toISOString();
}

export function computeKpiContentHash(nodes: DraftNodeInput[]) {
	const children = new Map<string | null, DraftNodeInput[]>();
	for (const n of nodes) {
		const p = n.parentTempId ?? null;
		const arr = children.get(p) ?? [];
		arr.push(n);
		children.set(p, arr);
	}

	// stable sort
	for (const [k, arr] of children.entries()) {
		arr.sort((a, b) => {
		const ao = a.sortOrder ?? 0;
		const bo = b.sortOrder ?? 0;
		if (ao !== bo) return ao - bo;
		const at = normStr(a.title);
		const bt = normStr(b.title);
		if (at !== bt) return at.localeCompare(bt);
		return normStr(a.tempId).localeCompare(normStr(b.tempId));
		});
		children.set(k, arr);
	}

	const canon: any[] = [];
	let seq = 0;

	function walk(parentKey: number | null, parentTempId: string | null) {
		const list = children.get(parentTempId ?? null) ?? [];
		for (const n of list) {
		const myKey = seq++;
		canon.push({
			k: myKey,
			pk: parentKey,
			nodeType: n.nodeType,
			title: normStr(n.title),
			description: n.description ? normStr(n.description) : null,
			weightPercent: normDec(n.weightPercent),
			typeId: n.typeId ?? null,
			unit: n.unit ? normStr(n.unit) : null,
			startDate: normDateIso(n.startDate ?? null),
			endDate: normDateIso(n.endDate ?? null),
			sortOrder: n.sortOrder ?? 0,
		});
		walk(myKey, n.tempId);
		}
	}

	walk(null, null);

	const json = JSON.stringify(canon);
	return crypto.createHash("sha256").update(json).digest("hex");
}

export async function replacePlanNodes(tx: any, planId: string, nodes: DraftNodeInput[]) {
	await tx.kpiNode.deleteMany({ where: { planId } });

	const idMap = new Map<string, string>(); // tempId -> nodeId

	// create all nodes first
	for (const n of nodes) {
		const created = await tx.kpiNode.create({
		data: {
			planId,
			nodeType: n.nodeType,
			title: n.title,
			description: n.description ?? null,
			parentId: null,
			weightPercent: n.weightPercent,
			typeId: n.typeId ?? null,
			unit: n.unit ?? null,
			startDate: n.startDate ? new Date(n.startDate) : null,
			endDate: n.endDate ? new Date(n.endDate) : null,
			sortOrder: n.sortOrder ?? 0,
			currentSubmissionId: null,
		},
		select: { id: true },
		});
		idMap.set(n.tempId, created.id);
	}

	// update parents
	for (const n of nodes) {
		if (!n.parentTempId) continue;
		const id = idMap.get(n.tempId)!;
		const parentId = idMap.get(n.parentTempId) ?? null;
		await tx.kpiNode.update({ where: { id }, data: { parentId } });
	}
}