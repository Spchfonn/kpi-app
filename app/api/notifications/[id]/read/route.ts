// app/api/notifications/[id]/read/route.ts
import { prisma } from "@/prisma/client";
import { getCurrentUserId } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getCurrentUserId();

  await prisma.notificationRecipient.updateMany({
    where: {
      id: params.id,
      userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  });

  return Response.json({ success: true });
}
