"use client";
import React, { useEffect } from "react";
import { FiPlusCircle, FiTrash2 } from "react-icons/fi";

export type QualitativeItem = {
	id: number;
	title: string;
	weight: number | "";
};  

type Props = {
	mode: "view" | "edit";
	title?: string;
	items: QualitativeItem[];
	onChange?: (items: QualitativeItem[]) => void;
	onValidityChange?: (isValid: boolean) => void;
};

export default function ScoreBoxForQualitativeKpi({
		mode,
		title = "อันดับ",
		items,
		onChange,
		onValidityChange,
	}: Props) {

	const isEditable = mode === "edit" && !!onChange;

	const updateItem = (idx: number, patch: Partial<QualitativeItem>) => {
		if (!onChange) return;
		const next = [...items];
		next[idx] = { ...next[idx], ...patch };
		onChange(next);
	};

	const addItem = () => {
		if (!onChange) return;
		onChange([
			...items,
			{
				id: items.length + 1,
				title: "",
				weight: "",
			},
		]);
	};

	const removeItem = (idx: number) => {
		if (!onChange) return;
		const next = items.filter((_, i) => i !== idx);
		const normalized = next.map((it, i) => ({ ...it, id: i + 1 }));
		onChange(normalized);
	};

	const totalWeight = items.reduce((sum, it) => sum + (Number(it.weight) || 0), 0);

	useEffect(() => {
    if (onValidityChange) {
      const isValid = totalWeight === 100;
      onValidityChange(isValid);
    }
  }, [totalWeight, onValidityChange]);
	return (
		<div className="inline-block">
			<div className="grid grid-cols-[24px_2px_500px_20px_56px_30px] text-myApp-blueDark text-smallTitle font-medium mb-1">
				<div>{title}</div>
				<div />
				<div />
				<div />
        		<div className="text-center">
					ค่าน้ำหนัก
				</div>
        		<div>
					{mode === "edit" && (
						<div className={`ml-1 text-[10px] ${totalWeight === 100 ? "text-myApp-green" : "text-myApp-red"}`}>
							{totalWeight}%
						</div>
					)}
				</div>
			</div>

			<div className="relative">
				{/* vertical line (เส้นเดียวตลอด) */}
				<div className="absolute left-4 top-0 bottom-0 w-0.5 bg-myApp-blue rounded-full" />

				{/* rows */}
				<div className="space-y-2">
					{items.map((it, idx) => (
						<div
							key={it.id}
							className="grid grid-cols-[24px_2px_500px_20px_56px_30px] items-center"
						>
							{/* index */}
							<div className="text-myApp-blueDark text-smallTitle font-medium">
								{idx + 1}
							</div>

							<div />

							{/* description */}
							<input
								value={it.title}
								disabled={!isEditable}
								onChange={(e) => updateItem(idx, { title: e.target.value })}
								className="w-full bg-transparent outline-none border-b-2 border-myApp-shadow
										text-myApp-blueDark text-smallTitle font-medium pb-0.5"
							/>

							<div></div>

							{/* weight */}
							<div className="flex items-center justify-end gap-1">
								<input
									inputMode="numeric"
									value={it.weight}
									disabled={!isEditable}
									onChange={(e) =>
										updateItem(idx, {
											weight: e.target.value === ""
											? ""
											: Number(e.target.value),
										})
									}
									className="w-12 bg-transparent outline-none text-right border-b-2 border-myApp-shadow
											text-myApp-blueDark text-smallTitle font-medium"
								/>
								<span className="text-myApp-blueDark text-smallTitle font-medium">%</span>
							</div>

							{/* remove button */}
							{mode === "edit" ? (
								<button
									type="button"
									onClick={() => removeItem(idx)}
									className="ml-3 text-myApp-grey hover:opacity-80 items-center justify-center"
								>
									<FiTrash2 className="text-sm" />
								</button>
								):
								(<div></div>)
							}
						</div>
					))}
				</div>
			</div>

			{/* add button */}
			{mode === "edit" && (
				<button
					type="button"
					onClick={addItem}
					className="mt-2 text-myApp-blueDark hover:opacity-80"
				>
					<FiPlusCircle className="text-sm" />
				</button>
			)}
			
		</div>
	);
}