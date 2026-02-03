import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { requireAdmin, requireUser } from "@/app/lib/auth";
import { z } from "zod";

const querySchema = z.object({
	year: z.coerce.number().int().optional(),
	take: z.coerce.number().int().min(1).max(50).default(12),
});

function pct(n: number, d: number) {
	if (!d) return 0;
	return Math.round((n / d) * 10000) / 100; // 2 decimals
}

type Activity = { type: "DEFINE" | "EVALUATE" | "SUMMARY"; enabled: boolean; startAt: Date | null; endAt: Date | null };

function pickDisplayStatus(cycle: { closedAt: Date | null; activities: Activity[] }) {
	if (cycle.closedAt) return "CLOSED";

	const now = new Date();

	const enabled = (cycle.activities ?? []).filter(a => a.enabled);

	// 1) ถ้าตอนนี้อยู่ในช่วงเวลา activity ไหน
	const inWindow = enabled.find(a => {
		const sOk = !a.startAt || a.startAt <= now;
		const eOk = !a.endAt || a.endAt >= now;
		return sOk && eOk;
	});
	if (inWindow) return inWindow.type;

	// 2) ถ้าไม่มีอันไหน match เวลา: ใช้ priority (SUMMARY > EVALUATE > DEFINE)
	const priority = ["SUMMARY", "EVALUATE", "DEFINE"] as const;
	for (const t of priority) {
		if (enabled.some(a => a.type === t)) return t;
	}

	return "NOT_ACTIVE";
}

export async function GET(req: Request) {
	try {
		const user = await requireAdmin();
		if (!user?.isAdmin) {
			return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
		}

		const { searchParams } = new URL(req.url);
		const q = querySchema.safeParse({
			year: searchParams.get("year") ?? undefined,
			take: searchParams.get("take") ?? undefined,
		});
		if (!q.success) {
			return NextResponse.json({ ok: false, message: "invalid query", issues: q.error.issues }, { status: 400 });
		}

		const { year, take } = q.data;

		// 1) cycles (latest first)
		const cycles = await prisma.evaluationCycle.findMany({
			where: year ? { year } : {},
			orderBy: [{ year: "desc" }, { round: "desc" }, { id: "desc" }],
			take,
			select: {
				id: true,
				name: true,
				year: true,
				round: true,
				status: true,
				startDate: true,
				endDate: true,
				closedAt: true,
				kpiDefineMode: true,
				kpiLevelMode: true,
				activities: {
					select: { type: true, enabled: true, startAt: true, endAt: true },
				},
			},
		});

		const cycleIds = cycles.map(c => c.id);
		const activeCycle = cycles.find(c => c.closedAt == null) ?? cycles[0] ?? null;

		// 2) assignments for selected cycles (aggregate in JS for simplicity)
		const assignments = await prisma.evaluationAssignment.findMany({
			where: { cycleId: { in: cycleIds } },
			select: {
				cycleId: true,
				evalStatus: true,
				submittedAt: true,
				needsReEval: true,
				currentPlan: {
					select: { confirmStatus: true, confirmTarget: true },
				},
				evaluatee: {
					select: {
						organization: { select: { id: true, name: true } },
					},
				},
			},
		});

		// 3) plans confirm stats (optional แต่ดีมากสำหรับ pending)
		const plans = await prisma.kpiPlan.findMany({
			where: { assignment: { cycleId: { in: cycleIds } } },
			select: {
				assignment: { select: { cycleId: true } },
				confirmStatus: true,
				confirmTarget: true,
				confirmRequestedAt: true,
				confirmedAt: true,
				rejectedAt: true,
			},
		});

		// ---- Build per-cycle aggregates
		const byCycle: Record<number, any> = {};
		for (const c of cycles) {
			byCycle[c.id] = {
				cycleId: c.id,
				cycleName: c.name,
				year: c.year,
				round: c.round,
				status: c.status,
				startDate: c.startDate,
				endDate: c.endDate,
				closedAt: c.closedAt,

				assignmentsTotal: 0,
				submitted: 0,
				inProgress: 0,
				notStarted: 0,
				needsReEval: 0,

				plansTotal: 0,
				planDraft: 0,
				planRequested: 0,
				planConfirmed: 0,
				planRejected: 0,
				planCancelled: 0,
			};
		}

		for (const a of assignments) {
			const row = byCycle[a.cycleId];
			if (!row) continue;

			row.assignmentsTotal += 1;
			if (a.needsReEval) row.needsReEval += 1;

			if (a.evalStatus === "SUBMITTED") row.submitted += 1;
			else if (a.evalStatus === "IN_PROGRESS") row.inProgress += 1;
			else row.notStarted += 1;
		}

		for (const p of plans) {
			const cycleId = p.assignment.cycleId;
			const row = byCycle[cycleId];
			if (!row) continue;

			row.plansTotal += 1;
			switch (p.confirmStatus) {
				case "DRAFT":
				row.planDraft += 1;
				break;
				case "REQUESTED":
				row.planRequested += 1;
				break;
				case "CONFIRMED":
				row.planConfirmed += 1;
				break;
				case "REJECTED":
				row.planRejected += 1;
				break;
				case "CANCELLED":
				row.planCancelled += 1;
				break;
			}
		}

		const cyclesTable = cycles.map(c => {
			const r = byCycle[c.id];

			const displayStatus = pickDisplayStatus({
				closedAt: c.closedAt,
				activities: c.activities as any,
			});

			return {
				...r,
				displayStatus,
				submittedPct: pct(r.submitted, r.assignmentsTotal),
				confirmedPct: pct(r.planConfirmed, r.plansTotal),
				pendingConfirm: r.planRequested,
			};
		});

		// ---- Cards (รวมทุก cycle ที่ query มา)
		const totalCycles = cycles.length;
		const totalAssignments = assignments.length;
		const totalSubmitted = assignments.filter(a => a.evalStatus === "SUBMITTED").length;
		const totalNeedsReEval = assignments.filter(a => a.needsReEval).length;
		const totalPlanRequested = plans.filter(p => p.confirmStatus === "REQUESTED").length;

		// Dept progress (ใช้ activeCycle ถ้ามี ไม่งั้นใช้ cycle ล่าสุด)
		const focusCycleId = activeCycle?.id ?? (cycles[0]?.id ?? null);

		let deptProgress: Array<{
			orgId: string;
			orgName: string;
			assignments: number;
			submitted: number;
			submittedPct: number;
		}> = [];

		if (focusCycleId) {
		const m = new Map<string, { orgId: string; orgName: string; assignments: number; submitted: number }>();

		for (const a of assignments) {
			if (a.cycleId !== focusCycleId) continue;
			const org = a.evaluatee.organization;
			const key = org.id;
			if (!m.has(key)) m.set(key, { orgId: org.id, orgName: org.name, assignments: 0, submitted: 0 });

			const x = m.get(key)!;
			x.assignments += 1;
			if (a.evalStatus === "SUBMITTED") x.submitted += 1;
		}

		deptProgress = Array.from(m.values())
			.map(x => ({ ...x, submittedPct: pct(x.submitted, x.assignments) }))
			.sort((a, b) => a.submittedPct - b.submittedPct); // ต่ำขึ้นก่อนเพื่อ “ตามงาน”
		}

		// ---- Alerts (ตัวอย่าง: แผนก completion ต่ำกว่า 60%)
		const alerts = deptProgress
		.filter(d => d.assignments >= 3 && d.submittedPct < 60)
		.slice(0, 8)
		.map(d => ({
			type: "LOW_COMPLETION" as const,
			orgName: d.orgName,
			submittedPct: d.submittedPct,
			assignments: d.assignments,
		}));

		return NextResponse.json({
			ok: true,
			data: {
				query: { year, take },
				activeCycle,
				cards: {
				totalCycles,
				totalAssignments,
				totalSubmitted,
				completionPct: pct(totalSubmitted, totalAssignments),
				pendingConfirm: totalPlanRequested,
				needsReEval: totalNeedsReEval,
				},
				cyclesTable,
				deptProgress: {
				cycleId: focusCycleId,
				rows: deptProgress,
				},
				alerts,
			},
		});
	} catch (e: any) {
		console.error(e);
		return NextResponse.json({ ok: false, message: "internal error" }, { status: 500 });
	}
}