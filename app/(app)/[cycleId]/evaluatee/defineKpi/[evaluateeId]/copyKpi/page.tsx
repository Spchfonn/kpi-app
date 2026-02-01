"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import SelectCycleDropDown from '@/components/SelectCycleDropDown';
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable'
import SelectOwnerKpiModal from '@/components/user/SelectOwnerKpiModal';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react'

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

type OwnerScope = "EVALUATEE_SELF" | "SAME_LINE_HIGHER" | "OTHER_EVALUATEES";

type OwnerOption = {
   employeeId: string;
   employeeNo: string;
   fullNameTh: string;
   position: string;
   level: string;
   organization?: string;
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

async function fetchJson(url: string, init?: RequestInit) {
   const res = await fetch(url, init);
   const text = await res.text();
  
   // debug ชัด ๆ
   console.log("[fetch]", res.status, url);
   console.log("[head]", text.slice(0, 120));
  
   // ถ้าเป็น HTML จะเห็น <!DOCTYPE หรือ <html
   if (text.trim().startsWith("<")) {
     throw new Error(`Non-JSON response (${res.status}) from ${url}`);
   }
  
   return JSON.parse(text);
}

export default function Page() {

   const router = useRouter();
   const searchParams = useSearchParams();
   const { cycleId, evaluateeId } = useParams<{ cycleId: string; evaluateeId: string }>();
   const [evaluateeName, setEvaluateeName] = useState<string>("");

   // context target plan
   const [cyclePublicId, setCyclePublicId] = useState<string>("");
   const [evaluatorId, setEvaluatorId] = useState<string>("");
   const [targetPlanId, setTargetPlanId] = useState<string | null>(null);

   // ui state
   const [loading, setLoading] = useState(true);
   const [loadingOwners, setLoadingOwners] = useState(false);
   const [loadingTree, setLoadingTree] = useState(false);
   const [committing, setCommitting] = useState(false);
   const [error, setError] = useState<string>("");
   const [showAllDetails, setShowAllDetails] = useState(false);

   // owner modal + scope
   const [openSelectOwnerKpiModal, setOpenSelectOwnerKpiModal] = useState(false);

   // filterValue for select owner kpi modal
   const [filterValue, setFilterValue] = useState<string>("op01");
   const scope: OwnerScope = useMemo(() => {
      if (filterValue === "op02") return "SAME_LINE_HIGHER";
      if (filterValue === "op03") return "OTHER_EVALUATEES";
      return "EVALUATEE_SELF";
   }, [filterValue]);

   const [owners, setOwners] = useState<OwnerOption[]>([]);
   const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
   const selectedOwner = useMemo(
      () => owners.find((o) => o.employeeId === selectedOwnerId) ?? null,
      [owners, selectedOwnerId]
   );

   // select cycle dropdown
   const [cycle, setCycle] = useState<string | null>(null);

   // source tree
   const [sourcePlanId, setSourcePlanId] = useState<string | null>(null);
   const [tree, setTree] = useState<Node[]>([]);
   const [types, setTypes] = useState<KpiType[]>([]);

   const [cycleStartIso, setCycleStartIso] = useState<string>("");
   const [cycleEndIso, setCycleEndIso] = useState<string>("");

   // selection
   const [selectedIds, setSelectedIds] = useState<string[]>([]);

   // confirm
   const [confirmOpen, setConfirmOpen] = useState(false);

   const canLoadTree = !!selectedOwnerId && !!cycle;
   const canCommit = !!targetPlanId && !!sourcePlanId && selectedIds.length > 0 && !committing;

   // -----------------------
   // init: load login user + targetPlanId
   // -----------------------
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

            const paramEvaluatorId = searchParams.get("evaluatorId");
            const realEvaluatorId = paramEvaluatorId || u.employeeId;
            setEvaluatorId(realEvaluatorId);

            setCyclePublicId(cycleId);
            setCycle(cycleId);

            // fetch kpi types for show in table
            const resTypes = await fetch("/api/kpiTypes", { cache: "no-store" });
            const jTypes = await resTypes.json();
            if (jTypes.ok) setTypes(jTypes.data as KpiType[]);

            // targetPlanId: from query
            const qpTarget = searchParams.get("targetPlanId");
            if (qpTarget) setTargetPlanId(qpTarget);

            // fallback: resolvePlan for find targetPlanId (of this evaluator->evaluatee)
            const resResolve = await fetch(
               `/api/evaluationAssignments/resolvePlan?cyclePublicId=${encodeURIComponent(
                  cycleId
               )}&evaluatorId=${encodeURIComponent(realEvaluatorId)}&evaluateeId=${encodeURIComponent( // <--- แก้ตรงนี้
                  evaluateeId
               )}`,
               { cache: "no-store" }            );
            const jResolve = await resResolve.json();
            if (!jResolve.ok) throw new Error(jResolve.message ?? "resolvePlan failed");

            setEvaluateeName(jResolve.data.evaluatee?.fullNameTh ?? "");

            if (!qpTarget) {
               setTargetPlanId(jResolve.data.planId as string);
            }
         } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
         } finally {
            setLoading(false);
         }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [evaluateeId, router]);

   // -----------------------
   // load owners whenever scope changes OR when open modal (optional)
   // -----------------------
   const loadOwners = async () => {
      if (!cyclePublicId || !evaluatorId || !evaluateeId) return;

      setLoadingOwners(true);
      setError("");

      try {
         const url =
            `/api/copyKpi/ownerOptions?cyclePublicId=${encodeURIComponent(cyclePublicId)}` +
            `&evaluatorId=${encodeURIComponent(evaluatorId)}` +
            `&evaluateeId=${encodeURIComponent(evaluateeId)}` +
            `&scope=${encodeURIComponent(scope)}`;

         const res = await fetch(url, { cache: "no-store" });
         const j = await res.json();

         if (!j.ok) throw new Error(j.message ?? "load owners failed");

         const list = (j.data.owners ?? []) as OwnerOption[];
         setOwners(list);

         // // if scope is 'EVALUATEE_SELF', auto select themself
         // if (scope === "EVALUATEE_SELF" && list.length === 1) {
         // 	setSelectedOwnerId(list[0].employeeId);
         // } else {
         // 	// reset owner list
         // 	if (selectedOwnerId && !list.some((x) => x.employeeId === selectedOwnerId)) {
         // 		setSelectedOwnerId(null);
         // 	}
         // }

         // reset owner list
         if (selectedOwnerId && !list.some((x) => x.employeeId === selectedOwnerId)) {
            setSelectedOwnerId(null);
         }
      } catch (e: any) {
         console.error(e);
         setError(e?.message ?? "โหลดรายชื่อเจ้าของตัวชี้วัดไม่สำเร็จ");
      } finally {
         setLoadingOwners(false);
      }
   };

   useEffect(() => {
      // get owners when change scope or open modal
      if (!cyclePublicId || !evaluatorId) return;
      loadOwners();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [scope, cyclePublicId, evaluatorId, evaluateeId]);

   // -----------------------
   // load source tree when owner+cycle ready
   // -----------------------

   const typeMap = useMemo(() => {
      const m = new Map<string, KpiType>();
      for (const t of types) m.set(t.id, t);
      return m;
   }, [types]);

   useEffect(() => {
      (async () => {
         if (!canLoadTree) {
            setSourcePlanId(null);
            setTree([]);
            setSelectedIds([]);
            return;
         }
         if (!cyclePublicId || !evaluatorId || !selectedOwnerId || !cycle) return;

         setLoadingTree(true);
         setError("");

         try {
            const url =
               `/api/copyKpi/sourceTree?cyclePublicId=${encodeURIComponent(cycle)}` +
               `&evaluatorId=${encodeURIComponent(evaluatorId)}` +
               `&sourceEmployeeId=${encodeURIComponent(selectedOwnerId)}`;

            const res = await fetch(url, { cache: "no-store" });
            const j = await res.json();

            if (!j.ok) throw new Error(j.message ?? "load sourceTree failed");

            setSourcePlanId(j.data.sourcePlanId as string);

            const c = j.data.cycle;
            if (c?.startDate) setCycleStartIso(c.startDate);
            if (c?.endDate) setCycleEndIso(c.endDate);

            const attachType = (n: Node): Node => ({
               ...n,
               type: n.typeId ? (typeMap.get(n.typeId) ?? null) : null,
               children: n.children.map(attachType),
            });
              
            const loadedTree: Node[] = (j.data.tree ?? []).map(normalizeNode).map(attachType);
            setTree(loadedTree);
            setSelectedIds([]);
         } catch (e: any) {
            console.error(e);
            setError(e?.message ?? "โหลดตัวชี้วัดต้นทางไม่สำเร็จ");
            setSourcePlanId(null);
            setTree([]);
            setSelectedIds([]);
         } finally {
            setLoadingTree(false);
         }
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [selectedOwnerId, cycle, evaluatorId, cyclePublicId]);

   // -----------------------
   // actions
   // -----------------------
   const goBack = () => {
      router.push(`/${encodeURIComponent(cycleId)}/evaluatee/defineKpi/${encodeURIComponent(evaluateeId)}?evaluatorId=${encodeURIComponent(evaluatorId)}`
      );   
   };

   const onClickCopy = () => {
      if (!canCommit) return;
      setConfirmOpen(true);
   };

   // helper: get list of key of all ITEM from tree
   const itemKeySet = useMemo(() => {
      const s = new Set<string>();
      const walk = (nodes: Node[]) => {
         for (const n of nodes) {
            const key = n.id!;
            if (n.nodeType === "ITEM") s.add(key);
            if (n.children?.length) walk(n.children);
         }
      };
      walk(tree);
      return s;
   }, [tree]);

   const commitCopy = async () => {
      if (!targetPlanId || !sourcePlanId) return;
      if (selectedIds.length === 0) return;

      setCommitting(true);
      setError("");

      const nodeIds = selectedIds.filter((id) => itemKeySet.has(id)); // ✅ only ITEM

      if (nodeIds.length === 0) {
         setError("กรุณาเลือกตัวชี้วัดอย่างน้อย 1 รายการ");
         return;
      }

      try {
         const res = await fetch("/api/copyKpi/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
               targetPlanId,
               sourcePlanId,
               nodeIds: selectedIds,
            }),
         });
         const j = await res.json();
         if (!j.ok) throw new Error(j.message ?? "copy failed");

         // success: back to defineKpi
         router.push(`/${encodeURIComponent(cycleId)}/evaluator/defineKpi/${encodeURIComponent(evaluateeId)}`);
      } catch (e: any) {
         console.error(e);
         setError(e?.message ?? "คัดลอกไม่สำเร็จ");
      } finally {
         setCommitting(false);
      }
   };

   // owners format for modal
   const ownersForModal = owners.map((o) => ({
      id: o.employeeId,
      employeeNo: o.employeeNo,
      name: o.fullNameTh,
      position: o.position,
      level: o.level,
   }));

   if (loading) {
      return <div className="px-20 py-7.5">Loading...</div>;
   }

   return (
   <>
      <div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
         <div className='flex items-center mb-2.5 gap-7'>
            <p className='text-title font-medium text-myApp-blueDark'>
               {`กำหนดตัวชี้วัด (${evaluateeName})`} / คัดลอกตัวชี้วัด
            </p>
            <Button 
               variant="primary"
               primaryColor="pink"
               className='ml-auto'
               onClick={goBack}>
               กลับไปยังหน้ากำหนดตัวชี้วัด
            </Button>
         </div>

         {/* menu tab */}
         <div className='flex items-center mb-3 gap-2.5'>
            <button
               className={selectedOwner ? "w-65 h-9 border-2 border-myApp-blueDark rounded-2xl bg-myApp-white py-2 text-center text-body font-medium text-myApp-blueDark" 
                        : "w-65 h-9 border-2 border-myApp-blueDark rounded-2xl bg-myApp-white py-2 text-center text-body font-medium text-myApp-grey" }
               onClick={() => setOpenSelectOwnerKpiModal(true)}
               disabled={loadingOwners}>
               {selectedOwner ? `เจ้าของ: ${selectedOwner.fullNameTh}` : "เลือกเจ้าของตัวชี้วัด"}
            </button>

            {/* modal for select kpi's owner wil show when click the select button */}
            <SelectOwnerKpiModal
               open={openSelectOwnerKpiModal}
               owners={ownersForModal}
               filterValue={filterValue}
               onFilterChange={(v) => {setFilterValue(v);}}
               onClose={() => setOpenSelectOwnerKpiModal(false)}
               onSelect={(o: any) => {
                  setSelectedOwnerId(o?.id ?? null);
                  setOpenSelectOwnerKpiModal(false);
               }}
            />

            <SelectCycleDropDown
               value={cycle}
               onChange={setCycle}
            />

            <div className='flex ml-auto gap-2.5'>
               <Button 
                  variant={showAllDetails ? "outline" : "primary"}
                  primaryColor="blueDark"
                  onClick={() => setShowAllDetails((prev) => !prev)}>
                  {showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
               </Button>

               {/* copy kpi button */}
               <Button
                     variant="primary"
                     primaryColor="green"
                     onClick={onClickCopy}
                     disabled={!canCommit}
                     title={
                        !targetPlanId
                           ? "ไม่พบ targetPlanId"
                           : !sourcePlanId
                              ? "กรุณาเลือกเจ้าของ/รอบก่อน"
                              : selectedIds.length === 0
                                 ? "กรุณาเลือกตัวชี้วัดอย่างน้อย 1 รายการ"
                                 : ""
                     }
                  >
                     {committing ? "กำลังคัดลอก..." : "คัดลอกตัวชี้วัดที่เลือก"}
               </Button>
            </div>
         </div>

         {error && (
            <div className="mb-3 p-3 rounded-xl border border-myApp-red bg-white text-myApp-red text-sm">
               {error}
            </div>
         )}

         <div className="flex-1 overflow-y-auto">
            {!canLoadTree ? (
               <div className="p-4 text-myApp-grey">
                  กรุณาเลือก <b>เจ้าของตัวชี้วัด</b> และ <b>รอบการประเมิน</b> ก่อนจึงจะแสดงรายการตัวชี้วัด
               </div>
            ) : loadingTree ? (
               <div className="p-4 text-myApp-grey">กำลังโหลดตัวชี้วัด...</div>
            ) : (
               <>
                  {React.createElement(TwoLevelKpiTable as any, {
                     mode: "view",
                     showAllDetails,
                     selectable: true,
                     tree,
                     kpiTypes: types,
                     onChangeTree: () => {},

                     defaultStartDate: cycleStartIso,
                     defaultEndDate: cycleEndIso,

                     // selection props
                     selectedIds: selectedIds,
                     onChangeSelectedIds: setSelectedIds,
                  })}
               </>
            )}
         </div>

         <ConfirmBox
            open={confirmOpen}
            message="ต้องการคัดลอกตัวชี้วัดที่เลือกไปยังการกำหนดตัวชี้วัดรอบปัจจุบันใช่หรือไม่?"
            cancelText="ยกเลิก"
            confirmText="ตกลง"
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
               setConfirmOpen(false);
               commitCopy();
            }}
         />
      </div>
   </>
  )
}
