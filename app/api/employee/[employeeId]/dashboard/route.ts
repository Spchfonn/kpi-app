import { NextResponse } from "next/server";
import { prisma } from "@/prisma/client";
import { z } from "zod";
import { requireAdmin, requireUser, AuthError } from "@/app/lib/auth";

const qSchema = z.object({
	cycleId: z.string().min(1),
	take: z.coerce.number().int().min(1).max(24).default(6),
});

function toPctFrom5(score5: number) {
	// score5: 0..5
	return Math.max(0, Math.min(100, (score5 / 5) * 100));
}

function avg(nums: number[]) {
	if (nums.length === 0) return null;
	return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round2(n: number | null) {
	if (n == null) return null;
	return Math.round(n * 100) / 100;
}

export async function GET(req: Request, ctx: { params: Promise<{ employeeId: string }> }) {
	try {
		const u = await requireUser().catch(async () => await requireAdmin());

		const { employeeId } = await ctx.params;

		const { searchParams } = new URL(req.url);
		const parsed = qSchema.safeParse({
			cycleId: searchParams.get("cycleId"),
			take: searchParams.get("take") ?? undefined,
		});
		if (!parsed.success) {
			return NextResponse.json({ ok: false, message: "invalid query", issues: parsed.error.issues }, { status: 400 });
		}
		const { cycleId, take } = parsed.data;

		const cycleKey = parsed.data.cycleId; // string
		const isNumericId = /^\d+$/.test(cycleKey);

		const focusCycle = await prisma.evaluationCycle.findUnique({
			where: isNumericId
				? { id: Number(cycleKey) }
				: { publicId: cycleKey },
			select: {
				id: true,
				publicId: true,
				name: true,
				year: true,
				round: true,
				activities: { select: { type: true, enabled: true, startAt: true, endAt: true } },
			},
		});

		if (!focusCycle) {
			return NextResponse.json({ ok: false, message: "cycle not found" }, { status: 404 });
		}
		const cycleIdInt = focusCycle.id;

		const employee = await prisma.employee.findUnique({
			where: { id: employeeId },
			select: {
				id: true,
				name: true,
				lastName: true,
				organization: { select: { id: true, name: true } },
				position: { select: { id: true, name: true } },
			},
		});
		  
		if (!employee) {
			return NextResponse.json({ ok: false, message: "employee not found" }, { status: 404 });
		}

		const deptId = employee.organization?.id ?? null;

		// ---- ดึง cycles ย้อนหลังสำหรับ trend (อิงจาก year/round)
		// เอาย้อนหลังจาก "รอบที่กำลังดู" โดยใช้ year/round เป็น ordering
		const cyclesForTrend = await prisma.evaluationCycle.findMany({
			where: {
			  OR: [
				{ year: { lt: focusCycle.year } },
				{ year: focusCycle.year, round: { lte: focusCycle.round ?? 0 } },
			  ],
			},
			orderBy: [{ year: "desc" }, { round: "desc" }, { id: "desc" }],
			take,
			select: { id: true, name: true, year: true, round: true },
		});
		const trendCycleIds = cyclesForTrend.map(c => c.id);

		// ---- assignments ของ employee ในหลาย cycle + join evaluatedPlan nodes
		const employeeAssignments = await prisma.evaluationAssignment.findMany({
			where: { evaluateeId: employeeId, cycleId: { in: trendCycleIds } },
			select: {
				cycleId: true,
				evalStatus: true,
				submittedAt: true,
				needsReEval: true,
				evaluatedPlanId: true,
				currentPlanId: true,
				evaluatedPlan: {
				select: {
					id: true,
					confirmStatus: true,
					confirmTarget: true,
					confirmRequestedAt: true,
					confirmedAt: true,
					rejectedAt: true,
					nodes: {
						where: { nodeType: "ITEM" },
						select: {
							id: true,
							title: true,
							weightPercent: true,
							type: { select: { type: true } },
							currentSubmission: { select: { finalScore: true } }, // finalScore เต็ม 5
						},
					},
				},
				},
				currentPlan: {
					select: {
						id: true,
						confirmStatus: true,
						confirmTarget: true,
						confirmRequestedAt: true,
						confirmedAt: true,
						rejectedAt: true,
					},
				},
			},
		});

		// ---- assignments ของแผนก (benchmark) ในหลาย cycle (เฉพาะ SUBMITTED)
		// หมายเหตุ: benchmark จะใช้ evaluatedPlan เช่นกัน
		const deptAssignments = deptId
		? await prisma.evaluationAssignment.findMany({
			where: {
				cycleId: { in: trendCycleIds },
				evalStatus: "SUBMITTED",
				evaluatee: { organizationId: deptId },
			},
			select: {
				cycleId: true,
				evaluatedPlan: {
				select: {
					nodes: {
						where: { nodeType: "ITEM" },
						select: { weightPercent: true, currentSubmission: { select: { finalScore: true } } },
					},
				},
				},
			},
			})
		: [];

		// helper: compute weighted avg score (0..5) from plan nodes
		function computePlanScore5(nodes: Array<{ weightPercent: any; currentSubmission: { finalScore: number | null } | null }>) {
			let sum = 0;
			let wsum = 0;
			for (const n of nodes) {
				const w = n.weightPercent ? Number(n.weightPercent) : 0;
				const s = n.currentSubmission?.finalScore;
				if (s == null) continue;
				sum += Number(s) * w;
				wsum += w;
			}
			if (!wsum) return null;
			return sum / wsum; // 0..5
		}

		// ---- scoreTrend + kpiTypeUsage
		const byEmployeeCycle = new Map<number, any>();
		for (const a of employeeAssignments) {
			if (a.evalStatus !== "SUBMITTED") {
				byEmployeeCycle.set(a.cycleId, {
					cycleId: a.cycleId,
					scorePct: null,
					typeCounts: { QUANTITATIVE: 0, QUALITATIVE: 0, CUSTOM: 0 },
				});
				continue;
			}
			const nodes = a.evaluatedPlan?.nodes ?? [];
			const score5 = computePlanScore5(nodes.map(n => ({
				weightPercent: n.weightPercent,
				currentSubmission: n.currentSubmission,
			})));
			byEmployeeCycle.set(a.cycleId, {
				cycleId: a.cycleId,
				scorePct: score5 == null ? null : toPctFrom5(score5),
				typeCounts: nodes.reduce(
				(acc, n) => {
					const t = n.type?.type ?? null;
					if (t === "QUANTITATIVE") acc.QUANTITATIVE += 1;
					else if (t === "QUALITATIVE") acc.QUALITATIVE += 1;
					else if (t === "CUSTOM") acc.CUSTOM += 1;
					return acc;
				},
				{ QUANTITATIVE: 0, QUALITATIVE: 0, CUSTOM: 0 }
				),
			});
		}

		const byDeptCycleScoresPct = new Map<number, number[]>();
		for (const a of deptAssignments) {
			const nodes = a.evaluatedPlan?.nodes ?? [];
			const score5 = computePlanScore5(nodes);
			if (score5 == null) continue;
			const pct = toPctFrom5(score5);
			const arr = byDeptCycleScoresPct.get(a.cycleId) ?? [];
			arr.push(pct);
			byDeptCycleScoresPct.set(a.cycleId, arr);
		}

		const cyclesAsc = [...cyclesForTrend].sort((a, b) => {
			if (a.year !== b.year) return a.year - b.year;
			if ((a.round ?? 0) !== (b.round ?? 0)) return (a.round ?? 0) - (b.round ?? 0);
			return a.id - b.id;
		});

		const scoreTrend = cyclesAsc.map(c => {
			const emp = byEmployeeCycle.get(c.id);
			const deptArr = byDeptCycleScoresPct.get(c.id) ?? [];
			const deptAvg = avg(deptArr);

			return {
				cycleId: c.id,
				cycleName: c.name,
				employeeScorePct: round2(emp?.scorePct ?? null),
				deptAvgPct: round2(deptAvg == null ? null : deptAvg),
			};
		});

		const kpiTypeUsage = cyclesAsc.map(c => {
			const emp = byEmployeeCycle.get(c.id);
			const counts = emp?.typeCounts ?? { QUANTITATIVE: 0, QUALITATIVE: 0, CUSTOM: 0 };
			const total = counts.QUANTITATIVE + counts.QUALITATIVE + counts.CUSTOM;
			return {
				cycleId: c.id,
				cycleName: c.name,
				...counts,
				total,
			};
		});

		// ---- focus cycle scatter + workflow
		const focusAssignment = employeeAssignments.find(a => a.cycleId === cycleIdInt) ?? null;

		const focusNodes = focusAssignment?.evaluatedPlan?.nodes ?? [];
		const weightVsScore = focusNodes.map(n => {
		const score5 = n.currentSubmission?.finalScore ?? null;
			return {
				nodeId: n.id,
				title: n.title,
				kpiType: n.type?.type ?? null,
				weightPercent: n.weightPercent ? Number(n.weightPercent) : 0,
				score5: score5 == null ? null : Number(score5),
				scorePct: score5 == null ? null : round2(toPctFrom5(Number(score5))),
			};
		});

		// ---- summary acknowledgement (focus cycle)
		const ack = await prisma.evaluateeCycleAcknowledgement.findUnique({
			where: { cycleId_evaluateeId: { cycleId: cycleIdInt, evaluateeId: employeeId } },
			select: { acknowledgedAt: true },
		});

		const summaryActivity = (focusCycle.activities ?? []).find(a => a.type === "SUMMARY" && a.enabled);
		const workflow = {
			evalStatus: focusAssignment?.evalStatus ?? null,
			submittedAt: focusAssignment?.submittedAt ? focusAssignment.submittedAt.toISOString() : null,
			needsReEval: focusAssignment?.needsReEval ?? false,
			plan: {
				planId: focusAssignment?.evaluatedPlan?.id ?? focusAssignment?.currentPlan?.id ?? null,
				confirmStatus: (focusAssignment?.evaluatedPlan?.confirmStatus ?? focusAssignment?.currentPlan?.confirmStatus) ?? null,
				confirmTarget: (focusAssignment?.evaluatedPlan?.confirmTarget ?? focusAssignment?.currentPlan?.confirmTarget) ?? null,
				confirmRequestedAt: (focusAssignment?.evaluatedPlan?.confirmRequestedAt ?? focusAssignment?.currentPlan?.confirmRequestedAt)
				? (focusAssignment?.evaluatedPlan?.confirmRequestedAt ?? focusAssignment?.currentPlan?.confirmRequestedAt)!.toISOString()
				: null,
				confirmedAt: (focusAssignment?.evaluatedPlan?.confirmedAt ?? focusAssignment?.currentPlan?.confirmedAt)
				? (focusAssignment?.evaluatedPlan?.confirmedAt ?? focusAssignment?.currentPlan?.confirmedAt)!.toISOString()
				: null,
				rejectedAt: (focusAssignment?.evaluatedPlan?.rejectedAt ?? focusAssignment?.currentPlan?.rejectedAt)
				? (focusAssignment?.evaluatedPlan?.rejectedAt ?? focusAssignment?.currentPlan?.rejectedAt)!.toISOString()
				: null,
			},
			summary: {
				summaryEnabled: Boolean(summaryActivity),
				acknowledgedAt: ack?.acknowledgedAt ? ack.acknowledgedAt.toISOString() : null,
			},
		};

		// ---- Insights (ช่วยกำหนด KPI)
		const insights: any[] = [];

		// 1) น้ำหนักรวม ITEM ใน focus cycle
		const weightSum = weightVsScore.reduce((s, x) => s + (x.weightPercent || 0), 0);
		if (focusNodes.length > 0 && Math.abs(weightSum - 100) > 0.01) {
			insights.push({
				code: "WEIGHT_SUM_NOT_100",
				severity: "WARN",
				title: "น้ำหนักรวมไม่เท่ากับ 100%",
				detail: `น้ำหนักรวมของ KPI ITEM = ${round2(weightSum)}% ควรปรับให้ครบ 100% เพื่อให้การคิดคะแนนถูกต้อง`,
			});
		}

		// 2) น้ำหนักสูงแต่คะแนนต่ำ (top weight 3 ที่ scorePct ต่ำ)
		const candidates = weightVsScore
		.filter(x => (x.weightPercent ?? 0) >= 20 && (x.score5 ?? 5) <= 2)
		.slice(0, 5);

		if (candidates.length) {
			insights.push({
				code: "HIGH_WEIGHT_LOW_SCORE",
				severity: "WARN",
				title: "KPI น้ำหนักสูงแต่คะแนนต่ำ",
				detail: "มี KPI สำคัญ (น้ำหนักสูง) แต่ได้คะแนนต่ำ แนะนำแตก KPI/ปรับเป้าหมายให้สมจริง หรือเพิ่มทรัพยากร",
				relatedNodeIds: candidates.map(x => x.nodeId),
			});
		}

		// 3) type imbalance (ถ้า type ใด > 80%)
		const focusTypeCounts = weightVsScore.reduce(
			(acc, x) => {
				if (x.kpiType === "QUANTITATIVE") acc.QUANTITATIVE += 1;
				else if (x.kpiType === "QUALITATIVE") acc.QUALITATIVE += 1;
				else if (x.kpiType === "CUSTOM") acc.CUSTOM += 1;
				return acc;
			},
			{ QUANTITATIVE: 0, QUALITATIVE: 0, CUSTOM: 0 }
			);
			const focusTotal = focusTypeCounts.QUANTITATIVE + focusTypeCounts.QUALITATIVE + focusTypeCounts.CUSTOM;
			if (focusTotal > 0) {
			const maxShare = Math.max(
				focusTypeCounts.QUANTITATIVE / focusTotal,
				focusTypeCounts.QUALITATIVE / focusTotal,
				focusTypeCounts.CUSTOM / focusTotal
			);
			if (maxShare >= 0.8) {
				insights.push({
				code: "TYPE_IMBALANCE",
				severity: "INFO",
				title: "ประเภท KPI กระจุกตัว",
				detail: "ประเภท KPI กระจุกตัวมาก อาจทำให้การวัดผลเอนเอียง แนะนำผสม QUANT/QUAL/CUSTOM ให้สมดุล",
				});
			}
		}

		return NextResponse.json({
			ok: true,
			data: {
				employee: {
					id: employee.id,
					fullName: `${employee.name} ${employee.lastName}`,
					organization: employee.organization,
					position: employee.position,
				},
				focusCycle: {
					id: focusCycle.id,
					name: focusCycle.name,
					year: focusCycle.year,
					round: focusCycle.round,
					activities: (focusCycle.activities ?? []).map(a => ({
						type: a.type,
						enabled: a.enabled,
						startAt: a.startAt ? a.startAt.toISOString() : null,
						endAt: a.endAt ? a.endAt.toISOString() : null,
					})),
				},
				scoreTrend,
				kpiTypeUsage,
				weightVsScore,
				workflow,
				insights,
			},
		});
	} catch (e: any) {
		if (e instanceof AuthError) {
			return NextResponse.json({ ok: false, message: e.message }, { status: e.status });
		}
		console.error(e);
		return NextResponse.json({ ok: false, message: "internal error" }, { status: 500 });
	}
}