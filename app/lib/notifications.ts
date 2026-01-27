import { prisma } from "@/prisma/client";
import { NotificationType } from "@prisma/client";

export async function createNotification(params: {
	type: NotificationType;
	actorEmployeeId?: string | null;
	cycleId?: number | null;
	meta?: any; // { assignmentId, planId?, nodeId?, url? }
	recipientUserIds: string[];
	}) {
	const { type, actorEmployeeId, cycleId, meta, recipientUserIds } = params;

	if (!recipientUserIds.length) return null;

	return prisma.notification.create({
		data: {
			type,
			actorId: actorEmployeeId ?? null,
			cycleId: cycleId ?? null,
			meta: meta ?? undefined,
			recipients: {
				createMany: {
					data: recipientUserIds.map((userId) => ({ userId })),
					skipDuplicates: true,
				},
			},
		},
	});
}