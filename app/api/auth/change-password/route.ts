// app/api/auth/change-password/route.ts
import bcrypt from "bcrypt";
import { prisma } from "@/prisma/client";

export async function POST(req: Request) {
  const { email, currentPassword, newPassword } = await req.json();

  // 1. validate input
  if (!email || !currentPassword || !newPassword) {
    return Response.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return Response.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // 2. find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  // 3. check current password
  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) {
    return Response.json(
      { message: "Current password is incorrect" },
      { status: 401 }
    );
  }

  // 4. hash new password
  const newHash = await bcrypt.hash(newPassword, 10);

  // 5. update
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return Response.json({
    message: "Password changed successfully",
  });
}
