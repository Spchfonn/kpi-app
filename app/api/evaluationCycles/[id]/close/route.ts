import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { forbid } from "@/app/api/_lib/kpiWorkflow";
import { requireUser } from "@/app/lib/auth";

export async function POST(_: Request, { params }: { params: Promise<{ cycleId: string }> }) {
	try {
		const { cycleId } = await params;
		const id = Number(cycleId);
		if (!Number.isFinite(id)) forbid("invalid cycleId", 400);

		const user = await requireUser();
		if (!user.isAdmin) forbid("admin only");

		const now = new Date();

		await prisma.$transaction(async (tx) => {
		// close cycle audit
		await tx.evaluationCycle.update({
			where: { id },
			data: {
			closedAt: now,
			closedById: user.employeeId ?? undefined,
			},
		});

		// set gates: DEFINE=false, EVALUATE=false, SUMMARY=true
		const desired = [
			{ type: "DEFINE", enabled: false },
			{ type: "EVALUATE", enabled: false },
			{ type: "SUMMARY", enabled: true },
		] as const;

		for (const g of desired) {
			await tx.cycleActivity.upsert({
			where: { cycleId_type: { cycleId: id, type: g.type } },
			update: { enabled: g.enabled, updatedById: user.employeeId ?? null },
			create: { cycleId: id, type: g.type, enabled: g.enabled, updatedById: user.employeeId ?? null },
			});
		}
		});

		return NextResponse.json({ ok: true });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}