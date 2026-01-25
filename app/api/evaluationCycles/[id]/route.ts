import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";

function toYmdBangkok(d: Date) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Bangkok",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(d);
}

const patchSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	status: z.enum(["DEFINE", "EVALUATE", "SUMMARY"]).optional(),
}).refine(
	(v) => !(v.startDate && v.endDate) || v.endDate >= v.startDate,
	{ path: ["endDate"], message: "endDate must be >= startDate" }
);

function parseYmdBangkokToDate(ymd: string) {
	// convert "YYYY-MM-DD" to datetime
	return new Date(`${ymd}T00:00:00+07:00`);
}

async function readParamsId(
	params: { id: string } | Promise<{ id: string }>
  ) {
	const p = await params;
	const cycleId = Number(p.id);
	return cycleId;
}

export async function GET(
		_req: Request,
		{ params }: { params: Promise<{ id: string }> }
	) {
		const cycleId = await readParamsId(params as any); 

	if (!Number.isFinite(cycleId)) {
		return NextResponse.json({ ok: false, message: "invalid id" }, { status: 400 });
	}

	const c = await prisma.evaluationCycle.findUnique({ where: { id : cycleId } });
	if (!c) {
		return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });
	}

	return NextResponse.json({
		ok: true,
		data: {
			...c,
			startDateYmd: toYmdBangkok(c.startDate),
			endDateYmd: toYmdBangkok(c.endDate),
		},
	});
}

export async function PATCH(
	req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {

	const cycleId = await readParamsId(params);

	if (!Number.isFinite(cycleId)) {
		return NextResponse.json({ ok: false, message: "invalid id" }, { status: 400 });
	}
  
	const body = await req.json().catch(() => null);
	const v = patchSchema.safeParse(body);
	if (!v.success) {
		return NextResponse.json(
			{ ok: false, message: "validation error", issues: v.error.issues },
			{ status: 400 }
		);
	}
  
	const data: Record<string, any> = {};
	if (v.data.name !== undefined) data.name = v.data.name;
	if (v.data.status !== undefined) data.status = v.data.status;
	if (v.data.startDate !== undefined) data.startDate = parseYmdBangkokToDate(v.data.startDate);
	if (v.data.endDate !== undefined) data.endDate = parseYmdBangkokToDate(v.data.endDate);

	if (Object.keys(data).length === 0) {
		return NextResponse.json(
			{ ok: false, message: "no fields to update" },
			{ status: 400 }
		);
	}
  
	try {
		const updated = await prisma.evaluationCycle.update({
			where: { id: cycleId },
			data,
		});
	
		return NextResponse.json({
			ok: true,
			data: {
				...updated,
				startDateYmd: toYmdBangkok(updated.startDate),
				endDateYmd: toYmdBangkok(updated.endDate),
			},
		});
	} catch (e: any) {
		return NextResponse.json(
			{ ok: false, message: "update failed", detail: e?.message ?? String(e) },
			{ status: 500 }
		);
	}
}