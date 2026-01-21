import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
	prefixName: z.enum(["MR", "MRS", "MS"]),
	name: z.string().min(1).max(255),
	lastName: z.string().min(1).max(255),
	nickname: z.string().min(1).max(100),
	employeeNo: z.string().min(1).max(50),
	email: z.email(),
	phone: z.string().optional().nullable(),

	gender: z.enum(["MALE", "FEMALE", "OTHER", "UNSPECIFIED"]).optional().default("UNSPECIFIED"),

	// YYYY-MM-DD
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	terminatedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),

	organizationId: z.uuid(),
	positionId: z.uuid(),
	levelId: z.uuid(),

	jobDescription: z.string().optional().nullable(),
	isActive: z.boolean().optional().default(true),
});

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const v = schema.safeParse(body);
		if (!v.success) {
			return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });
		}

		const d = v.data;

		// FK check
		const [org, pos, lvl] = await Promise.all([
			prisma.organization.findUnique({ where: { id: d.organizationId }, select: { id: true } }),
			prisma.position.findUnique({ where: { id: d.positionId }, select: { id: true } }),
			prisma.level.findUnique({ where: { id: d.levelId }, select: { id: true } }),
		]);
		if (!org) return NextResponse.json({ ok: false, message: "organizationId not found" }, { status: 404 });
		if (!pos) return NextResponse.json({ ok: false, message: "positionId not found" }, { status: 404 });
		if (!lvl) return NextResponse.json({ ok: false, message: "levelId not found" }, { status: 404 });

		const created = await prisma.employee.create({
			data: {
				prefixName: d.prefixName,
				name: d.name,
				lastName: d.lastName,
				nickname: d.nickname,
				employeeNo: d.employeeNo,
				email: d.email,
				phone: d.phone ?? null,
				gender: d.gender,

				startDate: `${d.startDate}T00:00:00.000+07:00`,
				terminatedDate: d.terminatedDate ? `${d.terminatedDate}T00:00:00.000+07:00` : null,

				organizationId: d.organizationId,
				positionId: d.positionId,
				levelId: d.levelId,

				jobDescription: d.jobDescription ?? null,
				isActive: d.isActive ?? true,
			},
		});

		return NextResponse.json({ ok: true, data: created }, { status: 201 });
	} catch (err: any) {
		if (err?.code === "P2002") {
			return NextResponse.json({ ok: false, message: "employeeNo or email already exists" }, { status: 409 });
		}
		console.error("POST /api/employees error:", err);
		return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
	}
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const q = searchParams.get("q")?.trim();

	const rows = await prisma.employee.findMany({
		where: q
		? {
			OR: [
				{ name: { contains: q } },
				{ lastName: { contains: q } },
				{ employeeNo: { contains: q } },
				{ email: { contains: q } },
			],
		}
		: undefined,
		orderBy: { createdAt: "desc" },
		include: {
			organization: { select: { id: true, code: true, name: true } },
			position: { select: { id: true, code: true, name: true } },
			level: { select: { id: true, code: true, name: true } },
		},
	});

	return NextResponse.json({ ok: true, data: rows });
}