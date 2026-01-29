import { AuthError, requireUser } from "@/app/lib/auth";
import { prisma } from "@/prisma/client";

function toInt(v: string | null, fallback: number) {
	const n = Number(v);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export async function GET(req: Request) {
	try {
		const user = await requireUser();
		const { searchParams } = new URL(req.url);

		const status = (searchParams.get("status") ?? "all") as "all" | "unread" | "read";
		const take = toInt(searchParams.get("take"), 20);
		const cursor = searchParams.get("cursor"); // recipientId

		const where: any = { userId: user.id };
		if (status === "unread") where.readAt = null;
		if (status === "read") where.readAt = { not: null };

		const items = await prisma.notificationRecipient.findMany({
			where,
			take: take + 1,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
			orderBy: { createdAt: "desc" },
			include: {
				notification: {
					include: { actor: true },
				},
			},
		});

		const nextCursor = items.length > take ? items[take].id : null;
		const sliced = items.slice(0, take);

		const unreadCount = await prisma.notificationRecipient.count({
			where: { userId: user.id, readAt: null },
		});

		return Response.json({ items: sliced, nextCursor, unreadCount });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ message: e.message }, { status: e.status });
		return Response.json({ message: "Server error" }, { status: 500 });
	}
}