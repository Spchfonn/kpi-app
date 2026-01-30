"use client";
import React, { useMemo } from "react";
import { FiCalendar, FiChevronDown } from "react-icons/fi";

export type KpiTypeChoice = "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";

export type KpiTypeOption = {
	id: string;
	type: KpiTypeChoice;
	name: string;
};

type Props = {
	mode: "view" | "edit";   

	typeId: string | null;
	onTypeIdChange: (id: string | null) => void;

	kpiTypes: KpiTypeOption[];

	unit: string | null;
	onUnitChange: (v: string | null) => void;

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
		disabled = false,
	}: {
		active: boolean;
		children: React.ReactNode;
		colorClass: string;
		borderColor: string;
		onClick: () => void;
		disabled?: boolean,
	}) {
	return (
		<button
		type="button"
		disabled={disabled}
		onClick={onClick}
		className={`
			h-6 px-2 py-1 rounded-full border text-smallButton font-medium transition leading-none ${borderColor}
			${active ? `${colorClass} text-myApp-cream` : "bg-myApp-white text-myApp-blueDark hover:bg-myApp-shadow/40"}
		`}
		>
			{children}
		</button>
	);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  	return <span className="text-smallTitle font-medium text-myApp-blueDark">{children}</span>;
}

function isoToYmd(iso: string) {
	if (!iso) return "";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ymdToIso(ymd: string) {
	// make it midnight UTC; ok for your validation (start<=end)
	if (!ymd) return "";
	return new Date(`${ymd}T00:00:00.000Z`).toISOString();
}

export default function KpiDetailsBar({
		mode,
		typeId,
		onTypeIdChange,
		kpiTypes,
		unit,
		onUnitChange,
		startDate,
		onStartDateChange,
		endDate,
		onEndDateChange,
	}: Props) {

	const isEdit = mode === "edit";

	const byId = useMemo(() => {
		const m = new Map<string, KpiTypeOption>();
		kpiTypes.forEach((t) => m.set(t.id, t));
		return m;
	}, [kpiTypes]);

	const selected = typeId ? byId.get(typeId) : undefined;

	const firstOf = useMemo(() => {
		const pick = (kind: KpiTypeChoice) => kpiTypes.find((t) => t.type === kind)?.id ?? null;
		return {
			QUANTITATIVE: pick("QUANTITATIVE"),
			QUALITATIVE: pick("QUALITATIVE"),
			CUSTOM: pick("CUSTOM"),
		};
	}, [kpiTypes]);

	const activeKind: KpiTypeChoice | null = selected?.type ?? null;

	return (
		<div className="flex items-center gap-3 flex-wrap">
			{/* ประเภทตัวชี้วัด */}
			<div className="inline-flex items-center gap-1">
				<FieldLabel>ประเภทตัวชี้วัด</FieldLabel>

				<div className="flex items-center gap-1">
					<TypePill
						disabled={!isEdit}
						active={activeKind === "QUANTITATIVE"}
						colorClass="bg-myApp-pink"
						borderColor="border-myApp-pink"
						onClick={() => onTypeIdChange(firstOf.QUANTITATIVE)}
					>
						เชิงปริมาณ
					</TypePill>

					<TypePill
						disabled={!isEdit}
						active={activeKind === "QUALITATIVE"}
						colorClass="bg-myApp-yellow"
						borderColor="border-myApp-yellow"
						onClick={() => onTypeIdChange(firstOf.QUALITATIVE)}
					>
						เชิงคุณภาพ
					</TypePill>

					<TypePill
						disabled={!isEdit}
						active={activeKind === "CUSTOM"}
						colorClass="bg-myApp-blueLight"
						borderColor="border-myApp-blueLight"
						onClick={() => onTypeIdChange(firstOf.CUSTOM)}
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
						value={unit ?? ""}
						disabled={!isEdit}
						onChange={(e) => onUnitChange(e.target.value)}
						className="
						appearance-none
						bg-myApp-white
						border border-myApp-blue
						rounded-full
						h-6 px-6 py-1 pr-7
						text-smallButton font-medium text-myApp-blueDark
						outline-none
						"
					>
						<option value="">-</option>
						<option value="day">วัน</option>
						<option value="month">เดือน</option>
						<option value="percent">%</option>
						<option value="count">ครั้ง</option>
						<option value="score">คะแนน</option>
						<option value="minutes">นาที</option>
					</select>

					<FiChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-myApp-blueDark" />
				</div>
			</div>

			{/* วันเริ่มต้น */}
			<div className="inline-flex items-center gap-1">
				<FieldLabel>วันเริ่มต้น</FieldLabel>

				<div className="relative">
					<input
						type="date"
						disabled={!isEdit}
						value={isoToYmd(startDate)}
						onChange={(e) => onStartDateChange(ymdToIso(e.target.value))}
						className="bg-myApp-white border border-myApp-blue rounded-lg h-6 pl-2 pr-1 py-1
									text-smallButton font-medium text-myApp-blueDark outline-none"
					/>
				</div>
			</div>

			{/* วันสิ้นสุด */}
			<div className="inline-flex items-center gap-1">
				<FieldLabel>วันสิ้นสุด</FieldLabel>

				<div className="relative">
					<input
						type="date"
						disabled={!isEdit}
						value={isoToYmd(endDate)}
						onChange={(e) => onEndDateChange(ymdToIso(e.target.value))}
						className="bg-myApp-white border border-myApp-blue rounded-lg h-6 pl-2 pr-1 py-1
									text-smallButton font-medium text-myApp-blueDark outline-none"
					/>
				</div>
			</div>
		</div>
	);
}
