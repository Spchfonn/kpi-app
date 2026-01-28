import { cookies } from "next/headers";
import { prisma } from "@/prisma/client";

export class AuthError extends Error {
	status: number;
	constructor(message = "Unauthorized", status = 401) {
		super(message);
		this.status = status;
	}
}

export async function getOptionalUser() {
	const sid = (await cookies()).get("sid")?.value;
	if (!sid) return null;

	const session = await prisma.session.findUnique({
		where: { id: sid },
		include: { user: { include: { employee: true } } },
	});

	if (!session) return null;

	if (session.expiresAt < new Date()) {
		// session expired -> delete
		await prisma.session.delete({ where: { id: sid } }).catch(() => {});
		return null;
	}

	return session.user;
}

export async function requireUser() {
	const user = await getOptionalUser();
	if (!user) throw new AuthError("Unauthorized", 401);
	return user;
}