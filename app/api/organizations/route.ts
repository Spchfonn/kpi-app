import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
	code: z.string().min(1).max(50),
	name: z.string().min(1).max(255),
	parentId: z.uuid().optional().nullable(),
	managerId: z.uuid().optional().nullable(),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const v = schema.safeParse(body);
		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const { code, name, parentId, managerId } = v.data;

		// (optional) validate FK
		if (parentId) {
			const p = await prisma.organization.findUnique({ where: { id: parentId }, select: { id: true } });
			if (!p) return NextResponse.json({ ok: false, message: "parentId not found" }, { status: 404 });
		}
		if (managerId) {
			const m = await prisma.employee.findUnique({ where: { id: managerId }, select: { id: true } });
			if (!m) return NextResponse.json({ ok: false, message: "managerId not found" }, { status: 404 });
		}

		const created = await prisma.organization.create({
			data: { code, name, parentId: parentId ?? null, managerId: managerId ?? null },
		});

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (err: any) {
		if (err?.code === "P2002") {
			return NextResponse.json({ ok: false, message: "Organization code already exists" }, { status: 409 });
		}
		console.error("POST /api/organizations error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}

export async function GET() {
	const rows = await prisma.organization.findMany({
		orderBy: { code: "asc" },
		select: { id: true, code: true, name: true, parentId: true, managerId: true, createdAt: true, updatedAt: true },
	});
	return NextResponse.json({ ok: true, data: rows });
}