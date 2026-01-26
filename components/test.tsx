"use client";
import React, { useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronRight,
  FiPlusCircle,
  FiTrash2,
  FiArrowUp,
  FiArrowDown,
  FiCheck,
} from "react-icons/fi";

import KpiDetailsBar from "./KpiDetailsBar";
import ScoreBoxForQuantitativeKpi from "./ScoreBoxForQuantitativeKpi";
import ScoreBoxForQualitativeKpi from "./ScoreBoxForQualitativeKpi";
import ScoreBoxForCustomKpi from "./ScoreBoxForCustomKpi";

/* =========================
 * types
 * ========================= */

type Rubric =
  | {
      kind: "QUANTITATIVE_1_TO_5";
      levels: { unit: string | null; score: number; value: number }[];
    }
  | {
      kind: "QUALITATIVE_CHECKLIST";
      checklist: { item: string; weight_percent: number }[];
    }
  | {
      kind: "CUSTOM_DESCRIPTION_1_TO_5";
      levels: { desc: string; score: number }[];
    };

export type KpiTreeNode = {
  id?: string;
  clientId: string;

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

type Props = {
  mode: "view" | "edit";
  showAllDetails: boolean;
  selectable?: boolean;

  tree: KpiTreeNode[];
  onChangeTree: React.Dispatch<React.SetStateAction<KpiTreeNode[]>>;

  kpiTypes: {
    id: string;
    type: "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";
    name: string;
  }[];

  defaultStartDate: string;
  defaultEndDate: string;
};

/* =========================
 * helpers
 * ========================= */

const uid = () => Math.random().toString(36).slice(2, 10);

const nodeKey = (n: KpiTreeNode) => n.id ?? n.clientId;

/**
 * 🔹 ใช้กับข้อมูลจาก API generate
 * เพื่อให้แก้ไข / ลบ / reorder ได้เหมือน user พิมพ์เอง
 */
export function prepareGeneratedTree(nodes: any[]): KpiTreeNode[] {
  return nodes.map((n) => ({
    ...n,
    clientId: `tmp_${uid()}`,
    children: prepareGeneratedTree(n.children ?? []),
  }));
}

function moveItem<T>(arr: T[], from: number, to: number) {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* =========================
 * component
 * ========================= */

export default function TwoLevelKpiTable({
  mode,
  showAllDetails,
  selectable = false,
  tree,
  onChangeTree,
  kpiTypes,
  defaultStartDate,
  defaultEndDate,
}: Props) {
  const rows = useMemo(() => tree, [tree]);
  const setRows = onChangeTree;

  /* ---------- selection ---------- */

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const isSelected = (id: string) => selected.has(id);

  /* ---------- expand ---------- */

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const isExpanded = (key: string) => expanded[key] ?? true;

  const toggleExpand = (key: string) => {
    setExpanded((p) => ({ ...p, [key]: !isExpanded(key) }));
  };

  /* ---------- CRUD ---------- */

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
      prev.map((p) =>
        nodeKey(p) !== parentKey
          ? p
          : {
              ...p,
              children: [
                ...p.children,
                {
                  clientId: `tmp_${uid()}`,
                  nodeType: "ITEM",
                  title: "",
                  weightPercent: 0,
                  typeId: kpiTypes[0]?.id ?? null,
                  unit: null,
                  startDate: defaultStartDate,
                  endDate: defaultEndDate,
                  children: [],
                },
              ],
            }
      )
    );
  };

  const updateNode = (
    parentKey: string | null,
    key: string,
    patch: Partial<KpiTreeNode>
  ) => {
    setRows((prev) =>
      parentKey === null
        ? prev.map((p) => (nodeKey(p) === key ? { ...p, ...patch } : p))
        : prev.map((p) =>
            nodeKey(p) !== parentKey
              ? p
              : {
                  ...p,
                  children: p.children.map((c) =>
                    nodeKey(c) === key ? { ...c, ...patch } : c
                  ),
                }
          )
    );
  };

  const deleteNode = (parentKey: string | null, key: string) => {
    setRows((prev) =>
      parentKey === null
        ? prev.filter((p) => nodeKey(p) !== key)
        : prev.map((p) =>
            nodeKey(p) !== parentKey
              ? p
              : { ...p, children: p.children.filter((c) => nodeKey(c) !== key) }
          )
    );
  };

  const moveNode = (
    parentKey: string | null,
    key: string,
    dir: "up" | "down"
  ) => {
    setRows((prev) => {
      if (parentKey === null) {
        const idx = prev.findIndex((p) => nodeKey(p) === key);
        return moveItem(prev, idx, dir === "up" ? idx - 1 : idx + 1);
      }

      return prev.map((p) => {
        if (nodeKey(p) !== parentKey) return p;
        const idx = p.children.findIndex((c) => nodeKey(c) === key);
        return {
          ...p,
          children: moveItem(
            p.children,
            idx,
            dir === "up" ? idx - 1 : idx + 1
          ),
        };
      });
    });
  };

  /* ---------- rubric ---------- */

  const renderRubric = (c: KpiTreeNode) => {
    if (!c.type?.rubric) return null;

    switch (c.type.rubric.kind) {
      case "QUANTITATIVE_1_TO_5":
        return (
          <ScoreBoxForQuantitativeKpi
            mode={mode}
            levels={c.type.rubric.levels}
          />
        );

      case "QUALITATIVE_CHECKLIST":
        return (
          <ScoreBoxForQualitativeKpi
            mode={mode}
            items={c.type.rubric.checklist.map((x, i) => ({
              id: i + 1,
              title: x.item,
              weight: x.weight_percent,
            }))}
            onChange={() => {}}
          />
        );

      case "CUSTOM_DESCRIPTION_1_TO_5":
        return (
          <ScoreBoxForCustomKpi
            mode={mode}
            levels={c.type.rubric.levels}
          />
        );

      default:
        return null;
    }
  };

  /* =========================
   * render
   * ========================= */

  return (
    <div className="w-full space-y-2">
      {rows.map((p) => {
        const pKey = nodeKey(p);
        return (
          <div key={pKey}>
            {/* parent */}
            <div className="bg-white rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2">
                <button onClick={() => toggleExpand(pKey)}>
                  {isExpanded(pKey) ? <FiChevronDown /> : <FiChevronRight />}
                </button>

                {mode === "edit" ? (
                  <input
                    className="flex-1 outline-none"
                    value={p.title}
                    onChange={(e) =>
                      updateNode(null, pKey, { title: e.target.value })
                    }
                    placeholder="ตัวชี้วัดระดับ 1"
                  />
                ) : (
                  <span>{p.title}</span>
                )}

                {mode === "edit" && (
                  <>
                    <button onClick={() => moveNode(null, pKey, "up")}>
                      <FiArrowUp />
                    </button>
                    <button onClick={() => moveNode(null, pKey, "down")}>
                      <FiArrowDown />
                    </button>
                    <button onClick={() => deleteNode(null, pKey)}>
                      <FiTrash2 />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* children */}
            {isExpanded(pKey) &&
              p.children.map((c) => {
                const cKey = nodeKey(c);
                return (
                  <div
                    key={cKey}
                    className="ml-10 bg-white rounded-xl px-4 py-3 shadow-sm mt-2"
                  >
                    <div className="flex items-center gap-2">
                      {mode === "edit" ? (
                        <input
                          className="flex-1 outline-none"
                          value={c.title}
                          onChange={(e) =>
                            updateNode(pKey, cKey, {
                              title: e.target.value,
                            })
                          }
                          placeholder="ตัวชี้วัดระดับ 2"
                        />
                      ) : (
                        <span>{c.title}</span>
                      )}

                      {mode === "edit" && (
                        <>
                          <button
                            onClick={() => moveNode(pKey, cKey, "up")}
                          >
                            <FiArrowUp />
                          </button>
                          <button
                            onClick={() => moveNode(pKey, cKey, "down")}
                          >
                            <FiArrowDown />
                          </button>
                          <button
                            onClick={() => deleteNode(pKey, cKey)}
                          >
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>

                    {showAllDetails && (
                      <div className="mt-2">
                        <KpiDetailsBar
                          mode={mode}
                          typeId={c.typeId ?? null}
                          onTypeIdChange={(id) =>
                            updateNode(pKey, cKey, { typeId: id })
                          }
                          kpiTypes={kpiTypes}
                          unit={c.unit ?? ""}
                          onUnitChange={(v) =>
                            updateNode(pKey, cKey, { unit: v || null })
                          }
                          startDate={c.startDate ?? ""}
                          onStartDateChange={(v) =>
                            updateNode(pKey, cKey, {
                              startDate: v || null,
                            })
                          }
                          endDate={c.endDate ?? ""}
                          onEndDateChange={(v) =>
                            updateNode(pKey, cKey, { endDate: v || null })
                          }
                        />
                        {renderRubric(c)}
                      </div>
                    )}
                  </div>
                );
              })}

            {mode === "edit" && (
              <button
                onClick={() => addChild(pKey)}
                className="ml-10 mt-2 text-blue-600"
              >
                <FiPlusCircle />
              </button>
            )}
          </div>
        );
      })}

      {mode === "edit" && (
        <button onClick={addParent} className="text-blue-600">
          <FiPlusCircle />
        </button>
      )}
    </div>
  );
}
