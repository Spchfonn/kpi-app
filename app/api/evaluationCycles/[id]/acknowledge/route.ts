import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";

function isGateOpen(g: { enabled: boolean; startAt: Date | null; endAt: Date | null }) {
    if (!g.enabled) return false;
    const now = new Date();
    if (g.startAt && now < g.startAt) return false;
    if (g.endAt && now > g.endAt) return false;
    return true;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireUser();
        if (!user.employeeId) return NextResponse.json({ ok: false, message: "User has no employeeId" }, { status: 400 });

        const { id: cyclePublicId } = await params;
        const cycle = await prisma.evaluationCycle.findUnique({
            where: { publicId: cyclePublicId },
            select: { id: true },
        });
        if (!cycle) return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });

        const ack = await prisma.evaluateeCycleAcknowledgement.findUnique({
            where: { cycleId_evaluateeId: { cycleId: cycle.id, evaluateeId: user.employeeId } },
            select: { acknowledgedAt: true, note: true },
        });

        return NextResponse.json({
            ok: true,
            data: { acknowledged: !!ack, acknowledgedAt: ack?.acknowledgedAt ?? null, note: ack?.note ?? null },
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
    }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireUser();
        if (!user.employeeId) return NextResponse.json({ ok: false, message: "User has no employeeId" }, { status: 400 });

        const { id: cyclePublicId } = await params;
        const cycle = await prisma.evaluationCycle.findUnique({
            where: { publicId: cyclePublicId },
            select: { id: true },
        });
        if (!cycle) return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });

        const gate = await prisma.cycleActivity.findUnique({
            where: { cycleId_type: { cycleId: cycle.id, type: "SUMMARY" } },
            select: { enabled: true, startAt: true, endAt: true },
        });
        if (!gate || !isGateOpen(gate)) {
            return NextResponse.json({ ok: false, message: "SUMMARY is not open" }, { status: 409 });
        }

        const body = await req.json().catch(() => ({}));
        const note = (body?.note ?? "").toString().trim() || null;

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                    req.headers.get("x-real-ip") || null;
        const userAgent = req.headers.get("user-agent") || null;

        const ack = await prisma.evaluateeCycleAcknowledgement.upsert({
            where: { cycleId_evaluateeId: { cycleId: cycle.id, evaluateeId: user.employeeId } },
            update: { note, ip, userAgent, userId: user.id },
            create: { cycleId: cycle.id, evaluateeId: user.employeeId, userId: user.id, note, ip, userAgent },
            select: { acknowledgedAt: true },
        });

        return NextResponse.json({ ok: true, data: { acknowledgedAt: ack.acknowledgedAt } });
    } catch (e: any) {
        return NextResponse.json({ ok: false, message: e?.message ?? "error" }, { status: e?.status ?? 500 });
    }
}