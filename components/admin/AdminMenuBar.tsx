"use client";
import React from 'react'
import Link from 'next/link'

export type AdminTabKey = "evaluationCycles" | "orgStructure" | "dashboard";

export default function AdminMenuBar({
		activeTab,
		onChange,
	}: {
		activeTab: AdminTabKey;
		onChange: (tab: AdminTabKey) => void;
	}) {
	const base = "px-3 py-1 text-body font-medium rounded-4xl border-2 transition-colors";
	const active = "bg-myApp-blueDark text-myApp-cream border-myApp-blueDark";
	const inactive = "border-myApp-blueDark text-myApp-blueDark hover:bg-myApp-blueDark hover:text-myApp-cream";
	return (
		<div className="flex gap-4 bg-myApp-cream">
			<button
				className={`${base} ${activeTab === "evaluationCycles" ? active : inactive}`}
				onClick={() => onChange("evaluationCycles")}>
				รอบการประเมิน
			</button>

			<button
				className={`${base} ${activeTab === "orgStructure" ? active : inactive}`}
				onClick={() => onChange("orgStructure")}>
				โครงสร้างองค์กร
			</button>

			<button
				className={`${base} ${activeTab === "dashboard" ? active : inactive}`}
				onClick={() => onChange("dashboard")}>
				Dashboard
			</button>
		</div>
	)
}
