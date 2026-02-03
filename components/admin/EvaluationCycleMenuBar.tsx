import React from 'react'
import Link from 'next/link'

export type TabKey = "basic" | "evaluationAssignment" | "employeeStatus" | "kpiStructure" | "dashboard";

const base =
  "px-3 py-1.5 text-body font-medium rounded-full border-2 transition-colors";

function tabClass(active: boolean) {
  return active
    ? `${base} bg-myApp-blueDark text-myApp-cream border-myApp-blueDark`
    : `${base} bg-myApp-cream text-myApp-blueDark border-myApp-blueDark hover:bg-myApp-blueDark hover:text-myApp-cream`;
}

export default function EvaluationCycleMenuBar({
	active,
	onChange,
  }: {
	active: TabKey;
	onChange?: (tab: TabKey) => void;
  }) {
	return (
		<div className="flex gap-4 bg-myApp-cream">
			<button
				className={tabClass(active === "basic")}
				onClick={() => onChange?.("basic")}>
				ข้อมูลพื้นฐาน
			</button>

			<button
				className={tabClass(active === "evaluationAssignment")}
				onClick={() => onChange?.("evaluationAssignment")}>
				ข้อมูลคู่ประเมิน
			</button>

			<button
				className={tabClass(active === "employeeStatus")}
				onClick={() => onChange?.("employeeStatus")}>
				สถานะการทำงานของพนักงานทั้งหมด
			</button>

			{/* <button 
				className={tabClass(active === "kpiStructure")}
				onClick={() => onChange?.("kpiStructure")}>
				โครงสร้างตัวชี้วัด
			</button>

			<button
				className={tabClass(active === "dashboard")}
				onClick={() => onChange?.("dashboard")}>
				Dashboard
			</button> */}
		</div>
	)
}
