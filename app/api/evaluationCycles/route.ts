import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
  name: z.string().min(1).max(255),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.enum(["DEFINE", "EVALUATE", "SUMMARY"]),
}).refine(v => v.endDate >= v.startDate, { path: ["endDate"], message: "endDate must be >= startDate" });

function toYmdCompact(d: string) {
    // d: "YYYY-MM-DD" -> "YYYYMMDD"
    return d.replaceAll("-", "");
}
  
function genCode(startDate: string, endDate: string) {
return `EC-${toYmdCompact(startDate)}-${toYmdCompact(endDate)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const v = schema.safeParse(body);
    if (v.success === false) {
    return NextResponse.json(
        { ok: false, errors: z.treeifyError(v.error) },
        { status: 400 }
    );
    }

    const { name, startDate, endDate, status } = v.data;

    const code = genCode(startDate, endDate);
    // avoid duplicated code
    const exists = await prisma.evaluationCycle.findUnique({ where: { code } });
    if (exists) {
        return NextResponse.json(
        { ok: false, message: "code already exists", code },
        { status: 409 }
        );
    }

    const created = await prisma.evaluationCycle.create({
        data: {
        name,
        code: code,
        startDate: `${startDate}T00:00:00.000+07:00`,
        endDate: `${endDate}T00:00:00.000+07:00`,
        status,
        },
    });

    return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err: any) {
        console.error("POST /api/evaluationCycles error:", err);
        return NextResponse.json(
        { ok: false, message: err?.message ?? "Internal Server Error" },
        { status: 500 }
        );
  }
}

function toYmdBangkok(d: Date) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d); // YYYY-MM-DD
}

// GET /api/evaluationCycles
export async function GET() {
    const cycles = await prisma.evaluationCycle.findMany({
        orderBy: { id: "desc" },
    });

    const data = cycles.map((c) => ({
        ...c,
        startDateYmd: toYmdBangkok(c.startDate),
        endDateYmd: toYmdBangkok(c.endDate),
    }));

    return NextResponse.json({ ok: true, data });
}
