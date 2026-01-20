import React from "react";
import type { KpiType } from "../KpiDetailsBar";
import { FiCheck } from "react-icons/fi";

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
			h-4 w-4 rounded
			border
			flex items-center justify-center
			cursor-pointer transition
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

	// (ถ้าอยากโชว์สรุปใน view)
	if (mode === "view") {
		const total = criteria.length;
		const done = criteria.filter((c) => set.has(c.id)).length;
		const weightSum = criteria.reduce((acc, c) => (set.has(c.id) ? acc + c.weight : acc), 0);
		return <span>{total === 0 ? "-" : `${done}/${total} (${weightSum}%)`}</span>;
	}

	// edit: checkbox
	return (
		<div className="flex flex-wrap justify-center gap-2">
		{criteria.length === 0 ? (
			<span className="text-myApp-blueDark">-</span>
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