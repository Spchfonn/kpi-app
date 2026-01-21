import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { makeKpiTypePatchSchema } from "../_schemas";

export async function PATCH(req: Request, ctx: { params: Promise<{ typeId: string }> }) {
	try {
		const { typeId } = await ctx.params;

		// fetch existing type first
		const existing = await prisma.kpiType.findUnique({
			where: { id: typeId },
			select: { id: true, type: true },
		});
		if (!existing) {
			return NextResponse.json({ ok: false, message: "KpiType not found" }, { status: 404 });
		}

		const body = await req.json();
		const PatchSchema = makeKpiTypePatchSchema(existing.type as any);
		const v = PatchSchema.safeParse(body);

		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const updated = await prisma.kpiType.update({
			where: { id: typeId },
			data: {
				...(v.data.name !== undefined ? { name: v.data.name } : {}),
				...(v.data.type !== undefined ? { type: v.data.type } : {}),
				...(v.data.rubric !== undefined ? { rubric: v.data.rubric } : {}),
			},
			select: { id: true, type: true, name: true, rubric: true, createdAt: true, updatedAt: true },
		});

		return NextResponse.json({ ok: true, data: updated }, { status: 200 });
	} catch (err: any) {
		console.error("PATCH /api/kpiTypes/[typeId] error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}