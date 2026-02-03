"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function Page() {
	const router = useRouter();
	const { cycleId, recipientId } = useParams() as { cycleId: string; recipientId: string };

	useEffect(() => {

		if (!cycleId || !recipientId) return;

		(async () => {
			
			try {
				// 1) mark read
				await fetch(`/api/notifications/${recipientId}/read`, { method: "PATCH" });

				// 2) fetch detail
				const res = await fetch(`/api/notifications/${recipientId}`, { cache: "no-store" });
				const j = await res.json();
				console.log("detail status", res.status, j); 
				if (!j.ok) return router.replace(`/${cycleId}/notifications`); // fallback

				const n = j.data; // { type, actionStatus, meta, ... }

				// if noti is cancelled/done -> redirect to notifications list
				if (n.actionStatus !== "OPEN") {
					return router.replace(`/${cycleId}/notifications`);
				}

				const m = n.meta ?? {};
				const t = n.notificationType ?? n.type;
				switch (t) {
					case "EVALUATOR_REQUEST_EVALUATEE_DEFINE_KPI":
						return router.replace(`/${cycleId}/evaluatee/defineKpi`);
					case "EVALUATOR_REQUEST_EVALUATEE_CONFIRM_KPI":
						return router.replace(`/${cycleId}/evaluatee/confirmKpi/${n.refAssignmentId ?? m.assignmentId}`)
					case "EVALUATEE_REQUEST_EVALUATOR_APPROVE_KPI":
						return router.replace(`/${cycleId}/evaluator/confirmKpi/${n.refAssignmentId ?? m.assignmentId}`)
					case "EVALUATEE_CONFIRM_EVALUATOR_KPI":
						return router.replace(`/${cycleId}/evaluator/defineKpi/${m.evaluateeId}`);
					case "EVALUATEE_REJECT_EVALUATOR_KPI":
						return router.replace(`/${cycleId}/evaluator/confirmKpi/${n.refAssignmentId ?? m.assignmentId}`)
					case "EVALUATOR_APPROVE_EVALUATEE_KPI":
						return router.replace(`/${cycleId}/evaluatee/defineKpi/${m.evaluateeId}`);
					case "EVALUATOR_REJECT_EVALUATEE_KPI":
						return router.replace(`/${cycleId}/evaluatee/defineKpi/${m.evaluateeId}`);
					case "EVALUATOR_CANCEL_REQUEST_EVALUATEE_CONFIRM_KPI":
						return router.replace(`/${cycleId}/evaluatee/defineKpi`);
					default:
						return router.replace(`/${cycleId}/notifications`);
				}
			} catch (err) {
				console.error("notification redirect error:", err);
				return router.replace(`/${cycleId}/notifications`);
			}
		})();
	}, [router, cycleId, recipientId]);

	return null;
}