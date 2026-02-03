import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/prisma/client";
import { requireUser } from "@/app/lib/auth"; // ใช้ของคุณ

type Props = {params: Promise<{ cycleId: string }>;};

async function getCycleGatesByCycleId(cycleId: number) {
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

// evaluator มีงาน evaluate จริงไหม (มี plan ACTIVE/CONFIRMED อย่างน้อย 1 assignment)
async function hasEvaluatableAssignments(cycleDbId: number, evaluatorEmployeeId: string) {
	const count = await prisma.evaluationAssignment.count({
		where: {
		cycleId: cycleDbId,
		evaluatorId: evaluatorEmployeeId,
		currentPlan: {
			is: {
				status: "ACTIVE",
				confirmStatus: "CONFIRMED",
			},
		},
		},
	});
	return count > 0;
}

export default async function EvaluatorLanding({ params }: Props) {
	const { cycleId } = await params;

	const user = await requireUser();
	if (!user.employeeId) notFound();

	const cycle = await prisma.evaluationCycle.findUnique({
		where: { publicId: cycleId },
		select: { id: true, publicId: true, name: true, closedAt: true },
	});

	if (!cycle) notFound();

	const gates = await getCycleGatesByCycleId(cycle.id);

	// ถ้าปิดรอบแล้ว แต่ summary ไม่เปิด -> ให้ admin จัดการ
	// if (cycle.closedAt && !gates.SUMMARY) { ... }

	// คำนวณ actions ที่ "ทำได้จริง"
	const actions: { key: "define" | "evaluate" | "summary"; href: string; enabled: boolean }[] = [];

	// DEFINE: เปิดแล้ว evaluator เข้า defineKpi ได้เสมอ (จะมีงานหรือไม่ค่อยว่ากัน)
	actions.push({
		key: "define",
		href: `/${cycleId}/evaluator/defineKpi`,
		enabled: gates.DEFINE,
	});

	// EVALUATE: ต้องเปิด gate และต้องมี assignment ที่ currentPlan CONFIRMED/ACTIVE อย่างน้อย 1
	const canEval = gates.EVALUATE && (await hasEvaluatableAssignments(cycle.id, user.employeeId));
	actions.push({
		key: "evaluate",
		href: `/${cycleId}/evaluator/evaluateKpi`,
		enabled: canEval,
	});

	// SUMMARY: เปิด gate ก็เข้าได้ (หน้า summary ค่อยแสดงรายงาน/ผล)
	actions.push({
		key: "summary",
		href: `/${cycleId}/evaluator/summaryKpi`,
		enabled: gates.SUMMARY,
	});

	const enabledActions = actions.filter(a => a.enabled);

	// ถ้ามีอันเดียว ทำ auto redirect
	if (enabledActions.length === 1) {
		redirect(enabledActions[0].href);
	}

	// ถ้าไม่มีเลย แสดงข้อความ
	if (enabledActions.length === 0) {
		return (
		<div className="p-6">
			<h1 className="text-xl font-semibold">ยังไม่มีกิจกรรมที่เปิดให้ใช้งาน</h1>
			<p className="mt-2 text-sm text-gray-600">
				กรุณารอผู้ดูแลระบบเปิดช่วง “กำหนด/ประเมิน/สรุปผล”
			</p>
		</div>
		);
	}

	return (
		<div className='min-h-screen w-screen bg-myApp-cream flex'>
			{/* Left panel */}
			<aside className={`w-[35%] bg-myApp-green flex items-center justify-center`}>
				<div className="text-white flex items-center gap-6">
					{/* Logo placeholder */}
					<div className="h-34 w-34 rounded-full flex items-center justify-center">
					<img src="/image/logo.png" alt="Logo" className="h-full w-full object-contain" />
					</div>

					<div className="w-1 h-32 bg-myApp-cream rounded-full" />
					<div className="text-bigTitle font-medium leading-12">
					ระบบ<br />จัดการ<br />ตัวชี้วัด
					</div>
				</div>
			</aside>

			{/* Right panel */}
			<main className="flex-1 flex-col items-center justify-center px-6 m-auto">
				<h1 className="text-center text-title font-semibold text-myApp-blueDark">เลือกเมนูการทำงาน</h1>

				<div className="mt-4 gap-3 flex items-center justify-center">
					<Link
					href={actions[0].href}
					className={`rounded-xl border-2 p-3 bg-myApp-white border-myApp-blueDark
								${actions[0].enabled ? "hover:bg-gray-50" : "opacity-40 pointer-events-none"}`}
					>
						<div className="font-semibold text-body-changed text-myApp-blueDark">กำหนดตัวชี้วัด</div>
						<div className="font-semibold text-smallBody text-myApp-blueDark">สร้าง/แก้ไขตัวชี้วัด และส่งให้รับรอง</div>
					</Link>

					<Link
					href={actions[1].href}
					className={`rounded-xl border-2 p-3 bg-myApp-white border-myApp-blueDark
								${actions[1].enabled ? "hover:bg-gray-50" : "opacity-40 pointer-events-none"}`}
					>
						<div className="font-semibold text-body-changed text-myApp-blueDark">ประเมินตัวชี้วัด</div>
						<div className="font-semibold text-smallBody text-myApp-blueDark">ให้คะแนนตามตัวชี้วัดที่รับรองแล้ว</div>
					</Link>

					<Link
					href={actions[2].href}
					className={`rounded-xl border-2 p-3 bg-myApp-white border-myApp-blueDark
								${actions[2].enabled ? "hover:bg-gray-50" : "opacity-40 pointer-events-none"}`}
					>
						<div className="font-semibold text-body-changed text-myApp-blueDark">สรุปผล</div>
						<div className="font-semibold text-smallBody text-myApp-blueDark">ดูผลคะแนนและรายงานตามรอบ</div>
					</Link>
				</div>
			</main>
		</div>
	);
}