"use client";
import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { KpiTreeNode } from "./TwoLevelKpiTable";

export default function RecommendKpiModal({
  open,
  data,
  onClose,
  onConfirm,
}: {
  open: boolean;
  data: KpiTreeNode[];
  onClose: () => void;
  onConfirm: (selected: KpiTreeNode[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!open) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-myApp-cream rounded-2xl w-[800px] max-h-[80vh] overflow-auto p-6">
        <div className="flex items-center mb-4">
          <h2 className="text-title font-semibold text-myApp-blueDark">
            KPI ที่ระบบแนะนำ
          </h2>
          <button onClick={onClose} className="ml-auto">
            <FiX />
          </button>
        </div>

        <div className="space-y-4">
          {data.map((g) => (
            <div key={g.clientId} className="border rounded-xl p-3">
              <p className="font-semibold text-myApp-blueDark">
                {g.title}
              </p>

              <div className="ml-4 mt-2 space-y-2">
                {g.children.map((c) => (
                  <label
                    key={c.clientId}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.clientId!)}
                      onChange={() => toggle(c.clientId!)}
                    />
                    <span>{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">
            ยกเลิก
          </button>
          <button
            onClick={() =>
              onConfirm(
                data.map((g) => ({
                  ...g,
                  children: g.children.filter((c) =>
                    selected.has(c.clientId!)
                  ),
                }))
              )
            }
            className="btn-primary"
          >
            นำไปใช้
          </button>
        </div>
      </div>
    </div>
  );
}
