"use client";
import Input from "@/components/InputField";
import type { EvalCycleForm } from "../types";
import SystemStatusCards from "@/components/SystemStatusCards";
import DropDown from "@/components/DropDown";

type Props = {
	draft: EvalCycleForm;
	setDraft: (next: EvalCycleForm) => void;
	mode: "view" | "edit";
	filterValue: EvalCycleForm["kpiDefineMode"] | null;
	filterOptions: Array<{ value: EvalCycleForm["kpiDefineMode"]; label: string }>;
	onFilterChange?: (v: EvalCycleForm["kpiDefineMode"]) => void;
};

export default function BasicTab({ draft, setDraft, mode, filterValue, filterOptions, onFilterChange, }: Props) {
	const disabled = mode === "view";

	return (
		<div className="flex flex-col gap-4">
			<Input
				label="ชื่อรอบการประเมิน"
				value={draft.name}
				onChange={(e) => setDraft({ ...draft, name: e.target.value })}
				disabled={disabled}
			/>

			<Input
				label="ปีการประเมิน"
				value={draft.year}
				onChange={(e) => setDraft({ ...draft, name: e.target.value })}
				disabled={disabled}
			/>

			<Input
				label="รอบการประเมิน"
				value={draft.round}
				onChange={(e) => setDraft({ ...draft, name: e.target.value })}
				disabled={disabled}
			/>

			<Input
				label="วันเริ่มต้น"
				type="date"
				value={draft.startDate}
				onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
				className={draft.startDate ? "" : "date-empty"}
				disabled={disabled}
			/>

			<Input
				label="วันสิ้นสุด"
				type="date"
				value={draft.endDate}
				onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
				className={draft.endDate ? "" : "date-empty"}
				disabled={disabled}
			/>

			<div className="flex flex-col text-smallTitle font-medium text-myApp-blue gap-1">
				<p>โหมดการกำหนดตัวชี้วัด</p>
				<DropDown
					className="w-full max-w-md"
					value={filterValue ?? null}
					onChange={(v) => onFilterChange?.(v as EvalCycleForm["kpiDefineMode"])}
					options={filterOptions}
					disabled={disabled}
				/>
			</div>
			

			<SystemStatusCards
				active={draft.systemStatus}
				onChange={(k) => setDraft({ ...draft, systemStatus: k })}
				disabled={mode === "view"}
			/>
		</div>
	);
}