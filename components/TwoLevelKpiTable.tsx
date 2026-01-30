"use client";
import React, { useState, useEffect, useMemo } from "react";
import { FiChevronDown, FiChevronRight, FiPlusCircle, FiTrash2, FiArrowUp, FiArrowDown, FiCheck } from "react-icons/fi";
import KpiDetailsBar from "./KpiDetailsBar";
import ScoreBoxForQuantitativeKpi from "./ScoreBoxForQuantitativeKpi";
import ScoreBoxForQualitativeKpi from "./ScoreBoxForQualitativeKpi";
import ScoreBoxForCustomKpi from "./ScoreBoxForCustomKpi";

// --- Types ---
type Rubric =
  | { kind: "QUANTITATIVE_1_TO_5"; levels: { unit: string | null; score: number; value: number }[] }
  | { kind: "QUALITATIVE_CHECKLIST"; checklist: { item: string; weight_percent: number }[] }
  | { kind: "CUSTOM_DESCRIPTION_1_TO_5"; levels: { desc: string; score: number }[] };

export type KpiTreeNode = {
   id?: string;
   clientId?: string;
   nodeType: "GROUP" | "ITEM";
   title: string;
   weightPercent: number;
  
   // ITEM
   typeId?: string | null;
   type?: {
      id: string;
      type: "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";
      name: string;
      rubric: Rubric;
   } | null;
   unit?: string | null;
   startDate?: string | null;
   endDate?: string | null;
  
   children: KpiTreeNode[];
   displayNo?: string;
};

// --- Helpers ---
const uid = () => Math.random().toString(36).slice(2, 10);

const nodeKey = (n: KpiTreeNode) =>
  n.id ??
  n.clientId ??
  n.displayNo ??
  (() => { throw new Error("Node has no stable key"); })();

// --- Components ---
function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
   return (
      <button
         type="button"
         onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
         className={`h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition mr-2
               ${checked ? "bg-myApp-blueDark border-myApp-blueDark" : "bg-white border-myApp-blueDark"}`}
         aria-pressed={checked}
      >
         {checked && <FiCheck className="text-white text-xs" />}
      </button>
   );
}

function emptyRubricForType(t: "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM"): Rubric {
	if (t === "QUANTITATIVE") {
		return {
			kind: "QUANTITATIVE_1_TO_5",
			levels: [
			{ unit: null, score: 1, value: 0 },
			{ unit: null, score: 2, value: 0 },
			{ unit: null, score: 3, value: 0 },
			{ unit: null, score: 4, value: 0 },
			{ unit: null, score: 5, value: 0 },
			],
		};
	}
	if (t === "QUALITATIVE") {
	  	return { kind: "QUALITATIVE_CHECKLIST", checklist: [] };
	}
	return {
		kind: "CUSTOM_DESCRIPTION_1_TO_5",
		levels: [
			{ score: 1, desc: "" },
			{ score: 2, desc: "" },
			{ score: 3, desc: "" },
			{ score: 4, desc: "" },
			{ score: 5, desc: "" },
		],
	};
}

type Props = {
   mode: "view" | "edit";
   showAllDetails: boolean;
   
   // Selection Props (New)
   selectable?: boolean;
   selectedIds?: Set<string>;
   onSelectionChange?: (ids: Set<string>) => void;
  
   tree: KpiTreeNode[];
   onChangeTree: React.Dispatch<React.SetStateAction<KpiTreeNode[]>>;

   kpiTypes: { id: string; type: "QUANTITATIVE"|"QUALITATIVE"|"CUSTOM"; name: string }[];
   defaultStartDate: string;
   defaultEndDate: string;
};

export default function TwoLevelKpiTable({
   mode,
   showAllDetails,
   selectable = false,
   selectedIds: controlledSelectedIds,
   onSelectionChange,
   tree,
   onChangeTree,
   kpiTypes,
   defaultStartDate,
   defaultEndDate
  }: Props) {

   const rows = tree;
   const setRows = onChangeTree;

   // Internal state fallback
   const [internalSelected, setInternalSelected] = useState<Set<string>>(new Set());
   const selected = controlledSelectedIds ?? internalSelected;

   const handleSelectionChange = (next: Set<string>) => {
      if (onSelectionChange) {
         onSelectionChange(next);
      } else {
         setInternalSelected(next);
      }
   };

   const isSelected = (id: string) => selected.has(id);

   const toggleParentSelect = (parentKey: string, checked: boolean) => {
      const next = new Set(selected);
      const p = rows.find((x) => nodeKey(x) === parentKey);
      if (!p) return;
   
      if (checked) {
         next.add(parentKey);
         p.children.forEach((c) => next.add(nodeKey(c)));
      } else {
         next.delete(parentKey);
         p.children.forEach((c) => next.delete(nodeKey(c)));
      }
      handleSelectionChange(next);
   };

   const toggleChildSelect = (parentKey: string, childKey: string, checked: boolean) => {
      const next = new Set(selected);
      if (checked) next.add(childKey);
      else next.delete(childKey);

      const p = rows.find((x) => nodeKey(x) === parentKey);
      if (!p) return;

      const allChildrenSelected = p.children.every((c) => next.has(nodeKey(c)));
      
      // Logic: ถ้าลูกทุกคนถูกเลือก ให้แม่ถูกเลือกด้วย
      // หรือถ้าอยากให้เลือกแม่ทันทีที่มีลูกอย่างน้อย 1 คนถูกเลือก ก็ปรับ logic ตรงนี้ได้
      if (allChildrenSelected && p.children.length > 0) next.add(parentKey);
      else if (!allChildrenSelected) next.delete(parentKey);

      handleSelectionChange(next);
   };

   // Grid Layout Class
   const colClass = mode === "edit"
      ? "grid grid-cols-[1fr_100px_110px_48px] items-center"
      : "grid grid-cols-[1fr_100px_110px] items-center";

   const [expanded, setExpanded] = useState<Record<string, boolean>>({});
   const isExpanded = (key: string) => expanded[key] ?? true;

   const toggleExpand = (parentKey: string) => {
      setExpanded((prev) => ({ ...prev, [parentKey]: !isExpanded(parentKey) }));
   };

   // --- CRUD Operations ---
   const addParent = () => {
      setRows((prev) => [
         ...prev,
         {
            clientId: `tmp_${uid()}`,
            nodeType: "GROUP",
            title: "",
            weightPercent: 0,
            children: [],
         },
      ]);
   };

   const addChild = (parentKey: string) => {
      setRows((prev) =>
         prev.map((p) => {
            if (nodeKey(p) !== parentKey) return p;
            const nextChild: KpiTreeNode = {
               clientId: `tmp_${uid()}`,
               nodeType: "ITEM",
               title: "",
               weightPercent: 0,
               startDate: defaultStartDate,
               endDate: defaultEndDate,
               typeId: kpiTypes[0]?.id ?? null,
               unit: null,
               children: [],
            };
            return { ...p, children: [...p.children, nextChild] };
         })
      );
   };

   const updateParent = (parentKey: string, patch: Partial<KpiTreeNode>) => {
      setRows((prev) =>
         prev.map((p) => (nodeKey(p) === parentKey ? { ...p, ...patch } : p))
      );
   };

   const updateChild = (parentKey: string, childKey: string, patch: Partial<KpiTreeNode>) => {
      setRows((prev) =>
         prev.map((p) => {
            if (nodeKey(p) !== parentKey) return p;
            return {
               ...p,
               children: p.children.map((c) => (nodeKey(c) === childKey ? { ...c, ...patch } : c)),
            }
         })
      );
   };

   const deleteParent = (parentKey: string) => {
      setRows((prev) => prev.filter((p) => nodeKey(p) !== parentKey));
      // Clean up selection
      const next = new Set(selected);
      next.delete(parentKey);
      handleSelectionChange(next);
   };

   const deleteChild = (parentKey: string, childKey: string) => {
      setRows((prev) =>
         prev.map((p) => {
            if (nodeKey(p) !== parentKey) return p;
            return { ...p, children: p.children.filter((c) => nodeKey(c) !== childKey) };
         })
      );
      // Clean up selection
      const next = new Set(selected);
      next.delete(childKey);
      handleSelectionChange(next);
   };

   function moveItem<T>(arr: T[], from: number, to: number) {
      if (to < 0 || to >= arr.length) return arr;
      const next = arr.slice();
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
   }

   const moveParent = (parentKey: string, dir: "up" | "down") => {
      setRows((prev) => {
         const idx = prev.findIndex((p) => nodeKey(p) === parentKey);
         const to = dir === "up" ? idx - 1 : idx + 1;
         return moveItem(prev, idx, to);
      });
   };

   const moveChild = (parentKey: string, childKey: string, dir: "up" | "down") => {
      setRows((prev) =>
         prev.map((p) => {
            if (nodeKey(p) !== parentKey) return p;
            const idx = p.children.findIndex((c) => nodeKey(c) === childKey);
            const to = dir === "up" ? idx - 1 : idx + 1;
            return { ...p, children: moveItem(p.children, idx, to), };
         })
      );
   };

   const renderRubric = (c: KpiTreeNode) => {
      const rubric = c.type?.rubric;
      if (!rubric) return null;
     
      switch (rubric.kind) {
        case "QUANTITATIVE_1_TO_5":
          return <ScoreBoxForQuantitativeKpi mode={mode} levels={rubric.levels} />;
        case "QUALITATIVE_CHECKLIST":
          return (
            <ScoreBoxForQualitativeKpi
               mode={mode}
               items={rubric.checklist.map((x: any, i: number) => ({
                  id: i + 1,
                  title: x.item,
                  weight: x.weight_percent,
               }))}
               onChange={() => {}}
            />
          );
        case "CUSTOM_DESCRIPTION_1_TO_5":
          return <ScoreBoxForCustomKpi mode={mode} levels={rubric.levels} />;
        default:
          return null;
      }
   };

  return (
   <div className="w-full">
      {/* header */}
      <div className="sticky top-0 z-10 bg-myApp-cream">
         <div className="bg-myApp-blue rounded-3xl shadow-sm px-4 py-4 text-myApp-cream text-button font-semibold">
            <div className={`${colClass} place-items-center`}>
            <div>ตัวชี้วัด</div>
            <div>ค่าน้ำหนัก</div>
            <div>ความสัมพันธ์</div>
            {mode === "edit" && <div />}
            </div>
         </div>
      </div>

      {/* rows */}
      <div className="mt-2 space-y-2 text-body-changed font-medium">
         {rows.map((p) => {
            const pKey = nodeKey(p);
            return (
               <div key={pKey}>
                  {/* parent row */}
                  <div className="bg-myApp-white rounded-xl shadow-sm px-4 py-3">
                      <div className={`${colClass}`}>
                         <div className="flex items-center gap-1 text-myApp-blueDark">
                           
                            {selectable && (
                               <CheckBox
                                  checked={isSelected(pKey)}
                                  onChange={(ck) => toggleParentSelect(pKey, ck)}
                               />
                            )}

                            <button
                               type="button"
                               onClick={() => toggleExpand(pKey)}
                               className="p-1 rounded-xl hover:bg-myApp-shadow/40 transition"
                               title="ขยาย/ย่อ"
                            >
                               {isExpanded(pKey) ? <FiChevronDown /> : <FiChevronRight />}
                            </button>

                            {mode === "edit" ? (
                               <div className="flex items-center gap-2 w-full">
                                  <span className="shrink-0">{p.displayNo ? `${p.displayNo}.` : ""}</span>
                                  <input
                                     className="w-full bg-transparent outline-none"
                                     value={p.title}
                                     onChange={(e) => updateParent(pKey, { title: e.target.value })}
                                     placeholder="กรอกตัวชี้วัดระดับ 1"
                                  />
                               </div>
                            ) : (
                               <span className="text-body font-medium">
                                  {(p.displayNo ? `${p.displayNo}. ` : "") + p.title}
                               </span>
                            )}
                         </div>

                         <div className="flex items-center justify-center text-myApp-blueDark">
                            {mode === "edit" ? (
                               <input
                                  type="number"
                                  className="w-full bg-transparent outline-none text-center"
                                  value={p.weightPercent}
                                  onChange={(e) => updateParent(pKey, { weightPercent: Number(e.target.value) })}
                               />
                            ) : (
                               <span className="text-body font-medium">{p.weightPercent}%</span>
                            )}
                         </div>

                         <div className="flex items-center justify-center text-myApp-blueDark">
                            {/* Relation placeholder */}
                         </div>

                         {/* actions */}
                         <div className="flex items-center justify-end text-myApp-shadow">
                            {mode === "edit" && (
                               <>
                               <button onClick={() => moveParent(pKey, "down")} className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
                                  <FiArrowDown className="text-lg scale-x-80" />
                               </button>
                               <button onClick={() => moveParent(pKey, "up")} className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
                                  <FiArrowUp className="text-lg scale-x-80" />
                               </button>
                               <button
                                  type="button"
                                  onClick={() => deleteParent(pKey)}
                                  className="flex items-center justify-center rounded-lg hover:bg-myApp-red/10 text-myApp-shadow"
                                  title="ลบระดับ 1"
                               >
                                  <FiTrash2 className="text-lg" />
                               </button>
                               </>
                            )}
                         </div>
                      </div>
                  </div>

                  {/* children */}
                  {isExpanded(pKey) && (
                      <div className="mt-2 space-y-2">
                         {p.children.map((c) => {
                            const cKey = nodeKey(c);
                            return (
                               <div key={cKey} className="bg-myApp-white rounded-xl shadow-sm px-4 py-3 ml-10">
                                  <div className={`${colClass}`}>
                                      <div className="text-myApp-blueDark flex gap-2 items-center">
                                         
                                         {selectable && (
                                            <CheckBox
                                               checked={isSelected(cKey)}
                                               onChange={(ck) => toggleChildSelect(pKey, cKey, ck)}
                                            />
                                         )}

                                         {mode === "edit" ? (
                                            <div className="flex items-center gap-2 w-full">
                                               <span className="shrink-0">{c.displayNo ? `${c.displayNo}.` : ""}</span>
                                               <input
                                                  className="w-full bg-transparent outline-none"
                                                  value={c.title}
                                                  onChange={(e) => updateChild(pKey, cKey, { title: e.target.value })}
                                                  placeholder="กรอกตัวชี้วัดระดับ 2"
                                               />
                                            </div>
                                         ) : (
                                            <span className="text-body font-medium">
                                               {(c.displayNo ? `${c.displayNo}. ` : "") + c.title}
                                            </span>
                                         )}
                                      </div>

                                      <div className="flex items-center justify-center text-myApp-blueLight">
                                         {mode === "edit" ? (
                                            <input
                                               type="number"
                                               className="w-full bg-transparent outline-none text-center"
                                               value={c.weightPercent}
                                               onChange={(e) => updateChild(pKey, cKey, { weightPercent: Number(e.target.value) })}
                                            />
                                         ) : (
                                            <span className="font-semibold">{c.weightPercent}%</span>
                                         )}
                                      </div>

                                      <div className="flex items-center justify-center text-myApp-blueDark">
                                         {/* Relation placeholder */}
                                      </div>

                                      <div className="flex items-center justify-end text-myApp-grey">
                                         {mode === "edit" && (
                                            <>
                                               <button onClick={() => moveChild(pKey, cKey, "down")} className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
                                                  <FiArrowDown className="text-lg scale-x-80" />
                                               </button>
                                               <button onClick={() => moveChild(pKey, cKey, "up")} className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
                                                  <FiArrowUp className="text-lg scale-x-80" />
                                               </button>
                                               <button
                                                  type="button"
                                                  onClick={() => deleteChild(pKey, cKey)}
                                                  className="flex items-center justify-center rounded-lg hover:bg-myApp-red/10"
                                                  title="ลบระดับ 2"
                                               >
                                                  <FiTrash2 className="text-lg" />
                                               </button>
                                            </>
                                         )}
                                      </div>
                                  </div>

                                  {showAllDetails && (
                                     <div className="flex flex-col mt-2 rounded-xl px-4 gap-1.5">
                                         <KpiDetailsBar
                                            mode={mode}
                                            typeId={c.typeId ?? null}
                                            onTypeIdChange={(id) => updateChild(pKey, cKey, { typeId: id })}
                                            kpiTypes={kpiTypes}
                                            unit={c.unit ?? ""}
                                            onUnitChange={(v) => updateChild(pKey, cKey, { unit: v || null })}
                                            startDate={c.startDate ?? ""}
                                            onStartDateChange={(v) => updateChild(pKey, cKey, { startDate: v || null })}
                                            endDate={c.endDate ?? ""}
                                            onEndDateChange={(v) => updateChild(pKey, cKey, { endDate: v || null })}
                                         />
                                         {renderRubric(c)}
                                     </div>
                                  )}
                               </div>
                            )
                         })}

                         {mode === "edit" && (
                            <button
                               type="button"
                               onClick={() => addChild(pKey)}
                               className="ml-10 inline-flex items-center gap-2 text-myApp-blueDark hover:opacity-80"
                            >
                               <FiPlusCircle className="text-xl" />
                            </button>
                         )}
                      </div>
                  )}
               </div>
            )
         })}

         {mode === "edit" && (
            <button
               type="button"
               onClick={addParent}
               className="inline-flex items-center gap-2 text-myApp-blueDark hover:opacity-80"
            >
               <FiPlusCircle className="text-xl" />
            </button>
         )}
      </div>
   </div>
  );
}