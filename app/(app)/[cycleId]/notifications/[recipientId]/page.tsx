"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
	const router = useRouter();
	const { cycleId, recipientId } = useParams() as { cycleId: string; recipientId: string };

	useEffect(() => {
		(async () => {
		const res = await fetch(`/api/notifications/${recipientId}`, { cache: "no-store" });
		const j = await res.json();
		if (!j.ok) return router.replace(`/${cycleId}`); // fallback

		const n = j.data; // { type, actionStatus, meta, ... }

		// ถ้า noti ถูกยกเลิก/ทำแล้ว -> จะ redirect ไปหน้า detail read-only หรือหน้า list
		if (n.actionStatus !== "OPEN") {
			return router.replace(`/${cycleId}/notifications`); // หรือ toast แล้วกลับ
		}

		const m = n.meta ?? {};
		switch (n.type) {
			case "EVALUATOR_REQUEST_EVALUATEE_DEFINE_KPI":
				return router.replace(`/${cycleId}/evaluatee/defineKpi`);
			case "EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI":
				return router.replace(`/${cycleId}/evaluatee/confirmKpi/${m.evaluateeId}`);
			case "EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI":
				return router.replace(`/${cycleId}/evaluator/confirmKpi/${m.evaluateeId}`);
			case "EVALUATEE_CONFIRM_EVALUATOR_KPI":
				return router.replace(`/${cycleId}/evaluator/defineKpi/${m.evaluateeId}`);
			case "EVALUATEE_REJECT_EVALUATOR_KPI":
				return router.replace(`/${cycleId}/evaluator/confirmKpi/${m.evaluateeId}`);
			case "EVALUATOR_APPROVE_EVALUATEE_KPI":
				return router.replace(`/${cycleId}/evaluatee/defineKpi/${m.evaluateeId}`);
			case "EVALUATOR_REJECT_EVALUATEE_KPI":
				return router.replace(`/${cycleId}/evaluatee/defineKpi/${m.evaluateeId}`);
			case "EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI":
				return router.replace(`/${cycleId}/evaluatee/defineKpi`); // หรือ notifications list
			default:
				return router.replace(`/${cycleId}`);
		}
		})();
	}, [router, cycleId, recipientId]);

	return null;
}