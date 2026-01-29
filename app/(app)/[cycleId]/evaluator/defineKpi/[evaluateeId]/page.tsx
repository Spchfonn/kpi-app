"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiLevelBox from '@/components/KpiLevelBox'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react'

type LoginUser = {
   userId: string;
   employeeId: string;
   cycle: { id: string; name: string }; 
   availableRoles: string[];
};

type KpiTypeChoices = "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";
type NodeType = "GROUP" | "ITEM";
type KpiType = { id: string; type: KpiTypeChoices; name: string; rubric: any };

type Node = {
   id?: string;
   nodeType: NodeType;
   title: string;
   description?: string | null;
   weightPercent: number;
   typeId?: string | null;
   unit?: string | null;
   startDate?: string | null;
   endDate?: string | null;
   children: Node[];
   displayNo?: string;
   type?: KpiType | null;
};

// --- Helper Functions ---
function getLoginUser(): LoginUser | null {
   try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw) as LoginUser;
   } catch { return null; }
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
   const { evaluateeId } = useParams<{ evaluateeId: string }>();
   
   const [evaluateeName, setEvaluateeName] = useState<string>("");
   const [employeeData, setEmployeeData] = useState<any>(null);

   const [mode, setMode] = useState<"view" | "edit">("view");
   const [showAllDetails, setShowAllDetails] = useState(false);
   const [loading, setLoading] = useState(true);
   const [saving, setSaving] = useState(false); 
   const [isGenerating, setIsGenerating] = useState(false); // เพิ่ม State แยกสำหรับการ Generate AI
   const [error, setError] = useState<string>("");

   const [planId, setPlanId] = useState<string | null>(null);
   const [types, setTypes] = useState<KpiType[]>([]);
   const [tree, setTree] = useState<Node[]>([]);
   const [draftTree, setDraftTree] = useState<Node[]>([]);
   const [confirmOpenDelete, setConfirmOpenDelete] = useState(false);

   // AI & Inform States
   const [aiTree, setAiTree] = useState<Node[]>([]);
   const [showAiModal, setShowAiModal] = useState(false);
   const [showInformModal, setShowInformModal] = useState(false);
   const [aiSelectedIds, setAiSelectedIds] = useState<Set<string>>(new Set());

   const [cycleStartIso, setCycleStartIso] = useState<string>("");
   const [cycleEndIso, setCycleEndIso] = useState<string>("");

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
            const cyclePublicId = u.cycle.id;
            const evaluatorId = u.employeeId;

            const resResolve = await fetch(
                `/api/evaluationAssignments/resolvePlan?cyclePublicId=${encodeURIComponent(cyclePublicId)}&evaluatorId=${encodeURIComponent(evaluatorId)}&evaluateeId=${encodeURIComponent(evaluateeId)}`,
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
            setDraftTree(loadedTree);
         } catch (e: any) {
            setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
         } finally {
            setLoading(false);
         }
      })();
   }, [evaluateeId, router]);

   const startEdit = () => { setDraftTree(tree); setMode("edit"); };
   const cancelEdit = () => { setDraftTree(tree); setMode("view"); };

   const saveEdit = async () => {
      if (!planId) return;
      setSaving(true); // ยังคงใช้ saving สำหรับปุ่มบันทึก
      setError("");
      try {
         const payload = { nodes: draftTree.map(stripForPut) };
         const res = await fetch(`/api/kpiPlans/${planId}/tree`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
         });
         const j = await res.json();
         if (!j.ok) throw new Error(j.message ?? "บันทึกไม่สำเร็จ");
         const nextTree: Node[] = (j.data.tree ?? []).map(normalizeNode);
         setTree(nextTree);
         setDraftTree(nextTree);
         setMode("view");
      } catch (e: any) {
         setError(e?.message ?? "บันทึกไม่สำเร็จ");
      } finally {
         setSaving(false);
      }
   };

   const generateKpiByAI = async () => {
      try {
         setIsGenerating(true); // เปลี่ยนมาใช้ isGenerating แทน saving
         setError("");
         setShowInformModal(true); 

         const res = await fetch("/api/generate-kpi", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ evaluateeId }),
         });

         const j = await res.json();
         if (!j.success) throw new Error(j.error ?? "AI generate failed");

         const typeMap = new Map(types.map((t) => [t.type.toLowerCase(), t.id]));
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
            children: group.level2_kpis.map((kpi: any) => ({
               nodeType: "ITEM",
               title: kpi.title,
               description: kpi.description,
               weightPercent: kpi.kpi_percent,
               typeId: typeMap.get(kpi.kpi_type.toLowerCase()) ?? null,
               unit: unitMap.get(kpi.kpi_code) || null,
               startDate: cycleStartIso,
               endDate: cycleEndIso,
               children: [],
            })),
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

   if (loading) return <div className="px-20 py-7.5">Loading...</div>;

   return (
   <>
      <div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
         <div className='flex items-center mb-2.5 gap-7'>
            <p className='text-title font-medium text-myApp-blueDark'>
               {`กำหนดตัวชี้วัด (${evaluateeName})`}
            </p>
            <div className='flex flex-1 gap-2'>
               <p className='text-button font-semibold text-myApp-blueDark'>สถานะการกำหนดตัวชี้วัด</p>
               <p className='text-button font-semibold text-myApp-red'>ยังไม่กำหนด</p>
            </div>
            <KpiLevelBox level={2} />
         </div>

         <div className='flex items-center mb-3 gap-2.5'>
            <Button 
               variant={showAllDetails ? "outline" : "primary"}
               primaryColor="blueDark"
               onClick={() => setShowAllDetails((prev) => !prev)}>
               {showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
            </Button>

            <Link href="/user/kpi/copyKpi">
               <Button variant="primary" primaryColor="yellow">คัดลอกตัวชี้วัด</Button>
            </Link>

            <Button
               variant="primary"
               primaryColor="pink"
               onClick={generateKpiByAI}
               disabled={saving}
            >
               {isGenerating ? "กำลังประมวลผล..." : "ให้ระบบช่วยแนะนำตัวชี้วัด"}
            </Button>

            <div className="flex ml-auto gap-2.5">
               {mode === "view" ? (
                  <>
                  <Button variant="primary" primaryColor="green">ขอให้รับรองตัวชี้วัด</Button>
                  <Button onClick={startEdit} variant="primary" primaryColor="orange">แก้ไข</Button>
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
            <div className="mb-3 p-3 rounded-xl border border-myApp-red bg-white text-myApp-red text-sm font-semibold">
               {error}
            </div>
         )}

         <div className='flex-1 overflow-y-auto'>
            <TwoLevelKpiTable
               mode={mode}
               showAllDetails={showAllDetails}
               selectable={false}
               tree={mode === "edit" ? draftTree : tree}
               onChangeTree={setDraftTree}
               kpiTypes={types}
               defaultStartDate={cycleStartIso}
               defaultEndDate={cycleEndIso}
            />
         </div>

         {/* --- 1. Inform Data Modal (ขณะรอ AI) --- */}
         {showInformModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
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
                      <TwoLevelKpiTable
                         mode="view"
                         showAllDetails={true}
                         selectable={true}
                         selectedIds={aiSelectedIds}
                         onSelectionChange={setAiSelectedIds}
                         tree={aiTree}
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
                         ยืนยัน ({aiSelectedIds.size})
                      </Button>
                   </div>
                </div>
             </div>
         )}

         <ConfirmBox
            open={confirmOpenDelete}
            message="ต้องการลบตัวชี้วัดแถวนี้ใช่หรือไม่?"
            onCancel={() => setConfirmOpenDelete(false)}
            onConfirm={() => setConfirmOpenDelete(false)}
         />
      </div>
   </>
   )
}

export default page