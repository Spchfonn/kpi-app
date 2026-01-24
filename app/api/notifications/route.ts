// app/api/notifications/route.ts
import { prisma } from "@/prisma/client";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();

  const notifications = await prisma.notificationRecipient.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
    include: {
      notification: {
        include: {
          actor: {
            select: {
              name: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

   const result = notifications.map(n => ({
   id: n.id,
   type: n.notification.type,
   actor: n.notification.actor
      ? `${n.notification.actor.name} ${n.notification.actor.lastName}`
      : null,
   cycleId: n.notification.cycleId,
   createdAt: n.notification.createdAt,
   unread: n.readAt === null,
   }));

  return Response.json(result);
}

export async function HEAD() {
  const userId = await getCurrentUserId();

  const count = await prisma.notificationRecipient.count({
    where: {
      userId,
      readAt: null,
    },
  });

  return new Response(null, {
    headers: {
      "X-Unread-Count": count.toString(),
    },
  });
}