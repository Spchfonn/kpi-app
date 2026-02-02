import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";

function computeOpen(enabled: boolean, startAt?: Date | null, endAt?: Date | null) {
	if (!enabled) return false;
	const now = new Date();
	if (startAt && now < startAt) return false;
	if (endAt && now > endAt) return false;
	return true;
}

export async function GET(_req: Request, ctx: { params: Promise<{ cyclePublicId: string }> }) {
	try {
		await requireUser(); // ต้อง login ก่อน (ถ้าไม่ต้องการก็เอาออกได้)

		const { cyclePublicId } = await ctx.params;

		// 1) lookup cycle by publicId
		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true },
		});

		if (!cycle) {
			return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });
		}

		// 2) fetch activities
		const rows = await prisma.cycleActivity.findMany({
			where: { cycleId: cycle.id },
			select: { type: true, enabled: true, startAt: true, endAt: true },
		});

		// 3) compute gates
		const gates = {
			DEFINE: rows.some(r => r.type === "DEFINE" && computeOpen(r.enabled, r.startAt, r.endAt)),
			EVALUATE: rows.some(r => r.type === "EVALUATE" && computeOpen(r.enabled, r.startAt, r.endAt)),
			SUMMARY: rows.some(r => r.type === "SUMMARY" && computeOpen(r.enabled, r.startAt, r.endAt)),
		};

		return NextResponse.json({ ok: true, cycleId: cycle.id, gates }, { status: 200 });
	} catch (err: any) {
		console.error("GET /api/cycles/byPublicId/[cyclePublicId]/gates error:", err);
		return NextResponse.json(
			{ ok: false, message: err?.message ?? "Internal Server Error" },
			{ status: 500 }
		);
  	}
}