"use client";
import React from "react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";

type KpiType = "quantitative" | "qualitative" | "custom";

type Props = {
  kpiType: KpiType;
  onKpiTypeChange: (v: KpiType) => void;

  unit: string;
  onUnitChange: (v: string) => void;

  startDate: string; // YYYY-MM-DD
  onStartDateChange: (v: string) => void;

  endDate: string; // YYYY-MM-DD
  onEndDateChange: (v: string) => void;
};

function TypePill({
  active,
  children,
  colorClass,
  borderColor,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  colorClass: string;
  borderColor: string;
  onClick: () => void;
}) {
  return (
	<button
	  type="button"
	  onClick={onClick}
	  className={`
		h-5 px-2 py-1 rounded-full border text-smallButton font-medium transition leading-none ${borderColor}
		${active ? `${colorClass} text-myApp-cream` : "bg-myApp-white text-myApp-blue hover:bg-myApp-shadow/40"}
	  `}
	>
	  {children}
	</button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-smallTitle font-medium text-myApp-blue">{children}</span>;
}

export default function KpiDetailsBar({
  kpiType,
  onKpiTypeChange,
  unit,
  onUnitChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
}: Props) {
  return (
	<div className="flex items-center gap-4 flex-wrap">
	  {/* ประเภทตัวชี้วัด */}
	  <div className="inline-flex items-center gap-1">
		<FieldLabel>ประเภทตัวชี้วัด</FieldLabel>

		<div className="flex items-center gap-1">
		  <TypePill
			active={kpiType === "quantitative"}
			colorClass="bg-myApp-pink"
			borderColor="border-myApp-pink"
			onClick={() => onKpiTypeChange("quantitative")}
		  >
			เชิงปริมาณ
		  </TypePill>

		  <TypePill
			active={kpiType === "qualitative"}
			colorClass="bg-myApp-yellow"
			borderColor="border-myApp-yellow"
			onClick={() => onKpiTypeChange("qualitative")}
		  >
			เชิงคุณภาพ
		  </TypePill>

		  <TypePill
			active={kpiType === "custom"}
			colorClass="bg-myApp-blueLight"
			borderColor="border-myApp-blueLight"
			onClick={() => onKpiTypeChange("custom")}
		  >
			กำหนดเอง
		  </TypePill>
		</div>
	  </div>

	  {/* หน่วยวัด */}
	  <div className="inline-flex items-center gap-1">
		<FieldLabel>หน่วยวัด</FieldLabel>

		<div className="relative">
		  <select
			value={unit}
			onChange={(e) => onUnitChange(e.target.value)}
			className="
			  appearance-none
			  bg-myApp-white
			  border border-myApp-blue
			  rounded-full
			  h-5 px-6 py-1 pr-7
			  text-smallButton font-medium text-myApp-blue
			  outline-none
			"
		  >
			<option value="day">วัน</option>
			<option value="month">เดือน</option>
			<option value="percent">%</option>
			<option value="count">ครั้ง</option>
		  </select>

		  <FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-myApp-blue" />
		</div>
	  </div>

	  {/* วันเริ่มต้น */}
	  <div className="inline-flex items-center gap-1">
		<FieldLabel>วันเริ่มต้น</FieldLabel>

		<div className="relative">
		  <input
			type="date"
			value={startDate}
			onChange={(e) => onStartDateChange(e.target.value)}
			className="
			  bg-myApp-white
			  border border-myApp-blue
			  rounded-lg
			  h-5 px-2 py-1
			  text-smallButton font-medium text-myApp-blue
			  outline-none
			"
		  />
		</div>
	  </div>

	  {/* วันสิ้นสุด */}
	  <div className="inline-flex items-center gap-1">
		<FieldLabel>วันสิ้นสุด</FieldLabel>

		<div className="relative">
		  <input
			type="date"
			value={endDate}
			onChange={(e) => onEndDateChange(e.target.value)}
			className="
			  bg-myApp-white
			  border border-myApp-blue
			  rounded-lg
			  h-5 px-2 py-1
			  text-smallButton font-medium text-myApp-blue
			  outline-none
			"
		  />
		</div>
	  </div>
	</div>
  );
}