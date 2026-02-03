"use client";
import Input from "@/components/InputField";
import type { EvalCycleForm } from "../types";
import DropDown from "@/components/DropDown";
import CycleGatesCards from "@/components/admin/CycleGatesCards";

type Props = {
	draft: EvalCycleForm;
	setDraft: (next: EvalCycleForm) => void;
	mode: "view" | "edit";
	kpiDefineModeValue: EvalCycleForm["kpiDefineMode"] | null;
	kpiDefineModeOptions: Array<{ value: EvalCycleForm["kpiDefineMode"]; label: string }>;
	onKpiDefineModeChange?: (v: EvalCycleForm["kpiDefineMode"]) => void;
	kpiLevelModeValue: EvalCycleForm["kpiLevelMode"] | null;
	kpiLevelModeOptions: Array<{ value: EvalCycleForm["kpiLevelMode"]; label: string }>;
	onKpiLevelModeChange?: (v: EvalCycleForm["kpiLevelMode"]) => void;
};

export default function BasicTab({ draft, setDraft, mode,
									kpiDefineModeValue, kpiDefineModeOptions, onKpiDefineModeChange,
									kpiLevelModeValue, kpiLevelModeOptions, onKpiLevelModeChange }: Props) {
	const disabled = mode === "view";

	return (
		<div className="flex flex-col gap-4">
			<Input
				label="ชื่อรอบการประเมิน*"
				value={draft.name}
				onChange={(e) => setDraft({ ...draft, name: e.target.value })}
				disabled={disabled}
			/>

			<Input
				label="ปีการประเมิน*"
				value={draft.year}
				onChange={(e) => {
					const v = e.target.value.trim();
					setDraft({ ...draft, year: v === "" ? 0 : Number(v) });
				}}
				disabled={disabled}
			/>

			<Input
				label="รอบการประเมิน*"
				value={draft.round}
				onChange={(e) => {
					const v = e.target.value.trim();
					setDraft({ ...draft, round: v === "" ? 0 : Number(v) });
				}}
				disabled={disabled}
			/>

			<Input
				label="วันเริ่มต้น*"
				type="date"
				value={draft.startDate}
				onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
				className={draft.startDate ? "" : "date-empty"}
				disabled={disabled}
			/>

			<Input
				label="วันสิ้นสุด*"
				type="date"
				value={draft.endDate}
				onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
				className={draft.endDate ? "" : "date-empty"}
				disabled={disabled}
			/>

			<div className="flex flex-col text-smallTitle font-medium text-myApp-blue gap-1">
				<p>โหมดการกำหนดตัวชี้วัด*</p>
				<DropDown
					className="w-full max-w-md"
					value={kpiDefineModeValue ?? null}
					onChange={(v) => onKpiDefineModeChange?.(v as EvalCycleForm["kpiDefineMode"])}
					options={kpiDefineModeOptions}
					disabled={disabled}
				/>
			</div>

			<div className="flex flex-col text-smallTitle font-medium text-myApp-blue gap-1">
				<p>รูปแบบการกำหนดตัวชี้วัด*</p>
				<DropDown
					className="w-full max-w-md"
					value={kpiLevelModeValue ?? null}
					onChange={(v) => onKpiLevelModeChange?.(v as EvalCycleForm["kpiLevelMode"])}
					options={kpiLevelModeOptions}
					disabled={disabled}
				/>
			</div>

			<CycleGatesCards
				value={draft.gates ?? { DEFINE: false, EVALUATE: false, SUMMARY: false }}
				onChange={(g) => setDraft({ ...draft, gates: g })}
				disabled={mode === "view"}
			/>

		</div>
	);
}