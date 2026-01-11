import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
  name: z.string().min(1).max(255),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["DEFINE", "EVALUATE", "SUMMARY"]),
}).refine(v => v.endDate >= v.startDate, { path: ["endDate"], message: "endDate must be >= startDate" });

export async function POST(request: Request) {
  const body = await request.json();
  const v = schema.safeParse(body);
  if (!v.success) {
    return NextResponse.json({ ok: false, errors: v.error.flatten() }, { status: 400 });
  }

  const { name, startDate, endDate, status } = v.data;

  const startDT = `${startDate} 00:00:00`;
  const endDT = `${endDate} 00:00:00`;

  // ใส่ค่า DATETIME แบบ "00:00:00" ตรง ๆ
  await prisma.$executeRaw`
    INSERT INTO EvaluationCycle (name, startDate, endDate, status)
    VALUES (${name}, ${startDT}, ${endDT}, ${status})
  `;

  // ดึงแถวล่าสุดกลับไป (ง่ายสุด)
  const created = await prisma.evaluationCycle.findFirst({
    orderBy: { id: "desc" },
  });

  return NextResponse.json({ ok: true, data: created }, { status: 201 });
}