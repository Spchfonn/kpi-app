import React from "react";
import { FiCheck } from "react-icons/fi";

export type KpiType = "quantitative" | "qualitative" | "custom" | null;

type ChecklistCriterion = { id: string; weight: number };

type QuantLevel = { unit: string; score: number; value: number };
type QuantScale = { kind: "QUANTITATIVE_1_TO_5"; levels: QuantLevel[] }
  				| { kind: string; levels: QuantLevel[] }; // เผื่ออนาคต

function CheckBox({
	checked,
	onChange,
	title,
  }: {
	checked: boolean;
	onChange: (v: boolean) => void;
	title?: string;
  }) {
	return (
		<button
			type="button"
			title={title}
			onClick={() => onChange(!checked)}
			className={`
			h-4 w-4 rounded border flex items-center justify-center cursor-pointer transition
			${checked ? "bg-myApp-blueDark border-myApp-blueDark" : "bg-myApp-white border-myApp-blueDark"}
			`}
			aria-pressed={checked}
		>
			{checked && <FiCheck className="text-myApp-cream text-xs" />}
		</button>
	);
}

export const UNIT_LABEL_MAP: Record<string, string> = {
  day: "วัน",
  month: "เดือน",
  percent: "%",
  count: "ครั้ง",
  score: "คะแนน",
  minutes: "นาที",
};

export function getRequirementText(score: number | "", scale?: QuantScale, currentUnit?: string | null) {
   if (score === "" || !scale?.levels?.length) return "";
  
   const levels = [...scale.levels].sort((a, b) => a.score - b.score);
   const cur = levels.find((l) => l.score === score);
   if (!cur) return "";

   const first = levels[0];
   const last = levels[levels.length - 1];
   const lowerIsBetter = last.value < first.value;
  
   const op = lowerIsBetter ? "ไม่เกิน" : "ไม่น้อยกว่า";
  
   // ------------- เริ่มแก้ตรงนี้ -------------
   
   // 1. รวม Logic การหา unit ดิบ เป็นบรรทัดเดียว (ถ้ามี currentUnit ให้ใช้ก่อน, ถ้าไม่มีให้ดูใน scale, ถ้าไม่มีให้ดูใน level)
   const rawUnit = currentUnit || (scale as any)?.unit || cur.unit || "";

   // 2. แปลงเป็นภาษาไทย
   const displayUnit = UNIT_LABEL_MAP[rawUnit] || rawUnit;
   
   // 3. แก้บรรทัด return ให้ใช้ตัวแปร displayUnit (ไม่ใช่ cur.unit)
   return `ต้องทำได้${op} ${cur.value} ${displayUnit}`;

   // ------------- จบส่วนที่แก้ -------------
}

export default function KpiScoreInput({
	mode,
	kpiType,
	score,
	criteria = [],
	checkedIds = [],
	scale,
	onScoreChange,
	onCheckedIdsChange,
}: {
	mode: "view" | "edit";
	kpiType: KpiType;
	score: number | "";
	criteria?: ChecklistCriterion[];
	checkedIds?: string[];
	scale?: QuantScale;
	onScoreChange: (next: number | "") => void;
	onCheckedIdsChange?: (next: string[]) => void;
}) {
	if (kpiType !== "qualitative") {
		// quantitative/custom
	
		return mode === "edit" ? (
			<div className="text-center">
				<input
					type="number"
					min={0}
					max={5}
					step={1}
					className="w-10 bg-transparent outline-none text-center border border-myApp-blueDark rounded-lg py-0.5"
					value={score}
					onChange={(e) => {
						const v = e.target.value;
						if (v === "") return onScoreChange("");
						const n = Number(v);
						if (!Number.isFinite(n)) return;
						onScoreChange(Math.max(0, Math.min(5, Math.round(n))));
					}}
					placeholder="-"
				/>
			</div>
		) : (
			<div className="text-center flex justify-center">
				<div className="w-10 text-center border border-myApp-blueDark rounded-lg py-0.5">
					{score === "" ? "-" : score}
				</div>
			</div>
		);
	}

	// qualitative
	const set = new Set(checkedIds);

	// view: checkbox
	if (mode === "view") {
		if (criteria.length === 0) return <span>-</span>;

		return (
			<div className="flex flex-wrap justify-center gap-2">
				{criteria.map((c, idx) => {
					const checked = set.has(c.id);
					return (
					<div key={c.id} className="flex flex-1 gap-1 items-center">
						<p className="text-myApp-blue text-smallTitle font-medium">{idx + 1}</p>
			
						<div
						title={`ข้อที่ ${idx + 1} (${c.weight}%)`}
						className={`
							h-4 w-4 rounded border flex items-center justify-center
							${checked ? "bg-myApp-blueDark border-myApp-blueDark" : "bg-myApp-white border-myApp-blueDark"}
						`}
						aria-hidden
						>
							{checked && <FiCheck className="text-myApp-cream text-xs" />}
						</div>
					</div>
					);
				})}
			</div>
		);
	}

	// edit: checkbox
	return (
		<div className="flex flex-wrap justify-center gap-2">
		{criteria.length === 0 ? (
			<span className="text-myApp-blueDark">yyy</span>
		) : (
			criteria.map((c, idx) => {
			const checked = set.has(c.id);
			return (
				<div key={c.id} className="flex flex-1 gap-1">
					<p className="text-myApp-blue text-smallTitle font-medium">{idx + 1}</p>
					<CheckBox
						checked={checked}
						title={`ข้อที่ ${idx + 1} (${c.weight}%)`}
						onChange={(nextChecked) => {
							const next = new Set(checkedIds);
							if (nextChecked) next.add(c.id);
							else next.delete(c.id);
							onCheckedIdsChange?.(Array.from(next));
						}}
					/>
				</div>
			);
			})
		)}
		</div>
	);
}