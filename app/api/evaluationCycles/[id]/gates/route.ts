import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { getCycleGates, forbid } from "@/app/api/_lib/kpiWorkflow";
import { requireUser } from "@/app/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ cycleId: string }> }) {
	try {
		const { cycleId } = await params;
		const id = Number(cycleId);
		if (!Number.isFinite(id)) forbid("invalid cycleId", 400);

		await requireUser(); // just ensure logged in

		const gates = await getCycleGates(id);
		return NextResponse.json({ ok: true, gates });
	} catch (e: any) {
		return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
	}
}