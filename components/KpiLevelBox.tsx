import React from "react";

type Props = {
  level: 2 | 3;
  className?: string;
};

export default function KpiLevelBox({ level, className = "" }: Props) {
  return (
    <div
      className={`
        w-49 h-9 border-2 border-myApp-blueDark rounded-2xl bg-myApp-white py-2
        text-center text-body font-medium text-myApp-blueDark
        ${className}
      `}>
      กำหนดตัวชี้วัดแบบ {level} ระดับ
    </div>
  );
}