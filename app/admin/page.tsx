"use client";
import { useEffect, useState } from "react";
import AdminMenuBar, { type AdminTabKey } from "@/components/admin/AdminMenuBar";
import EvaluationCycleTableClient, { Cycle } from "./evaluationCycle/EvaluationCycleTableClient";

// Import components
import DashboardTab from "./evaluationCycle/[id]/_tabs/DashboardTab"; // ตัวดูรายรอบ
import AllCyclesDashboard from "@/components/admin/dashboard/AllCyclesDashboard"; // ตัวดู Trend (ใหม่)
import AdminOverviewDashboard from "@/components/admin/dashboard/AdminOverviewDashboard";

export default function AdminHomePage() {
  const [tab, setTab] = useState<AdminTabKey>("evaluationCycles");
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับเก็บ ID ของรอบที่เลือก 
  const [selectedDashboardView, setSelectedDashboardView] = useState<string>("OVERVIEW");

  const loadCycles = async () => {
	setLoading(true);
	setError(null);
	try {
	  const res = await fetch("/api/evaluationCycles", { cache: "no-store" });
	  const json = await res.json();
	  if (!res.ok) throw new Error(json?.message ?? "โหลดข้อมูลไม่สำเร็จ");

	  const rows = (json.data ?? []).map((c: any) => ({
		publicId: c.publicId,
		id: c.id, // optional
		name: c.name,
		startDate: c.startDateYmd ?? c.startDate,
		endDate: c.endDateYmd ?? c.endDate,
		status: c.status,
		activities: c.activities,
	  }));

	  setCycles(rows);
	} catch (e: any) {
	  setError(e.message ?? "โหลดข้อมูลไม่สำเร็จ");
	} finally {
	  setLoading(false);
	}
  };

  useEffect(() => {
	loadCycles();
  }, []);

  const renderTab = () => {
	if (tab === "evaluationCycles") {
	  if (loading) return <div className="mt-4">Loading...</div>;
	  if (error) return <div className="mt-4 text-myApp-red">{error}</div>;
	  return <EvaluationCycleTableClient cycles={cycles} />;
	}

	// if (tab === "orgStructure") {
	//   return <div className="mt-4">โครงสร้างองค์กร (TODO)</div>;
	// }

	if (tab === "dashboard") {
	   // Filter เอาเฉพาะรอบที่มีการประเมินแล้ว
	   const eligibleCycles = cycles.filter(c => c.status === "EVALUATE" || c.status === "SUMMARY");

	  return (
		<div className="mt-4 space-y-6">
			{/* Header + Selector */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-myApp-blueDark px-4 py-3 rounded-2xl">
				<div>
					<h2 className="text-title font-semibold text-myApp-cream">
						{selectedDashboardView === "TREND" ? "ภาพรวมแนวโน้มองค์กร" : "สรุปผลการประเมินรายรอบ"}
					</h2>
					<p className="mt-1 text-body text-myApp-cream">
						{selectedDashboardView === "TREND" 
							? "เปรียบเทียบคะแนนเฉลี่ยของแต่ละแผนกในทุกรอบการประเมิน" 
							: "ดูรายละเอียดคะแนนและการกระจายตัวของรอบที่เลือก"}
					</p>
				</div>
				
				<div className="flex items-center gap-2">
					<label className="text-body-changed font-medium text-myApp-cream whitespace-nowrap">มุมมองข้อมูล :</label>
					<select 
						className="px-3 py-2 border border-myApp-grey rounded-2xl text-body font-medium text-myApp-blueDark min-w-55 focus:outline-none focus:ring-2 focus:ring-myApp-blue bg-white"
						value={selectedDashboardView}
						onChange={(e) => setSelectedDashboardView(e.target.value)}
					>
						<option value="OVERVIEW">ภาพรวมระบบ</option>
						<option value="TREND">ดูแนวโน้มทุกรอบ</option>
						
						<optgroup label="เลือกดูรายรอบ">
							{eligibleCycles.map((c) => (
								<option key={c.id} value={c.id}>
									{c.name} ({c.status})
								</option>
							))}
						</optgroup>
					</select>
				</div>
			</div>

			{/* Conditional Rendering: เลือกแสดง Component ตามค่าใน Dropdown */}
			{selectedDashboardView === "OVERVIEW" ? (
				<AdminOverviewDashboard />
			) : selectedDashboardView === "TREND" ? (
				<AllCyclesDashboard />
			) : (
				<DashboardTab cycleId={selectedDashboardView} />
			)}

		</div>
	  );
	}

	return null;
  };

  return (
	<div className="px-20 py-7.5">
	  <AdminMenuBar activeTab={tab} onChange={setTab} />
	  {renderTab()}
	</div>
  );
}