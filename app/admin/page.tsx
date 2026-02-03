"use client";
import { useEffect, useState } from "react";
import AdminMenuBar, { type AdminTabKey } from "@/components/admin/AdminMenuBar";
import EvaluationCycleTableClient from "./evaluationCycle/EvaluationCycleTableClient";

// Import components
import DashboardTab from "./evaluationCycle/[id]/_tabs/DashboardTab"; // ตัวดูรายรอบ
import AllCyclesDashboard from "@/components/admin/dashboard/AllCyclesDashboard"; // ตัวดู Trend (ใหม่)

type Cycle = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: "DEFINE" | "EVALUATE" | "SUMMARY";
};

export default function AdminHomePage() {
  const [tab, setTab] = useState<AdminTabKey>("evaluationCycles");
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State สำหรับเก็บ ID ของรอบที่เลือก 
  // ค่าเป็น "TREND" = ดูภาพรวม, ค่าเป็น ID (string) = ดูรอบนั้นๆ
  const [selectedDashboardView, setSelectedDashboardView] = useState<string>("TREND");

  const loadCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluationCycles", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      
      const loadedCycles = json.data ?? [];
      setCycles(loadedCycles);

      // (Optional) ถ้าอยากให้ Default เป็นรอบล่าสุดแทน Trend ให้แก้ตรงนี้
      // if (loadedCycles.length > 0) setSelectedDashboardView(String(loadedCycles[0].id));

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
      if (error) return <div className="mt-4 text-red-600">{error}</div>;
      return <EvaluationCycleTableClient cycles={cycles} />;
    }

    if (tab === "orgStructure") {
      return <div className="mt-4">โครงสร้างองค์กร (TODO)</div>;
    }

    if (tab === "dashboard") {
       // Filter เอาเฉพาะรอบที่มีการประเมินแล้ว
       const eligibleCycles = cycles.filter(c => c.status === "EVALUATE" || c.status === "SUMMARY");

      return (
        <div className="mt-4 space-y-6">
            {/* Header + Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">
                        {selectedDashboardView === "TREND" ? "ภาพรวมแนวโน้มองค์กร" : "สรุปผลการประเมินรายรอบ"}
                    </h2>
                    <p className="text-sm text-gray-500">
                        {selectedDashboardView === "TREND" 
                            ? "เปรียบเทียบคะแนนเฉลี่ยของแต่ละแผนกในทุกรอบการประเมิน" 
                            : "ดูรายละเอียดคะแนนและการกระจายตัวของรอบที่เลือก"}
                    </p>
                </div>
                
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">มุมมองข้อมูล:</label>
                    <select 
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-[220px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={selectedDashboardView}
                        onChange={(e) => setSelectedDashboardView(e.target.value)}
                    >
                        {/* Option พิเศษสำหรับดู Trend */}
                        <option value="TREND">📊 ดูแนวโน้มทุกรอบ (Overall Trend)</option>
                        
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
            {selectedDashboardView === "TREND" ? (
                // 1. แสดง Dashboard รวม (Graph เส้น)
                <AllCyclesDashboard />
            ) : (
                // 2. แสดง Dashboard รายรอบ (Graph แท่ง)
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