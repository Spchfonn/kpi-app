import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/prisma/client";

const schema = z.object({
    code: z.string().min(1).max(50),
    name: z.string().min(1).max(255),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const v = schema.safeParse(body);
        if (!v.success) return NextResponse.json({ ok: false, errors: z.treeifyError(v.error) }, { status: 400 });

        const created = await prisma.level.create({ data: v.data });
        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err: any) {
        if (err?.code === "P2002") return NextResponse.json({ ok: false, message: "Level code already exists" }, { status: 409 });
        console.error("POST /api/levels error:", err);
        return NextResponse.json({ ok: false, message: err?.message ?? "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    const rows = await prisma.level.findMany({ orderBy: { code: "asc" } });
    return NextResponse.json({ ok: true, data: rows });
}