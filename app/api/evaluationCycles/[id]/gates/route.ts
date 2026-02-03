import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { getCycleGates, forbid } from "@/app/api/_lib/kpiWorkflow";
import { AuthError, getOptionalUser, requireAdmin, requireUser } from "@/app/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const user = await getOptionalUser();
		if (!user) throw new AuthError("Unauthorized", 401);

		const { id: cyclePublicId } = await params;
		if (!cyclePublicId) forbid("invalid cycle id", 400);

		// lookup db id
		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true },
		});
		if (!cycle) {
			return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });
		}

		const gates = await getCycleGates(cycle.id);
		return NextResponse.json({ ok: true, gates }, { status: 200 });
	} catch (e: any) {
		return NextResponse.json(
			{ ok: false, message: e?.message ?? "error" },
			{ status: e?.status ?? 500 }
		);
	}
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const user = await requireAdmin();
		if (!user.isAdmin) {
			return NextResponse.json({ ok: false, message: "admin only" }, { status: 403 });
		}

		const { id: cyclePublicId } = await params;
		if (!cyclePublicId) {
			return NextResponse.json({ ok: false, message: "invalid id" }, { status: 400 });
		}

		const body = await req.json().catch(() => ({}));
		const gates = {
			DEFINE: !!body.DEFINE,
			EVALUATE: !!body.EVALUATE,
			SUMMARY: !!body.SUMMARY,
		};

		const cycle = await prisma.evaluationCycle.findUnique({
			where: { publicId: cyclePublicId },
			select: { id: true },
		});
		if (!cycle) {
			return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });
		}

		await prisma.$transaction(async (tx) => {
			const desired = [
				{ type: "DEFINE" as const, enabled: gates.DEFINE },
				{ type: "EVALUATE" as const, enabled: gates.EVALUATE },
				{ type: "SUMMARY" as const, enabled: gates.SUMMARY },
			];

			for (const g of desired) {
				await tx.cycleActivity.upsert({
				where: { cycleId_type: { cycleId: cycle.id, type: g.type } },
				update: { enabled: g.enabled, updatedById: user.employeeId ?? null },
				create: { cycleId: cycle.id, type: g.type, enabled: g.enabled, updatedById: user.employeeId ?? null },
				});
			}
		});

		return NextResponse.json({ ok: true, gates }, { status: 200 });
	} catch (e: any) {
		console.error("POST /api/evaluationCycles/[id]/gates error:", e);
		return NextResponse.json(
			{ ok: false, message: e?.message ?? "error" },
			{ status: e?.status ?? 500 }
		);
  }
}