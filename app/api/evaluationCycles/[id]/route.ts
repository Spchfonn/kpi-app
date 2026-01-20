import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

function toYmdBangkok(d: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function GET(
        _req: Request,
        { params }: { params: Promise<{ id: string }> }
    ) {
        const { id } = await params; 
        const cycleId = Number(id);
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