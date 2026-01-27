import React from "react";
import { FiCheck } from "react-icons/fi";

export type KpiType = "quantitative" | "qualitative" | "custom" | null;

type ChecklistCriterion = { id: string; weight: number };

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

export default function KpiScoreInput({
	mode,
	kpiType,
	score,
	criteria = [],
	checkedIds = [],
	onScoreChange,
	onCheckedIdsChange,
}: {
	mode: "view" | "edit";
	kpiType: KpiType;
	score: number | "";
	criteria?: ChecklistCriterion[];
	checkedIds?: string[];
	onScoreChange: (next: number | "") => void;
	onCheckedIdsChange?: (next: string[]) => void;
}) {
	if (kpiType !== "qualitative") {
		// quantitative/custom
		return mode === "edit" ? (
		<input
			type="number"
			min={0}
			max={5}
			step={1}
			className="w-full bg-transparent outline-none text-center"
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
		) : (
		<span>{score === "" ? "-" : score}</span>
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