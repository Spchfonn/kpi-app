import React from "react";

type StatusKey = "notEvaluate" | "pending" | "completed";

type StatusItem = {
  key: StatusKey;
  label: string;
  colorClass: string;
};

const LEGENDS: StatusItem[] = [
  {
    key: "notEvaluate",
    label: "ยังไม่ประเมินตัวชี้วัด",
    colorClass: "bg-myApp-red",
  },
  {
    key: "pending",
    label: "กำลังประเมินตัวชี้วัด",
    colorClass: "bg-myApp-yellow",
  },
  {
    key: "completed",
    label: "ประเมินตัวชี้วัดสมบูรณ์",
    colorClass: "bg-myApp-green",
  },
];

export default function DefinedStatus() {
  return (
    <div className="flex flex-col gap-1">
      {LEGENDS.map((item) => (
        <div key={item.key} className="flex items-center gap-1">
          <span
            className={`w-2.5 h-2.5 rounded-full ${item.colorClass}`}
          />
          <span className="text-smallestBody font-medium text-myApp-blueDark">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}