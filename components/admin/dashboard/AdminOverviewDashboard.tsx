"use client";

import { useEffect, useState } from "react";

type Overview = {
	activeCycle: any | null;
	cards: {
		totalCycles: number;
		totalAssignments: number;
		totalSubmitted: number;
		completionPct: number;
		pendingConfirm: number;
		needsReEval: number;
	};
	cyclesTable: any[];
	deptProgress: { cycleId: number; rows: any[] };
	alerts: any[];
};

function StatCard({ title, value, sub }: { title: string; value: any; sub?: string }) {
	return (
		<div className="rounded-xl bg-myApp-white p-4 shadow-sm">
			<div className="text-body font-medium text-myApp-blue">{title}</div>
			<div className="mt-1 text-dashboardValue font-semibold text-myApp-blueDark">{value}</div>
			{sub && <div className="mt-1 text-smallBody text-gray-500">{sub}</div>}
		</div>
	);
}

function Bar({ pct }: { pct: number }) {
	return (
		<div className="h-2 w-full rounded-full bg-gray-100">
			<div className="h-2 rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
		</div>
	);
}

export default function AdminOverviewDashboard({ year }: { year?: number }) {
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<Overview | null>(null);

	useEffect(() => {
		const run = async () => {
			try {
				setLoading(true);
				const qs = new URLSearchParams();
				qs.set("take", "12");
				if (year) qs.set("year", String(year));

				const res = await fetch(`/api/admin/dashboard/overview?${qs.toString()}`, { cache: "no-store" });
				const json = await res.json();
				if (json.ok) setData(json.data);
				else setData(null);
			} finally {
				setLoading(false);
			}
		};
		run();
	}, [year]);

	if (loading) return <div className="p-8 text-center text-gray-500">กำลังโหลดภาพรวม...</div>;
	if (!data) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลภาพรวม</div>;

	const ac = data.activeCycle;

	return (
		<div className="space-y-5">
			{/* Cards */}
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
				<StatCard title="Cycles" value={data.cards.totalCycles} />
				<StatCard title="Assignments" value={data.cards.totalAssignments} />
				<StatCard title="Submitted" value={data.cards.totalSubmitted} sub={`Completion ${data.cards.completionPct}%`} />
				<StatCard title="Pending Confirm" value={data.cards.pendingConfirm} />
				<StatCard title="Needs Re-Eval" value={data.cards.needsReEval} />
				<StatCard title="Active Cycle" value={ac ? ac.status : "-"} sub={ac ? ac.name : ""} />
			</div>

			{/* Dept progress + Alerts */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="rounded-xl bg-myApp-white p-6 shadow-sm lg:col-span-2">
					<div className="text-title font-medium text-myApp-blueDark">ความคืบหน้ารายแผนก (รอบโฟกัส)</div>
					<div className="mt-4 space-y-3">
						{data.deptProgress.rows.slice(0, 12).map((d: any) => (
						<div key={d.orgId} className="rounded-lg p-1">
							<div className="flex items-center justify-between gap-4">
								<div className="min-w-0">
									<div className="truncate font-medium text-myApp-blueDark">{d.orgName}</div>
									<div className="text-xs text-gray-500">
										{d.submitted}/{d.assignments} submitted
									</div>
								</div>
								<div className="w-28 text-right text-sm font-semibold text-myApp-blueDark">{d.submittedPct}%</div>
							</div>
							<div className="mt-2">
								<Bar pct={d.submittedPct} />
							</div>
						</div>
						))}
					</div>
				</div>

				<div className="rounded-xl bg-white p-5 shadow-sm">
					<div className="text-title font-medium text-myApp-blueDark">Alerts</div>
					<div className="mt-3 space-y-2">
						{data.alerts.length === 0 ? (
						<div className="text-smallBody text-gray-500">ไม่มีแจ้งเตือน</div>
						) : (
						data.alerts.map((a: any, idx: number) => (
							<div key={idx} className="rounded-lg border border-red-200 bg-red-50 p-3">
								<div className="font-medium text-myApp-red">{a.orgName}</div>
								<div className="text-sm text-myApp-red">
									Completion ต่ำ: {a.submittedPct}% (จาก {a.assignments} assignments)
								</div>
							</div>
						))
						)}
					</div>
				</div>
			</div>

			{/* Cycles table */}
			<div className="rounded-xl bg-white shadow-sm overflow-x-auto">
				<table className="min-w-225 w-full">
					<thead className="bg-myApp-blue">
						<tr>
							<th className="px-5 py-3 text-left text-body-changed font-semibold text-myApp-cream">Cycle</th>
							<th className="px-5 py-3 text-left text-body-changed font-semibold text-myApp-cream">Status</th>
							<th className="px-5 py-3 text-right text-body-changed font-semibold text-myApp-cream">Assignments</th>
							<th className="px-5 py-3 text-right text-body-changed font-semibold text-myApp-cream">Submitted%</th>
							<th className="px-5 py-3 text-right text-body-changed font-semibold text-myApp-cream">Confirmed%</th>
							<th className="px-5 py-3 text-right text-body-changed font-semibold text-myApp-cream">Pending Confirm</th>
							<th className="px-5 py-3 text-right text-body-changed font-semibold text-myApp-cream">Needs Re-Eval</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{data.cyclesTable.map((r: any) => (
						<tr key={r.cycleId} className="hover:bg-gray-50">
							<td className="px-5 py-2.5 text-sm font-medium text-myApp-blueDark">{r.cycleName}</td>
							<td className="px-5 py-2.5 text-sm text-myApp-blueDark">{r.status}</td>
							<td className="px-5 py-2.5 text-sm text-myApp-blueDark text-right">{r.assignmentsTotal}</td>
							<td className="px-5 py-2.5 text-sm text-myApp-blueDark text-right">{r.submittedPct}%</td>
							<td className="px-5 py-2.5 text-sm text-myApp-blueDark text-right">{r.confirmedPct}%</td>
							<td className="px-5 py-2.5 text-sm text-myApp-blueDark text-right">{r.pendingConfirm}</td>
							<td className="px-5 py-2.5 text-sm text-myApp-blueDark text-right">{r.needsReEval}</td>
						</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}