import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";

type DefineTH = "ยังไม่กำหนด" | "รอการอนุมัติ" | "สมบูรณ์";
type EvalTH = "ยังไม่ประเมิน" | "ยังไม่สมบูรณ์" | "สมบูรณ์";
type SumTH = "ยังไม่สรุป" | "สมบูรณ์";

// remove duplicate key in list
function uniqBy<T>(arr: T[], keyFn: (x: T[]) => string): T[] {
	const m = new Map<string, any>();
	for (const x of arr as any[]) m.set(keyFn(x), x);
	return [...m.values()];
}

// condition for check status of define kpi
function defineStatusFromPlan(
  plan:
    | null
    | undefined
    | { confirmStatus: "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED" }
): DefineTH {
	if (!plan) return "ยังไม่กำหนด";
	if (plan.confirmStatus === "REQUESTED") return "รอการอนุมัติ";
	if (plan.confirmStatus === "CONFIRMED") return "สมบูรณ์";
	return "ยังไม่กำหนด"; // DRAFT/REJECTED/CANCELLED
}

// condition for check status of evalaute kpi
function evaluateStatusFromPlan(evalStatus: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED"): EvalTH {
	if (evalStatus === "NOT_STARTED") return "ยังไม่ประเมิน";
	if (evalStatus === "SUBMITTED") return "สมบูรณ์";
	return "ยังไม่สมบูรณ์"; // IN_PROGRESS
}

// condition for check status of summary kpi
function summaryStatusFromCycle(cycleStatus: "DEFINE" | "EVALUATE" | "SUMMARY", evalStatus: EvalTH): SumTH {
	if (cycleStatus !== "SUMMARY") return "ยังไม่สรุป";
	return evalStatus === "สมบูรณ์" ? "สมบูรณ์" : "ยังไม่สรุป";
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
	const { id: cyclePublicId } = await params;
	if (!cyclePublicId) {
		return NextResponse.json({ ok: false, message: "invalid id" }, { status: 400 });
	}

	// 1) lookup cycle by publicId -> get db id + status
	const cycle = await prisma.evaluationCycle.findUnique({
		where: { publicId: cyclePublicId },
		select: { id: true, status: true },
	});

	if (!cycle) {
		return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });
	}

	const cycleId = cycle.id;

	const acks = await prisma.evaluateeCycleAcknowledgement.findMany({
		where: { cycleId },
		select: { evaluateeId: true },
	});
	  
	const ackSet = new Set(acks.map((a) => a.evaluateeId));

	// 2) get evaluation assignments of this cycle
	const assignments = await prisma.evaluationAssignment.findMany({
		where: { cycleId },
		select: {
			id: true,
			evalStatus: true,
			evaluatee: {
				select: {
					id: true,
					name: true,
					lastName: true,
					employeeNo: true,
					position: { select: { name: true } },
					level: { select: { name: true } },
				},
			},
			currentPlan: {
				select: {
				id: true,
				status: true,
				confirmStatus: true,
				nodes: {
					select: {
					nodeType: true,
					currentSubmission: {
						select: { calculatedScore: true, finalScore: true },
					},
					},
				},
				},
			},
		},
	});

	// 3) unique evaluatees for 1 row / employee
	const evaluatees = uniqBy(
		assignments.map((a) => a.evaluatee).filter(Boolean) as any[],
		(x: any) => x.id
	);

	type AssignmentRow = (typeof assignments)[number];
	const byEvaluateeId = new Map<string, AssignmentRow[]>();
	for (const a of assignments) {
		if (!a.evaluatee) continue;
		const key = a.evaluatee.id;
		if (!byEvaluateeId.has(key)) byEvaluateeId.set(key, []);
		byEvaluateeId.get(key)!.push(a);
	}

	const rows = evaluatees.map((emp: any) => {
		const empAssignments = byEvaluateeId.get(emp.id) ?? [];

		const defineStatuses = empAssignments.map((a) => defineStatusFromPlan(a.currentPlan));
		const defineStatus: DefineTH =
		defineStatuses.includes("ยังไม่กำหนด")
			? "ยังไม่กำหนด"
			: defineStatuses.includes("รอการอนุมัติ")
			? "รอการอนุมัติ"
			: "สมบูรณ์";

		const evalStatuses = empAssignments.map((a) => evaluateStatusFromPlan(a.evalStatus));
		const evaluateStatus: EvalTH =
		evalStatuses.includes("ยังไม่ประเมิน")
			? "ยังไม่ประเมิน"
			: evalStatuses.includes("ยังไม่สมบูรณ์")
			? "ยังไม่สมบูรณ์"
			: "สมบูรณ์";

		const summaryStatus: SumTH = cycle.status !== "SUMMARY" ? "ยังไม่สรุป"
									: ackSet.has(emp.id) ? "สมบูรณ์"
									: "ยังไม่สรุป";

		return {
			id: emp.id,
			employeeNo: emp.employeeNo ?? "",
			name: emp.name,
			lastName: emp.lastName,
			position: emp.position?.name ?? "",
			level: emp.level?.name ?? "",
			defineStatus,
			evaluateStatus,
			summaryStatus,
		};
	});

	const summary = {
		total: rows.length,
		defineDone: rows.filter((r) => r.defineStatus === "สมบูรณ์").length,
		evaluateDone: rows.filter((r) => r.evaluateStatus === "สมบูรณ์").length,
		summaryDone: rows.filter((r) => r.summaryStatus === "สมบูรณ์").length,
	};

	return NextResponse.json({ ok: true, summary, data: rows });
}