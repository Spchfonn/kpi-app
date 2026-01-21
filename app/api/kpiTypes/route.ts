import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";
import { makeKpiTypeCreateSchema } from "./_schemas";

/**
 * KpiType model:
 * - id (uuid)
 * - type: QUANTITATIVE | QUALITATIVE | CUSTOM
 * - name: string
 * - rubric: Json
 */

const CreateSchema = makeKpiTypeCreateSchema();

export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url);
		const type = searchParams.get("type"); // optional filter

		const rows = await prisma.kpiType.findMany({
			where: type ? { type: type as any } : undefined,
			orderBy: [{ type: "asc" }, { name: "asc" }],
			select: {
				id: true,
				type: true,
				name: true,
				rubric: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return NextResponse.json({ ok: true, data: rows }, { status: 200 });
	} catch (err: any) {
		console.error("GET /api/kpiTypes error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const v = CreateSchema.safeParse(body);
		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const created = await prisma.kpiType.create({
			data: {
				type: v.data.type,
				name: v.data.name,
				rubric: v.data.rubric,
			},
			select: {
				id: true,
				type: true,
				name: true,
				rubric: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (err: any) {
		console.error("POST /api/kpiTypes error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}