import { AuthError, requireUser } from "@/app/lib/auth";
import { prisma } from "@/prisma/client";

export async function PATCH(_req: Request, ctx: { params: { recipientId: string } }) {
	try {
		const user = await requireUser();
		const { recipientId } = ctx.params;

		// ownership check
		const rec = await prisma.notificationRecipient.findUnique({
			where: { id: recipientId },
			select: { id: true, userId: true, readAt: true },
		});

		if (!rec || rec.userId !== user.id) {
			return Response.json({ message: "Not found" }, { status: 404 });
		}

		if (rec.readAt) {
			return Response.json({ ok: true, readAt: rec.readAt }); // already read
		}

		const now = new Date();
		const updated = await prisma.notificationRecipient.update({
			where: { id: recipientId },
			data: { readAt: now },
			select: { id: true, readAt: true },
		});

		return Response.json({ ok: true, ...updated });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ message: e.message }, { status: e.status });
		return Response.json({ message: "Server error" }, { status: 500 });
	}
}