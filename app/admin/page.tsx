"use client";
import { useEffect, useState } from "react";
import AdminMenuBar, { type AdminTabKey } from "@/components/admin/AdminMenuBar";
import EvaluationCycleTableClient from "./evaluationCycle/EvaluationCycleTableClient";

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

  const loadCycles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluationCycles", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      setCycles(json.data ?? []);
    } catch (e: any) {
      setError(e.message ?? "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "evaluationCycles") loadCycles();
  }, [tab]);

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
      return <div className="mt-4">Dashboard (TODO)</div>;
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