import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth";

type Props = { params: Promise<{ cycleId: string }> };

async function getCycleGatesById(cycleId: number) {
	const rows = await prisma.cycleActivity.findMany({
		where: { cycleId },
		select: { type: true, enabled: true, startAt: true, endAt: true },
	});

	const now = new Date();
	const isOpen = (r: any) =>
		r.enabled &&
		(!r.startAt || now >= r.startAt) &&
		(!r.endAt || now <= r.endAt);

	return {
		DEFINE: rows.some(r => r.type === "DEFINE" && isOpen(r)),
		EVALUATE: rows.some(r => r.type === "EVALUATE" && isOpen(r)),
		SUMMARY: rows.some(r => r.type === "SUMMARY" && isOpen(r)),
	};
}

async function hasConfirmTasks(cycleDbId: number, employeeId: string, kpiDefineMode: string) {
	// confirm side depends on mode:
	// mode1: evaluatee confirms (evaluateeId == me)
	// mode2: evaluator approves (evaluatee does NOT confirm)
	if (kpiDefineMode !== "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS") return false;

	const count = await prisma.evaluationAssignment.count({
		where: {
		cycleId: cycleDbId,
		evaluateeId: employeeId,
		currentPlan: { is: { confirmStatus: "REQUESTED" } },
		},
	});
	return count > 0;
}

export default async function EvaluateeLanding({ params }: Props) {
	const { cycleId } = await params;

	const user = await requireUser();
	if (!user.employeeId) notFound();

	const cycle = await prisma.evaluationCycle.findUnique({
		where: { publicId: cycleId },
		select: { id: true, kpiDefineMode: true, closedAt: true },
	});
	if (!cycle) notFound();

	const gates = await getCycleGatesById(cycle.id);

	// Determine which actions are meaningful for evaluatee
	const canDefine = gates.DEFINE && cycle.kpiDefineMode === "EVALUATEE_DEFINES_EVALUATOR_APPROVES";
	const canConfirm = gates.DEFINE && (await hasConfirmTasks(cycle.id, user.employeeId, cycle.kpiDefineMode));
	const canSummary = gates.SUMMARY;

	const actions = [
		{ key: "define", enabled: canDefine, href: `/${cycleId}/evaluatee/defineKpi`, label: "กำหนดตัวชี้วัด", desc: "ร่าง/แก้ KPI และส่งให้ผู้ประเมินอนุมัติ" },
		{ key: "confirm", enabled: canConfirm, href: `/${cycleId}/evaluatee/confirmKpi`, label: "รับรองตัวชี้วัด", desc: "ตรวจสอบ KPI ที่ผู้ประเมินส่งมาให้รับรอง" },
		{ key: "summary", enabled: canSummary, href: `/${cycleId}/evaluatee/summaryKpi`, label: "สรุปผล", desc: "ดูคะแนนเมื่อเข้าสู่ช่วงสรุปผล" },
	];

	const enabled = actions.filter(a => a.enabled);

	if (enabled.length === 1) redirect(enabled[0].href);

	if (enabled.length === 0) {
		return (
		<div className="p-6">
			<h1 className="text-xl font-semibold">ยังไม่มีกิจกรรมที่เปิดให้ใช้งาน</h1>
			<p className="mt-2 text-sm text-gray-600">กรุณารอผู้ดูแลระบบเปิดช่วงที่เกี่ยวข้อง</p>
		</div>
		);
	}

	return (
		<div className="p-6">
			<h1 className="text-xl font-semibold">เลือกเมนูการทำงาน</h1>
			<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{actions.map(a => (
				<Link
					key={a.key}
					href={a.href}
					className={`rounded-xl border p-4 ${a.enabled ? "hover:bg-gray-50" : "opacity-40 pointer-events-none"}`}
				>
					<div className="font-medium">{a.label}</div>
					<div className="text-sm text-gray-600">{a.desc}</div>
				</Link>
				))}
			</div>
		</div>
	);
}