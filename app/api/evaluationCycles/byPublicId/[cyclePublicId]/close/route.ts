import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ cyclePublicId: string }> }) {
	try {
		const user = await requireUser();
		if (!user.isAdmin) {
			return NextResponse.json({ ok: false, message: "admin only" }, { status: 403 });
		}

		const { cyclePublicId } = await ctx.params;

		// lookup cycle by publicId
		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true },
		});

		if (!cycle) {
			return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });
		}

		const now = new Date();

		await prisma.$transaction(async (tx) => {
			// audit close cycle
			await tx.evaluationCycle.update({
				where: { id: cycle.id },
				data: {
				closedAt: now,
				closedById: user.employeeId ?? undefined,
				},
		});

		// gates: DEFINE=false, EVALUATE=false, SUMMARY=true
		const desired = [
			{ type: "DEFINE" as const, enabled: false },
			{ type: "EVALUATE" as const, enabled: false },
			{ type: "SUMMARY" as const, enabled: true },
		];

		for (const g of desired) {
			await tx.cycleActivity.upsert({
				where: { cycleId_type: { cycleId: cycle.id, type: g.type } },
				update: { enabled: g.enabled, updatedById: user.employeeId ?? null },
				create: {
					cycleId: cycle.id,
					type: g.type,
					enabled: g.enabled,
					updatedById: user.employeeId ?? null,
				},
			});
		}
		});

		return NextResponse.json({ ok: true }, { status: 200 });
	} catch (err: any) {
		console.error("POST /api/cycles/byPublicId/[cyclePublicId]/close error:", err);
		return NextResponse.json(
		{ ok: false, message: err?.message ?? "Internal Server Error" },
		{ status: 500 }
		);
	}
}