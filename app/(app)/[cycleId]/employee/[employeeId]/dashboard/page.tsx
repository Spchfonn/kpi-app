"use client";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	BarChart,
	Bar,
	ScatterChart,
	Scatter,
	LabelList,
} from "recharts";

type KpiTypeChoices = "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";

type EmployeeDashboardData = {
	employee: {
		id: string;
		fullName: string;
		organization: { id: string; name: string } | null;
		position: { id: string; name: string } | null;
	};
	focusCycle: { id: number; name: string; year: number; round: number | null };
	scoreTrend: Array<{
		cycleId: number;
		cycleName: string;
		employeeScorePct: number | null;
		deptAvgPct: number | null;
	}>;
	kpiTypeUsage: Array<{
		cycleId: number;
		cycleName: string;
		QUANTITATIVE: number;
		QUALITATIVE: number;
		CUSTOM: number;
		total: number;
	}>;
	weightVsScore: Array<{
		nodeId: string;
		title: string;
		kpiType: KpiTypeChoices | null;
		weightPercent: number;
		score5: number | null;
		scorePct: number | null;
	}>;
	workflow: {
		evalStatus: string | null;
		submittedAt: string | null;
		needsReEval: boolean;
		plan: {
			confirmStatus: string | null;
			confirmTarget: string | null;
			confirmRequestedAt: string | null;
			confirmedAt: string | null;
			rejectedAt: string | null;
		};
		summary: { summaryEnabled: boolean; acknowledgedAt: string | null };
	};
	insights: Array<{
		code: string;
		severity: "INFO" | "WARN";
		title: string;
		detail: string;
		relatedNodeIds?: string[];
	}>;
};

function Card({ title, subtitle, children, }: {
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	}) {
	return (
		<div className="rounded-2xl bg-myApp-white shadow-sm p-6">
			<div className="text-nav font-semibold text-myApp-blueDark">{title}</div>
			{subtitle && <div className="mt-1 text-smallBody text-gray-600">{subtitle}</div>}
			<div className="mt-4">{children}</div>
		</div>
	);
}

const COLORS = {
	employee: "#D16060",
	deptAvg: "#217E9F",
	quantitative: "#E27EA6",
	qualitative: "#F7D361",
	custom: "#459EC1",
};

// tooltip สำหรับ line/bar ให้ดูสะอาดขึ้น
function DefaultTooltip({ active, payload, label }: any) {
	if (!active || !payload?.length) return null;
	return (
		<div className="rounded-lg bg-white shadow-md border px-3 py-2">
		<div className="text-xs font-semibold text-gray-800">{label}</div>
		<div className="mt-1 space-y-1">
			{payload.map((p: any) => (
			<div key={p.dataKey} className="text-xs text-gray-700 flex justify-between gap-3">
				<span>{p.name}</span>
				<span className="font-semibold">{p.value}</span>
			</div>
			))}
		</div>
		</div>
	);
}

// tooltip สำหรับ scatter: โชว์ title + weight + score
function ScatterTooltip({ active, payload }: any) {
	if (!active || !payload?.length) return null;
	const p = payload[0]?.payload;
	if (!p) return null;

	return (
		<div className="rounded-lg bg-white shadow-md border px-3 py-2 max-w-xs">
		<div className="text-xs font-semibold text-gray-800 line-clamp-2">{p.title}</div>
		<div className="mt-1 text-xs text-gray-700">
			Weight: <span className="font-semibold">{p.weightPercent}%</span>
		</div>
		<div className="text-xs text-gray-700">
			Score: <span className="font-semibold">{p.score5 ?? "-"} / 5</span>{" "}
			<span className="text-gray-500">({p.scorePct ?? "-"}%)</span>
		</div>
		<div className="text-xs text-gray-700">
			Type: <span className="font-semibold">{p.kpiType ?? "-"}</span>
		</div>
		</div>
	);
}

function Pill({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium bg-myApp-white text-myApp-blueDark border-myApp-blueDark">
			{children}
		</span>
	);
}

export default function EmployeeDashboardPage() {
	const params = useParams() as { cycleId: string; employeeId: string };
	const cycleId = params.cycleId;
	const employeeId = params.employeeId;

	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<EmployeeDashboardData | null>(null);

	useEffect(() => {
		const run = async () => {
		try {
			setLoading(true);
			const res = await fetch(`/api/employee/${employeeId}/dashboard?cycleId=${cycleId}&take=6`, {
				cache: "no-store",
			});
			const json = await res.json().catch(() => null);

			if (!res.ok) {
				console.error("Dashboard API error", res.status, json);
				setData(null);
				return;
			}
			const payload = json?.ok === false ? null : (json?.data ?? json);
			console.log("Dashboard API payload", payload);
			setData(payload);
		} finally {
			setLoading(false);
		}
		};
		run();
	}, [cycleId, employeeId]);

	// สร้าง series สำหรับ scatter แยกตาม type (ทำให้ legend/filter เข้าใจง่าย)
	const scatterByType = useMemo(() => {
		const all = data?.weightVsScore ?? [];
		const q = all.filter((x) => x.kpiType === "QUANTITATIVE");
		const l = all.filter((x) => x.kpiType === "QUALITATIVE");
		const c = all.filter((x) => x.kpiType === "CUSTOM");
		const u = all.filter((x) => !x.kpiType);
		return { q, l, c, u };
	}, [data]);

	if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลด dashboard...</div>;
	if (!data) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูล</div>;

	const latestScore = [...data.scoreTrend].reverse().find((x) => x.employeeScorePct != null)?.employeeScorePct ?? null;

	return (
		<div className="px-20 py-7.5 space-y-6">
			{/* Header */}
			<div className="flex flex-col gap-2">
				<div className="text-title font-semibold text-myApp-blueDark">
					Dashboard ({data.employee.fullName})
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<Pill>{data.employee.position?.name ?? "-"}</Pill>
					<Pill>{data.employee.organization?.name ?? "-"}</Pill>
					<Pill>{data.focusCycle.name}</Pill>
					{latestScore != null && <Pill>Latest: {latestScore.toFixed(1)}%</Pill>}
				</div>

				{/* Workflow quick status */}
				<div className="text-smallBody text-gray-600">
					Eval: <span className="font-semibold">{data.workflow.evalStatus ?? "-"}</span>{" "}
					• Plan: <span className="font-semibold">{data.workflow.plan.confirmStatus ?? "-"}</span>{" "}
					• Summary:{" "}
					<span className="font-semibold">
						{data.workflow.summary.summaryEnabled ? "Enabled" : "Disabled"}
					</span>
					{data.workflow.needsReEval ? (
						<span className="ml-2 text-myApp-red font-semibold">• Needs Re-Eval</span>
					) : null}
				</div>
			</div>

			{/* Top row (เหมือนภาพ) */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* 1) Line chart: คะแนนย้อนหลัง */}
				<Card
				title="คะแนนผลการประเมินตัวชี้วัดที่ผ่านมา"
				subtitle="เปรียบเทียบคะแนนของพนักงานกับค่าเฉลี่ยแผนกในแต่ละรอบ (0–100%)"
				>
					<div className="h-65 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart data={data.scoreTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
								<CartesianGrid strokeDasharray="4 4" vertical={false} />
								<XAxis
									dataKey="cycleName"
									tick={{ fontSize: 12 }}
									axisLine={{ stroke: "#4AA3C2" }}
									tickLine={false}
								/>
								<YAxis
									domain={[0, 100]}
									tick={{ fontSize: 12 }}
									axisLine={{ stroke: "#4AA3C2" }}
									tickLine={false}
								/>
								<Tooltip content={<DefaultTooltip />} />
								<Legend
									wrapperStyle={{
										fontSize: 12,
									}}
								/>
								<Line
									type="monotone"
									dataKey="employeeScorePct"
									name={data.employee.fullName}
									stroke={COLORS.employee}
									strokeWidth={3}
									dot={{ r: 5, fill: COLORS.employee }}
									activeDot={{ r: 7 }}
									connectNulls
								>
									<LabelList
										dataKey="employeeScorePct"
										position="top"
										formatter={(v: any) => (v == null ? "" : `${Number(v).toFixed(1)}%`)}
										style={{ fill: COLORS.employee, fontSize: 12, fontWeight: 600 }}
									/>
								</Line>
								<Line
									type="monotone"
									dataKey="deptAvgPct"
									name="Department Avg"
									stroke={COLORS.deptAvg}
									strokeWidth={2}
									dot={{ r: 4, fill: COLORS.deptAvg }}
									connectNulls
								/>
							</LineChart>
						</ResponsiveContainer>
					</div>
				</Card>

				{/* 2) Stacked bar: ความถี่ประเภท KPI */}
				<Card
				title="กราฟแสดงความถี่การใช้งานตัวชี้วัดแต่ละประเภท"
				subtitle="นับจำนวน KPI ITEM ที่ใช้จริงในแต่ละรอบ แยกตาม QUANT/QUAL/CUSTOM"
				>
					<div className="h-65 w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data.kpiTypeUsage} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
								<CartesianGrid strokeDasharray="4 4" vertical={false} />
								<XAxis
									dataKey="cycleName"
									tick={{ fontSize: 12 }}
									axisLine={{ stroke: "#4AA3C2" }}
									tickLine={false}
									tickMargin={10}
								/>
								<YAxis
									tick={{ fontSize: 12 }}
									axisLine={{ stroke: "#4AA3C2" }}
									tickLine={false}
									allowDecimals={false}
								/>
								<Tooltip content={<DefaultTooltip />} />
								<Legend
									wrapperStyle={{
										fontSize: 12,
									}}
								/>
								<Bar
									dataKey="QUANTITATIVE"
									name="ตัวชี้วัดเชิงปริมาณ"
									stackId="a"
									fill={COLORS.quantitative}
								/>
								<Bar
									dataKey="QUALITATIVE"
									name="ตัวชี้วัดเชิงคุณภาพ"
									stackId="a"
									fill={COLORS.qualitative}
								/>
								<Bar
									dataKey="CUSTOM"
									name="ตัวชี้วัดแบบกำหนดเอง"
									stackId="a"
									fill={COLORS.custom}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Card>
			</div>

			{/* Bottom row */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* 3) Scatter: weight vs score */}
				<div className="lg:col-span-2">
				<Card
					title="คะแนนตัวชี้วัดที่ได้เทียบกับค่าน้ำหนัก"
					subtitle="ช่วยหา KPI ที่ “น้ำหนักสูงแต่คะแนนต่ำ” หรือ “น้ำหนักต่ำแต่คะแนนสูง” เพื่อปรับ KPI ให้เหมาะสม"
				>
					<div className="h-80 w-full">
					<ResponsiveContainer width="100%" height="100%">
						<ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
						<CartesianGrid strokeDasharray="4 4" />
						<XAxis
							type="number"
							dataKey="weightPercent"
							name="Weight"
							unit="%"
							domain={[0, 100]}
							tickCount={6}
							tick={{ fontSize: 12 }}
							axisLine={{ stroke: "#4AA3C2" }}
						/>
						<YAxis
							type="number"
							dataKey="score5"
							domain={[0, 5]}
							tick={{ fontSize: 12 }}
							axisLine={{ stroke: "#4AA3C2" }}
							tickLine={false}
						/>
						<Tooltip content={<ScatterTooltip />} />
						<Legend
							wrapperStyle={{
								fontSize: 12,
							}}
						/>
						<Scatter
							name="Quantitative"
							data={scatterByType.q}
							fill={COLORS.quantitative}
							shape="circle"
						/>

						<Scatter
							name="Qualitative"
							data={scatterByType.l}
							fill={COLORS.qualitative}
							shape="circle"
						/>

						<Scatter
							name="Custom"
							data={scatterByType.c}
							fill={COLORS.custom}
							shape="circle"
						/>
						{scatterByType.u.length > 0 ? <Scatter name="Unknown" data={scatterByType.u} /> : null}
						</ScatterChart>
					</ResponsiveContainer>
					</div>

					{/* hint เล็กๆ */}
					<div className="mt-3 text-smallBody text-gray-500">
						Tip: จุดที่อยู่ขวาล่าง (น้ำหนักสูง + คะแนนต่ำ) คือ KPI สำคัญที่อาจต้องปรับเป้าหมาย/แตกย่อย/เพิ่มทรัพยากร
					</div>
				</Card>
				</div>

				{/* Insights */}
				<Card title="Insights / คำแนะนำ" subtitle="ช่วยให้การกำหนด KPI รอบถัดไปมีคุณภาพขึ้น">
				<div className="space-y-3">
					{data.insights.length === 0 ? (
					<div className="text-smallBody text-gray-500">ยังไม่มีคำแนะนำ</div>
					) : (
					data.insights.map((x, idx) => (
						<div
						key={idx}
						className={`rounded-xl border p-3 ${
							x.severity === "WARN" ? "border-red-200 bg-red-50" : "border-gray-200 bg-gray-50"
						}`}
						>
							<div className={`text-sm font-semibold ${x.severity === "WARN" ? "text-myApp-red" : "text-myApp-blueDark"}`}>
								{x.title}
							</div>
							<div className="mt-1 text-xs text-gray-700">{x.detail}</div>
						</div>
					))
					)}

					{/* Quick actions (optional) */}
					{/* <div className="pt-2 border-t">
						<div className="text-xs font-semibold text-gray-700">Quick actions</div>
						<div className="mt-2 flex flex-col gap-2 text-sm">
							<a className="text-myApp-blue underline" href={`/${cycleId}/evaluator/defineKpi/${employeeId}`}>
								ไปหน้ากำหนดตัวชี้วัด →
							</a>
							<a className="text-myApp-blue underline" href={`/${cycleId}/evaluator/evaluateKpi/${employeeId}`}>
								ไปหน้าประเมิน →
							</a>
							<a className="text-myApp-blue underline" href={`/${cycleId}/evaluator/summaryKpi/${employeeId}`}>
								ไปหน้าสรุป →
							</a>
						</div>
					</div> */}
				</div>
				</Card>
			</div>
		</div>
	);
}