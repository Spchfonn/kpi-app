// app/api/auth/login/route.ts
import bcrypt from "bcrypt";
import { prisma } from "@/prisma/client";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { cyclePublicId, email, password } = await req.json();

  // 1. user
  const user = await prisma.user.findUnique({
    where: { email },
    include: { employee: true },
  });

  if (!user || !user.isActive || !user.employeeId) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 2. password
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 3. cycle
  const cycle = await prisma.evaluationCycle.findUnique({
    where: { publicId: cyclePublicId },
  });

  if (!cycle) {
    return Response.json({ message: "Invalid cycle" }, { status: 400 });
  }

  // 4. assignments
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

  // 5. หา role ที่เป็นไปได้
  const roles = new Set<string>();
  assignments.forEach(a => {
    if (a.evaluatorId === user.employeeId) roles.add("EVALUATOR");
    if (a.evaluateeId === user.employeeId) roles.add("EVALUATEE");
  });

  const fullName = user.employee
  ? `${user.employee.name} ${user.employee.lastName}`
  : "";

  const res = NextResponse.json({
    userId: user.id,
    employeeId: user.employeeId,
    fullName,
    cycle: {
      id: cycle.id,
      name: cycle.name,
    },
    availableRoles: Array.from(roles),
  });

  res.cookies.set("userId", user.id, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res;
}
