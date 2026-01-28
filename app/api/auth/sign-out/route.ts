import { prisma } from "@/prisma/client";
import { cookies } from "next/headers";

export async function POST() {
	const ck = await cookies();
	const sid = ck.get("sid")?.value;

	// delete session in DB (if has)
	if (sid) {
		await prisma.session.delete({ where: { id: sid } }).catch(() => {});
	}

	// delete cookie
	ck.set("sid", "", {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		expires: new Date(0),
	});

	return Response.json({ ok: true });
}