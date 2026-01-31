import { AuthError, requireUser } from "@/app/lib/auth";
import { prisma } from "@/prisma/client";
import { NotificationType } from "@prisma/client";
import { PREFIX_TH } from "../employees/route";

function toInt(v: string | null, fallback: number) {
	const n = Number(v);
	return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function buildEmployeeName(e: any) {
	if (!e) return "ระบบ";
	const p = e.prefixName as "MR" | "MRS" | "MS" | null | undefined;
  	const prefixTh = p ? PREFIX_TH[p] : "";  
	const first = e.name ?? "";
	const last = e.lastName ? ` ${e.lastName}` : "";
	const full = `${prefixTh}${first} ${last}`.trim();
	return full || e.employeeNo || "ระบบ";
}

export async function GET(req: Request) {
	try {
		const user = await requireUser();
		const { searchParams } = new URL(req.url);

		const status = (searchParams.get("status") ?? "all") as "all" | "unread" | "read";
		const take = toInt(searchParams.get("take"), 20);
		const cursor = searchParams.get("cursor"); // recipientId

		const where: any = { userId: user.id };
		if (status === "unread") where.readAt = null;
		if (status === "read") where.readAt = { not: null };

		const items = await prisma.notificationRecipient.findMany({
			where,
			take: take + 1,
			...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
			orderBy: { createdAt: "desc" },
			include: {
				notification: {
					include: { actor: true },
				},
			},
		});

		const nextCursor = items.length > take ? items[take].id : null;
		const sliced = items.slice(0, take);

		const unreadCount = await prisma.notificationRecipient.count({
			where: { userId: user.id, readAt: null },
		});

		const dto = sliced.map((r) => {
			const n = r.notification;
		  
			const actorName = buildEmployeeName(n.actor);
		  		  
			function mapUiType(t: NotificationType): "pending" | "success" | "error" {
				switch (t) {
					case NotificationType.EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI:
					case NotificationType.EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI:
					case NotificationType.EVALUATOR_REQUEST_EVALUATEE_DEFINE_KPI:
						return "pending";
				
					case NotificationType.EVALUATEE_CONFIRM_EVALUATOR_KPI:
					case NotificationType.EVALUATOR_APPROVE_EVALUATEE_KPI:
						return "success";
				
					case NotificationType.EVALUATEE_REJECT_EVALUATOR_KPI:
					case NotificationType.EVALUATOR_REJECT_EVALUATEE_KPI:
					case NotificationType.EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI:
						return "error";
				}
			}
			  
			function buildTitle(t: NotificationType, actorName: string, meta: any) {
				const round = meta?.round ? `${meta.round}` : "";
			  
				switch (t) {
					case NotificationType.EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI:
						return `${actorName} ขอให้ผู้ประเมินอนุมัติตัวชี้วัด${round}`;
				
					case NotificationType.EVALUATEE_CONFIRM_EVALUATOR_KPI:
						return `${actorName} รับรองตัวชี้วัด${round}ของผู้ประเมินแล้ว`;
				
					case NotificationType.EVALUATEE_REJECT_EVALUATOR_KPI:
						return `${actorName} ปฏิเสธตัวชี้วัด${round}ของผู้ประเมิน`;
				
					case NotificationType.EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI:
						return `${actorName} ขอให้ผู้รับการประเมินรับรองตัวชี้วัด${round}`;
				
					case NotificationType.EVALUATOR_REQUEST_EVALUATEE_DEFINE_KPI:
						return `${actorName} ขอให้ผู้รับการประเมินกำหนดตัวชี้วัด${round}`;
				
					case NotificationType.EVALUATOR_APPROVE_EVALUATEE_KPI:
						return `${actorName} อนุมัติตัวชี้วัด${round}ของผู้รับการประเมินแล้ว`;
				
					case NotificationType.EVALUATOR_REJECT_EVALUATEE_KPI:
						return `${actorName} ปฏิเสธตัวชี้วัด${round}ของผู้รับการประเมิน`;
				
					case NotificationType.EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI:
						return `${actorName} ยกเลิกคำขอให้ผู้รับการประเมินรับรองตัวชี้วัด${round}`;
				}
			}
		  
			const meta = (n.meta ?? {}) as any;

			const uiType = mapUiType(n.type);
			const title = meta.title ?? buildTitle(n.type, actorName, meta);

			return {
				id: r.id,
				notificationId: n.id,
				type: uiType,
				title,
				createAt: n.createdAt,
				timeLabel: n.createdAt,
				unread: r.readAt == null,
				readAt: r.readAt,
				actionStatus: r.actionStatus,
  				actionAt: r.actionAt,
				meta: n.meta ?? null,
				actor: n.actor ? { id: n.actor.id, name: actorName } : null,
			};
		});

		return Response.json({ ok: true, items: dto, nextCursor, unreadCount });
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ ok: false, message: e.message }, { status: e.status });
		return Response.json({ ok: false, message: "Server error" }, { status: 500 });
	}
}