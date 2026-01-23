import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

export async function GET() {
  const cycles = await prisma.evaluationCycle.findMany({
    select: { publicId: true, name: true },
    orderBy: { publicId: "desc" },
  });

  const options = cycles.map((c) => ({
    value: String(c.publicId),
    label: c.name,
  }));

  return NextResponse.json({ ok: true, data: options });
}