// app/api/auth/sign-in/route.ts
import bcrypt from "bcrypt";
import { prisma } from "@/prisma/client";
import { cookies } from "next/headers";

const SESSION_DAYS = 7;

export async function POST(req: Request) {
	const { cyclePublicId, email, password } = await req.json();

	// 1) user
	const user = await prisma.user.findUnique({
		where: { email },
		include: { employee: true },
	});

	if (!user || !user.isActive) {
		return Response.json({ message: "Unauthorized" }, { status: 401 });
	}

	// 2) password
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) {
		return Response.json({ message: "Unauthorized" }, { status: 401 });
	}

	// 3) create session + set cookie (ทำก่อน return ทุกเคส)
	const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

	const session = await prisma.session.create({
		data: { userId: user.id, expiresAt },
	});
	
	(await cookies()).set("sid", session.id, {
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		expires: expiresAt,
	});


	// ===============================
	// ADMIN CASE
	// ===============================
	if (user.isAdmin) {
      return Response.json({
         userId: user.id,
         email: user.email,
      isAdmin: true,
         redirectTo: "/admin",
      });
   }

	// ===============================
	// NORMAL USER CASE
	// ===============================
	if (!user.employeeId) {
		return Response.json({ message: "Unauthorized" }, { status: 401 });
	}

	// cycle
	const cycle = await prisma.evaluationCycle.findUnique({
		where: { publicId: cyclePublicId },
	});

	if (!cycle) {
		return Response.json({ message: "Invalid cycle" }, { status: 400 });
	}

	// assignments
	const assignments = await prisma.evaluationAssignment.findMany({
		where: {
			cycleId: cycle.id,
			OR: [
				{ evaluatorId: user.employeeId },
				{ evaluateeId: user.employeeId },
			],
		},
	});

	if (assignments.length === 0) {
		return Response.json(
			{ message: "No permission in this cycle" },
			{ status: 403 }
		);
	}

	// roles
	const roles = new Set<string>();
	assignments.forEach(a => {
		if (a.evaluatorId === user.employeeId) roles.add("EVALUATOR");
		if (a.evaluateeId === user.employeeId) roles.add("EVALUATEE");
	});

	const fullName = user.employee
		? `${user.employee.name} ${user.employee.lastName}`
		: "";

	return Response.json({
		userId: user.id,
		email: user.email,
		employeeId: user.employeeId,
		fullName,
		cycle: {
			id: cycle.publicId,
			name: cycle.name,
		},
		availableRoles: Array.from(roles),
	});
}
