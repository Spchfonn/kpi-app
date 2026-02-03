"use client";
import DefinedStatus from '@/components/DefinedStatus';
import EvaluatorCardForDefineKpi from '@/components/EvaluatorCardForDefineKpi'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

// ... (Types และ getLoginUser code เหมือนเดิม) ...
type LoginUser = {
    employeeId: string;
    cycle: { id: string; name: string };
 };

type KpiDefineMode = "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS" | "EVALUATEE_DEFINES_EVALUATOR_APPROVES";
type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";

 function getLoginUser(): LoginUser | null {
    try {
       const raw = localStorage.getItem("user");
       if (!raw) return null;
       return JSON.parse(raw);
    } catch {
       return null;
    }
 }

 type Item = {
    assignmentId: string;
    currentPlanId: string | null;
    weightPercent: string;
    confirmStatus?: PlanConfirmStatus;
    evaluator: {
       id: string;
       fullName: string;
       title: string;
       organization: string;
    };
 };

export default function Page({ params }: { params: { id: string } }) {
   const router = useRouter();
   const [items, setItems] = useState<Item[]>([]);
   const [loading, setLoading] = useState(true);
   const [kpiDefineMode, setKpiDefineMode] = useState<KpiDefineMode>("EVALUATOR_DEFINES_EVALUATEE_CONFIRMS");
  // เพิ่ม State เก็บข้อมูล User ที่จำเป็นสำหรับ Link
     const [currentUserInfo, setCurrentUserInfo] = useState<{ cycleId: string, employeeId: string } | null>(null);

   useEffect(() => {
      (async () => {
         const u = getLoginUser();
      
         if (!u?.employeeId || !u?.cycle?.id) {
            router.push("/sign-in");
            return;
         }

      // 1. เก็บค่า cycleId และ employeeId ไว้ส่งให้ Card
      setCurrentUserInfo({
        cycleId: u.cycle.id,
        employeeId: u.employeeId
      });

      setLoading(true);
      const res = await fetch(
        `/api/evaluationAssignments/evaluators?cyclePublicId=${encodeURIComponent(u.cycle.id)}&evaluateeId=${encodeURIComponent(u.employeeId)}`,
        { cache: "no-store" }
      );
      const j = await res.json();
      if (j.ok){
         console.log("API Result Items:", j.data.items);
         setItems(j.data.items);
         if (j.data.kpiDefineMode) {
             setKpiDefineMode(j.data.kpiDefineMode);
         }
      }
      setLoading(false);
      })();
   }, [router]);

   return (
      <>
      <div className='px-20 py-7.5'>
         <div className='flex items-center mb-3'>
            <p className='text-title font-medium text-myApp-blueDark'>ผู้ประเมิน ({loading ? "-" : items.length})</p>
            <div className='ml-auto flex'>
               <DefinedStatus/>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((x) => (
               <EvaluatorCardForDefineKpi
                  key={x.evaluator.id}
                  id={x.evaluator.id}
                  name={x.evaluator.fullName}
                  title={x.evaluator.title}
                  kpiDefineMode={kpiDefineMode}
                  assignmentId={x.assignmentId}
                  cycleId={currentUserInfo?.cycleId || ""}
                  evaluateeId={currentUserInfo?.employeeId || ""}
                  status={x.confirmStatus}
                  organization={x.evaluator.organization}
               />
            ))}
         </div>
      </div>
    </>
  );
}