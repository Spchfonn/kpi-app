import { AuthError, requireUser } from "@/app/lib/auth";
import { prisma } from "@/prisma/client";
import { NotificationType } from "@prisma/client";
import { PREFIX_TH } from "../../employees/route";

function buildEmployeeName(e: any) {
	if (!e) return "ระบบ";
	const p = e.prefixName as "MR" | "MRS" | "MS" | null | undefined;
	const prefixTh = p ? PREFIX_TH[p] : "";
	const first = e.name ?? "";
	const last = e.lastName ? ` ${e.lastName}` : "";
	const full = `${prefixTh}${first}${last}`.trim();
	return full || e.employeeNo || "ระบบ";
}

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

export async function GET(_req: Request, ctx: { params: Promise<{ recipientId: string }> }) {
	try {
		const user = await requireUser();
		const { recipientId } = await ctx.params;

		const r = await prisma.notificationRecipient.findUnique({
			where: { id: recipientId },
			include: { notification: { include: { actor: true } } },
		});

		if (!r || r.userId !== user.id) {
			return Response.json({ ok: false, message: "Not found" }, { status: 404 });
		}

		const n = r.notification;
		const meta = (n.meta ?? {}) as any;
		const actorName = buildEmployeeName(n.actor);

		const uiType = mapUiType(n.type);
		const title = meta.title ?? buildTitle(n.type, actorName, meta);

		return Response.json({
			ok: true,
			data: {
				id: r.id,                 // recipientId
				notificationId: n.id,
				type: uiType,             // pending/success/error
				notificationType: n.type,
				title,
				timeLabel: n.createdAt,
				unread: r.readAt == null,
				readAt: r.readAt,
				actionStatus: r.actionStatus,
				actionAt: r.actionAt,
				meta: n.meta ?? null,
				actor: n.actor ? { id: n.actor.id, name: actorName } : null,

				refAssignmentId: n.refAssignmentId ?? null,
				refPlanId: n.refPlanId ?? null,
				refPlanEventId: n.refPlanEventId ?? null,
			},
		});
	} catch (e: any) {
		if (e instanceof AuthError) return Response.json({ ok: false, message: e.message }, { status: e.status });
		return Response.json({ ok: false, message: "Server error" }, { status: 500 });
	}
}