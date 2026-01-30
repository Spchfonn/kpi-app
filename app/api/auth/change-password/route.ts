// app/api/auth/change-password/route.ts
import bcrypt from "bcrypt";
import { prisma } from "@/prisma/client";

export async function POST(req: Request) {
try {
    const { email, currentPassword, newPassword } = await req.json();

    // 1. validate input
    if (!email) {
          return Response.json(
            { message: "เกิดข้อผิดพลาดกรุณาลองอีกครั้ง" },
            { status: 400 }
          );
        }

    // 2. เช็ค Input ของรหัสผ่าน (ถ้าไม่มี แสดงว่าผู้ใช้ลืมกรอก)
    if (!currentPassword || !newPassword) {
      return Response.json(
        { message: "กรุณากรอกรหัสผ่านให้ครบ" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return Response.json(
        { message: "รหัสผ่านต้องมีอย่างน้อย 6 ตัว" },
        { status: 400 }
      );
    }

    // 2. find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return Response.json({ message: "Invalid credentials or user inactive" }, { status: 401 });
    }

    // 3. check current password
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) {
      return Response.json(
        { message: "รหัสผ่านเดิมไม่ถูกต้อง" },
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
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  }
  catch (error) {
    console.error("Change password error:", error);
    return Response.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
