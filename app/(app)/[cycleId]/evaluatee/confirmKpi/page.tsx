"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/Button";
import EvaluatorCardForConfirmKpi from "@/components/EvaluatorCardForConfirmKpi";

type LoginUser = {
  employeeId: string;
  cycle: { id: string; name: string };
};

function getLoginUser(): LoginUser | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";

type Item = {
  assignmentId: string;
  confirmStatus?: PlanConfirmStatus;
  evaluator: { id: string; fullName: string; title: string; organization: string };
};

export default function Page() {
  const router = useRouter();
  const { cycleId } = useParams<{ cycleId: string }>();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState("");

  const u = getLoginUser();

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");

      const u = getLoginUser();
      if (!u?.employeeId || !u?.cycle?.id) {
        router.push("/sign-in");
        return;
      }

      try {
        const res = await fetch(
          `/api/evaluationAssignments/evaluators?cyclePublicId=${encodeURIComponent(u.cycle.id)}&evaluateeId=${encodeURIComponent(u.employeeId)}`,
          { cache: "no-store" }
        );
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j.message ?? "load failed");

        // เอาเฉพาะที่ต้องรับรอง (REQUESTED)
        const requested = (j.data.items ?? []).filter((x: any) => x.confirmStatus === "REQUESTED");
        setItems(requested);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <div className="px-20 py-7.5">
      <div className="flex items-center mb-3">
        <p className="text-title font-medium text-myApp-blueDark">
          รายการรอรับรอง ({loading ? "-" : items.length})
        </p>
        <div className="ml-auto">
          <Button
            variant="primary"
            primaryColor="blueDark"
            onClick={() => router.push(`/${encodeURIComponent(cycleId)}/evaluatee`)}
          >
            กลับ
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded-xl border border-myApp-red bg-white text-myApp-red text-sm">
          {error}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="mt-3 rounded-xl border p-4 text-sm text-myApp-blue">
          ยังไม่มีตัวชี้วัดที่ถูกส่งมาให้รับรองในตอนนี้
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((x) => (
          <div
            key={x.assignmentId}
            className="cursor-pointer"
            onClick={() => {
              router.push(`/${encodeURIComponent(cycleId)}/evaluatee/confirmKpi/${encodeURIComponent(x.assignmentId)}`);
            }}
          >
            <EvaluatorCardForConfirmKpi
                assignmentId={x.assignmentId}
                name={x.evaluator.fullName}
                title={x.evaluator.title}
                cycleId={u?.cycle?.id ?? cycleId} 
                status={x.confirmStatus}
                organization={x.evaluator.organization}
            />
          </div>
        ))}
      </div>
    </div>
  );
}