import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function GET(_: Request, ctx: { params: Promise<{ cycleId: string }> }) {
  const { cycleId } = await ctx.params;

  // รองรับทั้ง id และ publicId (เหมือนที่คุณทำไว้แล้ว)
  const isNumericId = /^\d+$/.test(cycleId);

  const cycle = await prisma.evaluationCycle.findUnique({
    where: isNumericId ? { id: Number(cycleId) } : { publicId: cycleId },
    select: {
      id: true,
      publicId: true,
      status: true,
      activities: {
        select: { type: true, enabled: true, startAt: true, endAt: true },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });
  }

  // หา activity ที่ enabled
  const enabled = cycle.activities.filter((a) => a.enabled);

  // กำหนดลำดับความสำคัญ ถ้าเปิดหลายอันพร้อมกัน
  const priority = ["SUMMARY", "EVALUATE", "DEFINE"] as const;
  const active =
    priority.map((p) => enabled.find((x) => x.type === p)).find(Boolean) ?? null;

  return NextResponse.json({
    ok: true,
    data: {
      cycleId: cycle.id,
      cyclePublicId: cycle.publicId,
      cycleStatus: cycle.status,
      activeActivity: active?.type ?? null, // "DEFINE" | "EVALUATE" | "SUMMARY" | null
      enabledActivities: enabled.map((x) => x.type),
    },
  });
}