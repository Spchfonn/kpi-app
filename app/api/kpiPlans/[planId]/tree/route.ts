import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { Prisma } from "@prisma/client";

/**
 * Requirements:
 * 1) root nodes must have sum of weightPercent = 100
 * 2) GROUP must have children (>=1)
 * 3) ITEM cannot have children
 * 4) ITEM must have typeId, startDate, endDate
 * 5) ITEM: startDate <= endDate
 * 6) PUT tree: upsert + set parentId + set sortOrder + delete missing / 1 transaction
 */

// -----------------------------
// Zod Schemas
// -----------------------------
const NodeSchema: z.ZodType<any> = z.lazy(() =>
  z
	.object({
		id: z.uuid().optional(),

		nodeType: z.enum(["GROUP", "ITEM"]),
		title: z.string().min(1),
		description: z.string().optional().nullable(),
		weightPercent: z.number().min(0).max(100),

		// ITEM fields (optional in schema but enforced by refine)
		rubric: z.any().optional().nullable(),
		typeId: z.uuid().optional().nullable(),
		unit: z.string().optional().nullable(),
		startDate: z.iso.datetime().optional().nullable(),
		endDate: z.iso.datetime().optional().nullable(),

		children: z.array(NodeSchema).default([]),
	})
	.superRefine((n, ctx) => {
		// Rule 2: GROUP must have children
		if (n.nodeType === "GROUP") {
			if (!Array.isArray(n.children) || n.children.length === 0) {
				ctx.addIssue({
					code: "custom",
					path: ["children"],
					message: "ไม่สามารถบันทึกได้ เนื่องจากกลุ่ม KPI ต้องมีรายการย่อยอย่างน้อย 1 รายการ",
				});
			}

			// Defensive: GROUP should not have item-specific fields
			if (n.typeId) {
				ctx.addIssue({
					code: "custom",
					path: ["typeId"],
					message: "GROUP must not have typeId",
				});
			}
			if (n.unit) {
				ctx.addIssue({
					code: "custom",
					path: ["unit"],
					message: "GROUP must not have unit",
				});
			}
			if (n.startDate) {
				ctx.addIssue({
					code: "custom",
					path: ["startDate"],
					message: "GROUP must not have startDate",
				});
			}
			if (n.endDate) {
				ctx.addIssue({
					code: "custom",
					path: ["endDate"],
					message: "GROUP must not have endDate",
				});
			}
		}

		// ITEM rules
		if (n.nodeType === "ITEM") {
			// Rule 4: ITEM must have typeId, startDate, endDate
			if (!n.typeId) {
				ctx.addIssue({
					code: "custom",
					path: ["typeId"],
					message: "ไม่สามารถบันทึกได้ เนื่องจากรายการ KPI ต้องมีการระบุประเภท",
				});
			}
			if (!n.startDate) {
				ctx.addIssue({
					code: "custom",
					path: ["startDate"],
					message: "ไม่สามารถบันทึกได้ เนื่องจากรายการ KPI ต้องกำหนดช่วงเวลาเริ่มต้นและสิ้นสุด",
				});
			}
			if (!n.endDate) {
				ctx.addIssue({
					code: "custom",
					path: ["endDate"],
					message: "ไม่สามารถบันทึกได้ เนื่องจากรายการ KPI ต้องกำหนดช่วงเวลาเริ่มต้นและสิ้นสุด",
				});
			}

			// Rule 3: ITEM must not have children
			if (Array.isArray(n.children) && n.children.length > 0) {
				ctx.addIssue({
					code: "custom",
					path: ["children"],
					message: "ITEM must not have children",
				});
			}

			// Rule 5: startDate <= endDate
			if (n.startDate && n.endDate) {
				const sd = new Date(n.startDate);
				const ed = new Date(n.endDate);
				if (!Number.isNaN(sd.getTime()) && !Number.isNaN(ed.getTime())) {
					if (sd.getTime() > ed.getTime()) {
						ctx.addIssue({
							code: "custom",
							path: ["endDate"],
							message: "endDate must be >= startDate",
						});
					}
				}
			}
		}
	})
);

const PutTreeSchema = z.object({
  	nodes: z.array(NodeSchema),
});

// -----------------------------
// Helpers
// -----------------------------

function round2(n: number) {
	return Math.round(n * 100) / 100;
}

function validateWeightsSum100(arr: any[], where: string) {
	const sum = round2(arr.reduce((s, x) => s + Number(x.weightPercent ?? 0), 0));
	if (sum !== 100) {
		throw new Error(`ไม่สามารถบันทึกได้ กรุณาตรวจสอบค่าน้ำหนัก`);
	}
}

/**
 * Business rules (beyond Zod):
 * - root nodes sum = 100
 * - GROUP children sum = 100
 * - GROUP must have children
 * - ITEM must not have children
 */
function validateTreeBusiness(nodes: any[]) {
	if (!Array.isArray(nodes) || nodes.length === 0) {
		throw new Error("Root must have at least 1 node");
	}

	// Rule 1: root sum = 100
	validateWeightsSum100(nodes, "Root");

	const walk = (arr: any[], path: string) => {
		for (let i = 0; i < arr.length; i++) {
			const n = arr[i];
			const here = `${path}.${i + 1}`;

			if (n.nodeType === "GROUP") {
				// Rule 2
				if (!Array.isArray(n.children) || n.children.length === 0) {
					throw new Error(`GROUP must have children at ${here}`);
				}
				// children sum = 100
				validateWeightsSum100(n.children, `Children of ${here}`);
				walk(n.children, `${here}.children`);
			} 
			else if (n.nodeType === "ITEM") {
				// Rule 3
				if (Array.isArray(n.children) && n.children.length > 0) {
					throw new Error(`ITEM must not have children at ${here}`);
				}
				// no recurse
			} 
			else {
				throw new Error(`Unknown nodeType at ${here}`);
			}
		}
	};

	walk(nodes, "root");
}

function toDateOrNull(v: any) {
	if (v == null) return null;
	const d = new Date(v);
	if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${v}`);
	return d;
}

function flattenIds(nodes: any[]) {
	const ids: string[] = [];
	const walk = (arr: any[]) => {
		for (const n of arr) {
			if (n.id) ids.push(n.id);
			if (Array.isArray(n.children) && n.children.length > 0) walk(n.children);
		}
	};
	walk(nodes);
	return ids;
}

function attachTempKeys(nodes: any[]) {
	let seq = 0;
	const walk = (arr: any[]) => {
		for (const n of arr) {
			seq += 1;
			n.__tempKey = `n_${seq}`;
			if (Array.isArray(n.children) && n.children.length > 0) walk(n.children);
		}
	};
	walk(nodes);
}

// build tree + add displayNo
function buildTreeWithDisplayNo(flatNodes: any[]) {
	const byId = new Map<string, any>();
	const roots: any[] = [];

	for (const n of flatNodes) {
		byId.set(n.id, { ...n, children: [] });
	}

	for (const n of flatNodes) {
		const cur = byId.get(n.id);
		if (!n.parentId) roots.push(cur);
		else {
			const p = byId.get(n.parentId);
			if (p) p.children.push(cur);
			else roots.push(cur); // fallback
		}
	}

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

// -----------------------------
// PUT /api/plans/:planId/tree
// -----------------------------
export async function PUT(
	request: Request,
	ctx: { params: Promise<{ planId: string }> }
	) {
	try {
		const { planId } = await ctx.params;

		const body = await request.json();
		const parsed = PutTreeSchema.safeParse(body);
		if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, errors: z.treeifyError(parsed.error) },
			{ status: 400 }
		);
		}

		const nodes = parsed.data.nodes;

		// business validation
		try {
			validateTreeBusiness(nodes);
		} 
		catch (e: any) {
			return NextResponse.json(
				{ ok: false, message: e?.message ?? "Invalid tree" },
				{ status: 400 }
			);
		}

		// ensure plan exists
		const plan = await prisma.kpiPlan.findUnique({
			where: { id: planId },
			select: { id: true, assignmentId: true, version: true, status: true },
		});
		if (!plan) {
		return NextResponse.json(
			{ ok: false, message: "Plan not found" },
			{ status: 404 }
		);
		}

		// collect incoming ids (used for delete + anti cross-plan)
		const incomingIds = new Set(flattenIds(nodes));

		// attach temp keys for mapping parent-child during create
		attachTempKeys(nodes);

		const updatedPlan = await prisma.$transaction(async (tx) => {
			// fetch existing nodes of this plan
			const existing = await tx.kpiNode.findMany({
				where: { planId },
				select: { id: true },
			});
			const existingIds = new Set(existing.map((x) => x.id));

			// prevent cross-plan injection: every incoming id must be in this plan
			for (const id of incomingIds) {
				if (!existingIds.has(id)) {
					throw new Error(`Node id not found in this plan: ${id}`);
				}
			}

			// tempKey -> realId mapping
			const tempToReal = new Map<string, string>();

			// write tree in payload order; normalize sortOrder = 10,20,30... per siblings
			const writeLevel = async (arr: any[], parentTempKey: string | null) => {
				for (let i = 0; i < arr.length; i++) {
					const n = arr[i];
					const sortOrder = (i + 1) * 10;
					const parentRealId = parentTempKey
						? tempToReal.get(parentTempKey) ?? null
						: null;

					const data: Prisma.KpiNodeUncheckedCreateInput = {
						planId,
						parentId: parentRealId,
						sortOrder,

						nodeType: n.nodeType,
						title: n.title,
						description: n.description ?? null,
						weightPercent: new Prisma.Decimal(n.weightPercent),
						rubric: n.nodeType === "ITEM" ? (n.rubric ?? null) : null,

						// ITEM-only fields (GROUP will be forced null)
						typeId: n.nodeType === "ITEM" ? (n.typeId ?? null) : null,
						unit: n.nodeType === "ITEM" ? (n.unit ?? null) : null,
						startDate: n.nodeType === "ITEM" ? toDateOrNull(n.startDate) : null,
						endDate: n.nodeType === "ITEM" ? toDateOrNull(n.endDate) : null,
					};

					let realId: string;
					if (n.id) {
						const u = await tx.kpiNode.update({
							where: { id: n.id },
							data,
							select: { id: true },
						});
						realId = u.id;
					} 
					else {
						const c = await tx.kpiNode.create({
							data,
							select: { id: true },
						});
						realId = c.id;
						// (optional) reflect back into payload
						n.id = realId;
					}

					tempToReal.set(n.__tempKey, realId);

					// recurse for GROUP only (ITEM has no children by rule)
					if (n.nodeType === "GROUP") {
						await writeLevel(n.children ?? [], n.__tempKey);
					}
				}
			};

			await writeLevel(nodes, null);

			// delete nodes missing in payload
			const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
			if (toDelete.length > 0) {
				// delete submissions first to satisfy FK constraints
				await tx.kpiSubmission.deleteMany({ where: { nodeId: { in: toDelete } } });
				await tx.kpiNode.deleteMany({ where: { id: { in: toDelete } } });
			}

			// return plan with nodes for response building
			const planWithNodes = await tx.kpiPlan.findUnique({
				where: { id: planId },
				include: {
					nodes: {
						include: {
       					type: true,
						},
						orderBy: [
							{ parentId: "asc" },
							{ sortOrder: "asc" },
							{ createdAt: "asc" },
						],
					},
				},
			});

			return planWithNodes!;
		});

		const tree = buildTreeWithDisplayNo(updatedPlan.nodes);

		return NextResponse.json(
			{
				ok: true,
				data: {
				id: updatedPlan.id,
				assignmentId: updatedPlan.assignmentId,
				version: updatedPlan.version,
				status: updatedPlan.status,
				tree,
				updatedAt: updatedPlan.updatedAt,
				},
			},
			{ status: 200 }
		);
	} 
	catch (err: any) {
		console.error("PUT /api/plans/[planId]/tree error:", err);
		return NextResponse.json(
		{ ok: false, message: err?.message ?? "Internal Server Error" },
		{ status: 500 }
		);
	}
}
