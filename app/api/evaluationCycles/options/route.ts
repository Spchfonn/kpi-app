import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function GET() {
  const cycles = await prisma.evaluationCycle.findMany({
    select: { id: true, name: true },
    orderBy: { id: "desc" },
  });

  const options = cycles.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return NextResponse.json({ ok: true, data: options });
}