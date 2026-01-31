import { AuthError, requireUser } from "@/app/lib/auth";
import { prisma } from "@/prisma/client";

export async function GET() {
	try {
		const user = await requireUser();
		const unreadCount = await prisma.notificationRecipient.count({
			where: { userId: user.id, readAt: null, actionStatus: "OPEN", },
		});
		return Response.json({ unreadCount });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ message: e.message }, { status: e.status });
		return Response.json({ message: "Server error" }, { status: 500 });
	}
}