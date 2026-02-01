"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiLevelBox from '@/components/KpiLevelBox'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import TwoLevelKpiTableForGenerateKpi from '@/components/TwoLevelKpiTableForGenerateKpi';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react'

type LoginUser = {
   userId: string;
   employeeId: string;
   cycle: { id: string; name: string }; // id = cyclePublicId
   availableRoles: string[];
};

type KpiTypeChoices = "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";
type NodeType = "GROUP" | "ITEM";

type KpiType = { id: string; type: KpiTypeChoices; name: string; rubric: any };

type Node = {
   id?: string;
   nodeType: NodeType;
   title: string;
   description?: string | null
   weightPercent: number;
   typeId?: string | null;
   unit?: string | null;
   startDate?: string | null;
   endDate?: string | null;
   children: Node[];
   displayNo?: string;
   type?: KpiType | null;
};

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type PlanConfirmTarget = "EVALUATOR" | "EVALUATEE" | null;

const PLAN_CONFIRM_UI: Record<PlanConfirmStatus, { label: string; className: string }> = {
   DRAFT: { label: "ยังไม่กำหนดตัวชี้วัด", className: "text-myApp-red" },
   REQUESTED: { label: "รอการอนุมัติ/รับรอง", className: "text-myApp-orange" },
   CONFIRMED: { label: "กำหนดตัวชี้วัดสมบูรณ์", className: "text-myApp-green" },
   REJECTED: { label: "ตัวชี้วัดถูกปฏิเสธ", className: "text-myApp-red" },
   CANCELLED: { label: "ยกเลิกคำขอ", className: "text-myApp-blueDark" },
};

function getLoginUser(): LoginUser | null {
   try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw) as LoginUser;
   } catch {
      return null;
   }
}

function toNum(v: any) {
   const n = typeof v === "string" ? Number(v) : v;
   return Number.isFinite(n) ? n : 0;
}
 
function normalizeNode(n: any): Node {
   return {
      id: n.id,
      nodeType: n.nodeType,
      title: n.title,
      description: n.description ?? null,
      weightPercent: toNum(n.weightPercent),
      typeId: n.typeId ?? null,
      unit: n.unit ?? null,
      startDate: n.startDate ?? null,
      endDate: n.endDate ?? null,
      displayNo: n.displayNo,
      type: n.type ?? null,
      children: Array.isArray(n.children) ? n.children.map(normalizeNode) : [],
   };
}

function stripForPut(n: Node): any {
   return {
      id: n.id,
      nodeType: n.nodeType,
      title: n.title,
      description: n.description ?? null,
      weightPercent: n.weightPercent,
      typeId: n.nodeType === "ITEM" ? (n.typeId ?? null) : null,
      unit: n.nodeType === "ITEM" ? (n.unit ?? null) : null,
      startDate: n.nodeType === "ITEM" ? (n.startDate ?? null) : null,
      endDate: n.nodeType === "ITEM" ? (n.endDate ?? null) : null,
      children: n.nodeType === "GROUP" ? (n.children ?? []).map(stripForPut) : [],
   };
}

function assignDisplayNo(tree: Node[]): Node[] {
  return tree.map((group, gi) => {
   const groupNo = `${gi + 1}`;
   return {
     ...group,
     displayNo: groupNo,
     children: group.children.map((item, ii) => ({
      ...item,
      displayNo: `${groupNo}.${ii + 1}`,
     })),
   };
  });
}

const getNodeKey = (n: Node) => n.id || n.displayNo || "";

const page = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const { cycleId, evaluateeId } = useParams<{
      cycleId: string;
      evaluateeId: string;
   }>();
   const [evaluateeName, setEvaluateeName] = useState<string>("");
   const [employeeData, setEmployeeData] = useState<any>(null);

   const [mode, setMode] = useState<"view" | "edit">("view");
   const [showAllDetails, setShowAllDetails] = useState(false);

   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false); 
   const [isGenerating, setIsGenerating] = useState(false);
   const [error, setError] = useState<string>("");

   const [confirmStatus, setConfirmStatus] = useState<PlanConfirmStatus>("DRAFT");
   const [confirmTarget, setConfirmTarget] = useState<PlanConfirmTarget>(null);

   const isRequested = confirmStatus === "REQUESTED";
   const lockEdit = confirmStatus === "REQUESTED" || confirmStatus === "CONFIRMED";

   const [planId, setPlanId] = useState<string | null>(null);
   const [types, setTypes] = useState<KpiType[]>([]);
   const [tree, setTree] = useState<Node[]>([]);

   const [draftTree, setDraftTree] = useState<Node[]>([]);
   const [confirmOpenDelete, setConfirmOpenDelete] = useState(false);

   // for confirm send noti
   const [confirmOpenConfirm, setConfirmOpenConfirm] = useState(false);
   const [confirmOpenCancel, setConfirmOpenCancel] = useState(false);

   const [cycleStartIso, setCycleStartIso] = useState<string>("");
   const [cycleEndIso, setCycleEndIso] = useState<string>("");

   // AI & Inform States
   const [aiTree, setAiTree] = useState<Node[]>([]);
   const [showAiModal, setShowAiModal] = useState(false);
   const [showInformModal, setShowInformModal] = useState(false);
   const [aiSelectedIds, setAiSelectedIds] = useState<Set<string>>(new Set());

   useEffect(() => {
      (async () => {
         setLoading(true);
         setError("");
      
         try {
            const u = getLoginUser();
            if (!u?.employeeId || !u?.cycle?.id) {
               router.push("/sign-in");
               return;
            }
      
            // (optional) check role
            // const role = localStorage.getItem("activeRole");
            // if (role !== "EVALUATOR") router.push("/sign-in/selectRole");

      
            const cyclePublicId = cycleId;
            const paramEvaluatorId = searchParams.get('evaluatorId');
            const evaluatorId = paramEvaluatorId || u.employeeId;
      
            console.log("--------------- DEBUG KPI PAGE ---------------");
            console.log("URL paramEvaluatorId:", paramEvaluatorId);
            console.log("User Logged In (u.employeeId):", u.employeeId);
            console.log("FINAL evaluatorId sent to API:", evaluatorId);
            console.log("FINAL evaluateeId sent to API:", evaluateeId);
            console.log("----------------------------------------------");

            // 1) resolvePlan -> get planId
            const resResolve = await fetch(
               `/api/evaluationAssignments/resolvePlan?cyclePublicId=${encodeURIComponent(
                  cyclePublicId
               )}&evaluatorId=${encodeURIComponent(evaluatorId)}&evaluateeId=${encodeURIComponent(
                  evaluateeId
               )}`,
               { cache: "no-store" }
            );

            const jResolve = await resResolve.json();
            if (!jResolve.ok) throw new Error(jResolve.message ?? "resolvePlan failed");

            const c = jResolve.data.cycle;
            setCycleStartIso(c.startDate);
            setCycleEndIso(c.endDate);

            setEvaluateeName(jResolve.data.evaluatee?.fullNameTh ?? "");   
            setEmployeeData(jResolve.data.evaluatee);
            
            const pid = jResolve.data.planId as string;
            setPlanId(pid);
      
            // 2) get kpiTypes + plan tree (parallel)
            const [resTypes, resPlan] = await Promise.all([
               fetch("/api/kpiTypes", { cache: "no-store" }),
               fetch(`/api/kpiPlans/${pid}`, { cache: "no-store" }),
            ]);
      
            const jTypes = await resTypes.json();
            const jPlan = await resPlan.json();
      
            if (jTypes.ok) setTypes(jTypes.data as KpiType[]);
            if (!jPlan.ok) throw new Error(jPlan.message ?? "get plan failed");
      
            const loadedTree: Node[] = (jPlan.data.tree ?? []).map(normalizeNode);
      
            setTree(loadedTree);
            setDraftTree(loadedTree); // initial draft
            setConfirmStatus((jPlan.data.confirmStatus ?? "DRAFT") as PlanConfirmStatus);
            setConfirmTarget((jPlan.data.confirmTarget ?? null) as PlanConfirmTarget);
         } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
         } finally {
            setLoading(false);
         }
      })();
   }, [evaluateeId, router]);

   // edit controls
   const startEdit = () => {
      setDraftTree(tree);
      setMode("edit");
      setShowAllDetails(true);
   };

   const cancelEdit = () => {
      setDraftTree(tree);
      setMode("view");
   };

   const saveEdit = async () => {
      if (!planId) return;
   
      setSaving(true);
      setError("");
   
      try {
         const payload = { nodes: draftTree.map(stripForPut) };
      
         const res = await fetch(`/api/kpiPlans/${planId}/tree`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         });
         const j = await res.json();
         if (!j.ok) {
            const msg = j.message ?? (j.errors ? JSON.stringify(j.errors) : "บันทึกไม่สำเร็จ");
            throw new Error(msg);
         }
      
         // server send tree + displayNo back
         const nextTree: Node[] = (j.data.tree ?? []).map(normalizeNode);
         setTree(nextTree);
         setDraftTree(nextTree);
         setMode("view");
      } catch (e: any) {
         console.error(e);
         setError(e?.message ?? "บันทึกไม่สำเร็จ");
      } finally {
         setSaving(false);
      }
   };

   const goCopyKpi = () => {
      const currentEvaluatorId = searchParams.get("evaluatorId") || "";
      router.push(
        `/${encodeURIComponent(cycleId)}/evaluatee/defineKpi/${encodeURIComponent(evaluateeId)}/copyKpi?targetPlanId=${encodeURIComponent(planId ?? "")}&evaluatorId=${encodeURIComponent(currentEvaluatorId)}`
      );
   };

   const requestConfirm = async () => {
      if (!planId) return;
     
      setSaving(true);
      setError("");
     
      try {
         const endpoint = isRequested
            ? `/api/kpiPlans/${planId}/cancelRequestConfirm`
            : `/api/kpiPlans/${planId}/requestConfirm`;
      
         const res = await fetch(endpoint, { method: "POST" });
         const j = await res.json();
         if (!j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
      
         const reloadPlanStatus = async () => {
            const r = await fetch(`/api/kpiPlans/${planId}`, { cache: "no-store" });
            const j = await r.json();
            if (r.ok && j.ok) {
               setConfirmStatus(j.data.confirmStatus);
               setConfirmTarget(j.data.confirmTarget ?? null);
            }
         };
           
         await reloadPlanStatus();
      } catch (e: any) {
         setError(e?.message ?? "ทำรายการไม่สำเร็จ");
      } finally {
         setSaving(false);
      }
   };

   const generateKpiByAI = async () => {
      try {
         setIsGenerating(true);
         setError("");
         setShowInformModal(true); 
   
         const res = await fetch("/api/generate-kpi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evaluateeId }),
         });
   
         const j = await res.json();
         if (!j.success) throw new Error(j.error ?? "AI generate failed");
   
         // สร้าง Map สำหรับค้นหา Type Object เต็มรูปแบบตาม ID
         const typeFullMap = new Map(types.map((t) => [t.type.toLowerCase(), t]));
         
         const unitMap = new Map<string, string>();
         if (j.measurements?.kpi_measurements) {
            j.measurements.kpi_measurements.forEach((m: any) => {
               const u = m.measurement?.unit || m.measurement?.metric_name; 
               if (m.kpi_code && u) unitMap.set(m.kpi_code, u);
            });
         }
   
         const aiNodes: Node[] = j.round1_raw.level1_groups.map((group: any) => ({
            nodeType: "GROUP",
            title: group.group_title,
            description: group.group_goal,
            weightPercent: group.group_percent,
            children: group.level2_kpis.map((kpi: any) => {
               const typeObj = typeFullMap.get(kpi.kpi_type.toLowerCase()); // ดึง Object Type ทั้งหมดมา
               return {
                  nodeType: "ITEM",
                  title: kpi.title,
                  description: kpi.description,
                  weightPercent: kpi.kpi_percent,
                  typeId: typeObj?.id ?? null, // เก็บ ID ไว้
                  type: typeObj ?? null,       // ใส่ Object Type (ที่มี rubric) เข้าไปด้วย
                  unit: unitMap.get(kpi.kpi_code) || null,
                  startDate: cycleStartIso,
                  endDate: cycleEndIso,
                  children: [],
               };
            }),
         }));
   
         const withDisplayNo = assignDisplayNo(aiNodes);
         setAiTree(withDisplayNo);
         
         const allIds = new Set<string>();
         withDisplayNo.forEach(p => {
               allIds.add(getNodeKey(p));
               p.children.forEach(c => allIds.add(getNodeKey(c)));
         });
         setAiSelectedIds(allIds);
   
         setShowInformModal(false); 
         setShowAiModal(true); 
   
      } catch (e: any) {
         console.error(e);
         setShowInformModal(false);
         setError(e.message ?? "ไม่สามารถสร้าง KPI จาก AI ได้");
      } finally {
         setIsGenerating(false); // ปิด isGenerating
      }
   };
   
   const handleConfirmAiSelection = () => {
      const selectedFromAi = aiTree.reduce<Node[]>((acc, group) => {
         const groupKey = getNodeKey(group);
         const selectedChildren = group.children.filter(child => aiSelectedIds.has(getNodeKey(child)));
         if (aiSelectedIds.has(groupKey) || selectedChildren.length > 0) {
            acc.push({ ...group, children: selectedChildren });
         }
         return acc;
      }, []);
   
      if (selectedFromAi.length === 0) return;
   
      const currentTree = mode === "edit" ? draftTree : tree;
      const mergedTree = [...currentTree, ...selectedFromAi];
      const finalTree = assignDisplayNo(mergedTree);
   
      setDraftTree(finalTree);
      setMode("edit");
      setShowAiModal(false);
      setAiTree([]);
   };

   if (loading) {
      return <div className="px-20 py-7.5">Loading...</div>;
   }

   return (
   <>
      <div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
         <div className='flex items-center mb-2.5 gap-7'>
            <p className='text-title font-medium text-myApp-blueDark'>
               {`กำหนดตัวชี้วัด (${evaluateeName})`}
            </p>
            <div className='flex flex-1 gap-2'>
               <p className='text-button font-semibold text-myApp-blueDark'>สถานะการกำหนดตัวชี้วัด</p>
               <p className={`text-button font-semibold ${PLAN_CONFIRM_UI[confirmStatus].className}`}>
                  {PLAN_CONFIRM_UI[confirmStatus].label}
               </p>
            </div>
            <p className="text-center text-body font-medium text-myApp-blueDark">
               รูปแบบการกำหนดตัวชี้วัด : 2 ระดับ
            </p>
         </div>

         {/* menu tab */}
         <div className='flex items-center mb-3 gap-2.5'>
            {mode === "view" && (
               <Button 
               variant={showAllDetails ? "outline" : "primary"}
               primaryColor="blueDark"
               onClick={() => setShowAllDetails((prev) => !prev)}
               >
                  {showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
               </Button>
            )}
            

            <Button
               variant="primary"
               primaryColor="yellow"
               onClick={goCopyKpi}>
               คัดลอกตัวชี้วัด
            </Button>

            <Button
               variant="primary"
               primaryColor="pink"
               onClick={generateKpiByAI}
            >
               ให้ระบบช่วยแนะนำตัวชี้วัด
            </Button>

            <div className="flex ml-auto gap-2.5">
               {/* if in 'view' mode, show edit button
               if in 'edit' mode, show save and cancel button */}
               {mode === "view" ? (
                  <>
                  <Button 
                     variant={isRequested ? "outline" : "primary"}
                     primaryColor="green"
                     onClick={() => {
                        if (saving) return;
                        if (isRequested) setConfirmOpenCancel(true);
                        else setConfirmOpenConfirm(true);
                     }}
                     disabled={saving}
                  >
                     {isRequested ? "ยกเลิกการขอให้รับรองตัวชี้วัด" : "ขอให้รับรองตัวชี้วัด"}
                  </Button>
                  <Button onClick={startEdit} variant="primary" primaryColor="orange" disabled={lockEdit}>แก้ไข</Button>
                  </>
               ) : (
                  <>
                  <Button onClick={cancelEdit} primaryColor="red">ยกเลิก</Button>
                  <Button onClick={saveEdit} variant="primary">บันทึก</Button>
                  </>
               )}
            </div>
         </div>

         {error && (
            <div className="mb-3 p-3 rounded-xl border border-myApp-red bg-white text-myApp-red text-sm">
               {error}
            </div>
         )}

         <div className='flex-1 overflow-y-auto'>
            <TwoLevelKpiTable
               mode={mode}
               showAllDetails={showAllDetails}
               selectable={false}
               tree={mode === "edit" ? draftTree : tree}
               kpiTypes={types}
               onChangeTree={setDraftTree}
               defaultStartDate={cycleStartIso}
               defaultEndDate={cycleEndIso}
            />
         </div>

         {/* --- 1. Inform Data Modal (ขณะรอ AI) --- */}
         {showInformModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95">
                  <div className="mb-6 flex justify-center">
                     <div className="w-16 h-16 border-4 border-t-pink-500 border-gray-100 rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-xl font-bold text-myApp-blueDark mb-2">กำลังเตรียมข้อมูลแนะนำ</h3>
                  <p className="text-sm text-gray-500 mb-6">ระบบกำลังวิเคราะห์ข้อมูลพนักงานเพื่อออกแบบตัวชี้วัด</p>
                  
                  <div className="text-left bg-gray-50 p-5 rounded-xl space-y-3 border border-gray-100">
                     <div className="flex justify-between border-b pb-2">
                        <span className="text-xs text-gray-400 font-medium">ชื่อพนักงาน</span>
                        <span className="text-sm text-gray-700 font-semibold">{evaluateeName}</span>
                     </div>
                     <div className="flex justify-between border-b pb-2">
                        <span className="text-xs text-gray-400 font-medium">ตำแหน่ง</span>
                        <span className="text-sm text-gray-700 font-semibold">
                           {employeeData?.position?.name || "-"}
                        </span>
                     </div>
                     <div className="flex justify-between border-b pb-2">
                        <span className="text-xs text-gray-400 font-medium">ระดับ</span>
                        <span className="text-sm text-gray-700 font-semibold">
                           {employeeData?.level?.name || "-"}
                        </span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs text-gray-400 font-medium">แผนก</span>
                        <span className="text-sm text-gray-700 font-semibold">
                           {employeeData?.organization?.name || "-"}
                        </span>
                     </div>
                  </div>
                  <p className="mt-6 text-xs text-gray-400 animate-pulse italic">
                     * ขั้นตอนนี้อาจใช้เวลาประมาณ 30-40 วินาที...
                  </p>
               </div>
            </div>
         )}

         {/* --- 2. AI Selection Modal --- */}
         {showAiModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-10">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

               <div className="px-6 py-3 flex justify-between items-center bg-gray-50">
                  <div>
                     <h3 className="text-l font-bold text-myApp-blueDark">ระบบแนะนำตัวชี้วัด</h3>
                     <p className="text-sm text-gray-500">เลือกตัวชี้วัดที่ต้องการใช้</p>
                  </div>
                  <button 
                     onClick={() => setShowAiModal(false)}
                     className="text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-200"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-4 bg-gray-100/50">
                  <TwoLevelKpiTableForGenerateKpi
                     mode="view"
                     showAllDetails={true} // ตัวนี้จะเป็นตัวสั่งให้กางเกณฑ์คะแนนออก
                     selectable={true}
                     selectedIds={aiSelectedIds}
                     onSelectionChange={setAiSelectedIds}
                     tree={aiTree} // ข้อมูลในนี้ต้องมี property 'type' ที่มี 'rubric' อยู่ข้างใน
                     onChangeTree={setAiTree}
                     kpiTypes={types}
                     defaultStartDate={cycleStartIso}
                     defaultEndDate={cycleEndIso}
                  />
               </div>

               <div className="px-6 py-2 bg-white flex justify-end gap-3 items-center">
                  <div className="mr-auto text-sm text-gray-500">
                     เลือกเพิ่มเติม <span className="font-semibold text-myApp-blueDark">{aiSelectedIds.size}</span> รายการ
                  </div>
                  
                  <Button 
                     variant="primary" 
                     primaryColor="red"
                     onClick={() => setShowAiModal(false)}
                  >
                     ยกเลิก
                  </Button>
                  
                  <Button
                     variant="primary"
                     primaryColor="green"
                     onClick={handleConfirmAiSelection}
                     disabled={aiSelectedIds.size === 0}
                  >
                     ยืนยัน
                  </Button>
               </div>
               </div>
            </div>
         )}

         <ConfirmBox
            open={confirmOpenDelete}
            message="ต้องการลบตัวชี้วัดแถวนี้ใช่หรือไม่?"
            cancelText="ยกเลิก"
            confirmText="ตกลง"
            onCancel={() => setConfirmOpenDelete(false)}
            onConfirm={() => setConfirmOpenDelete(false)}
         />

         {/* confirm for send confirm kpi noti */}
         <ConfirmBox
            open={confirmOpenConfirm}
            message={`ต้องการขอให้ ${evaluateeName} รับรองตัวชี้วัดใช่หรือไม่?`}
            cancelText="ยกเลิก"
            confirmText="ตกลง"
            onCancel={() => setConfirmOpenConfirm(false)}
            onConfirm={async () => {
               setConfirmOpenConfirm(false);
               await requestConfirm();
            }}
         />

         {/* confirm for send cancel confirm kpi noti */}
         <ConfirmBox
            open={confirmOpenCancel}
            message={`ต้องการยกเลิกการขอให้ ${evaluateeName} รับรองตัวชี้วัดใช่หรือไม่?`}
            cancelText="ยกเลิก"
            confirmText="ตกลง"
            onCancel={() => setConfirmOpenCancel(false)}
            onConfirm={async () => {
               setConfirmOpenCancel(false);
               await requestConfirm();
            }}
         />
      </div>
   </>
  )
}

export default page
