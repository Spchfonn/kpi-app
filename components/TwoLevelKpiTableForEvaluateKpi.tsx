"use client";
import { useMemo, useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import KpiDetailsBar, { type KpiTypeChoice } from "./KpiDetailsBar";
import ScoreBoxForQuantitativeKpi from "./ScoreBoxForQuantitativeKpi";
import KpiScoreInput from "./user/KpiScoreInput";
import ScoreBoxForCustomKpi from "./ScoreBoxForCustomKpi";
import ScoreBoxForQualitativeKpi from "./ScoreBoxForQualitativeKpi";

type ChecklistCriterion = {
	id: string;
	weight: number;
};

type ChildRow = {
	id: string;
	name: string;
	weight: number;
	relation: string;
	kpiTypes: KpiTypeChoice;
	score: number | "";

	// qualitative
	criteria?: ChecklistCriterion[];
	checkedIds?: string[];  
};

type ParentRow = {
	id: string;
	name: string;
	weight: number;
	relation: string;
	children: ChildRow[];
	expanded: boolean;
};

export type KpiTreeNode = {
	id?: string;
	clientId?: string;
	nodeType: "GROUP" | "ITEM";
	title: string;
	weightPercent: number;
  
	typeId?: string | null;
	type?: { id: string; type: "QUANTITATIVE"|"QUALITATIVE"|"CUSTOM"; name: string; rubric?: any } | null;
	unit?: string | null;
	startDate?: string | null;
	endDate?: string | null;
  
	children: KpiTreeNode[];
	displayNo?: string;
};

const nodeKey = (n: KpiTreeNode) => n.id ?? n.clientId!;

export type EvalScoreState = {
	score: number | "";
	checkedIds?: string[];
};

type Props = {
	mode: "view" | "edit";
	readOnlyDetails?: boolean;
	showAllDetails: boolean;
  
	tree: KpiTreeNode[];
  
	scores: Record<string, EvalScoreState>; // key = nodeKey(item)
	onChangeScores: React.Dispatch<React.SetStateAction<Record<string, EvalScoreState>>>;
};

function toLegacyKpiType(t?: "QUANTITATIVE"|"QUALITATIVE"|"CUSTOM" | null) {
	if (t === "QUANTITATIVE") return "quantitative";
	if (t === "QUALITATIVE") return "qualitative";
	if (t === "CUSTOM") return "custom";
	return null;
}

export default function TwoLevelKpiTableForEvaluateKpi({
	mode,
	readOnlyDetails = true,
	showAllDetails,
	tree,
	scores,
	onChangeScores
  }: Props) {

	const colClass = "grid grid-cols-[1fr_100px_100px_110px] items-center"

	const detailsMode: "view" | "edit" = readOnlyDetails ? "view" : mode;

	const [expanded, setExpanded] = useState<Record<string, boolean>>({});
	const isExpanded = (key: string) => expanded[key] ?? true;

	const toggleExpand = (parentKey: string) => {
		setExpanded((prev) => ({ ...prev, [parentKey]: !isExpanded(parentKey) }));
	};

	const setItemScore = (itemKey: string, patch: Partial<EvalScoreState>) => {
		onChangeScores((prev) => ({
			...prev,
			[itemKey]: { ...(prev[itemKey] ?? { score: "", checkedIds: [] }), ...patch },
		}));
	};

	const renderRubric = (t?: any) => {
		const rubric = t?.rubric;
		if (!rubric) return null;
		
		switch (rubric.kind) {
			case "QUANTITATIVE_1_TO_5":
				return (
					<ScoreBoxForQuantitativeKpi
						mode={detailsMode}
						levels={rubric.levels}
					/>
				);
		
			case "QUALITATIVE_CHECKLIST":
				return (
					<ScoreBoxForQualitativeKpi
						mode={detailsMode}
						items={rubric.checklist.map((x: any, i: number) => ({
							id: i + 1,
							title: x.item,
							weight: x.weight_percent,
						}))}
						onChange={() => {}}
					/>
				);
		
			case "CUSTOM_DESCRIPTION_1_TO_5":
				return (
					<ScoreBoxForCustomKpi
						mode={detailsMode}
						levels={rubric.levels}
					/>
				);
		
			default:
				return null;
		}
	};

	return (
		<div className="w-full">
			{/* header */}
			<div className="sticky top-0 z-20 bg-myApp-cream">
				<div className="bg-myApp-blue rounded-3xl shadow-sm px-4 py-4 text-myApp-cream text-button font-semibold">
					<div className={`${colClass} place-items-center`}>
						<div>ตัวชี้วัด</div>
						<div>ค่าน้ำหนัก</div>
						<div>คะแนน</div>
						<div>ความสัมพันธ์</div>
					</div>
				</div>
			</div>

			{/* rows */}
			<div className="mt-2 space-y-2 text-body-changed font-medium">
				{tree.map((p) => {
					const pKey = nodeKey(p);
					return (
						<div key={pKey}>
							{/* parent row */}
							<div className="bg-myApp-white rounded-xl shadow-sm px-4 py-3">
								<div className={`${colClass}`}>
									<div className="flex items-center gap-1 text-myApp-blueDark">

										<button
											type="button"
											onClick={() => toggleExpand(pKey)}
											className="p-1 rounded-xl hover:bg-myApp-shadow/40 transition"
											title="ขยาย/ย่อ"
										>
											{isExpanded(pKey) ? <FiChevronDown /> : <FiChevronRight />}
										</button>

										<span className="text-body font-medium">
											{(p.displayNo ? `${p.displayNo}. ` : "") + p.title}
										</span>
									</div>

									<div className="flex items-center justify-center text-myApp-blueDark">
										<span className="text-body font-medium">{p.weightPercent}%</span>
									</div>

									<div></div>

									<div className="flex items-center justify-center text-myApp-blueDark">
										{/* <span>{p.relation}</span> */}
									</div>
								</div>
							</div>

							{/* children */}
							{isExpanded(pKey) && (
								<div className="mt-2 space-y-2">
									{p.children.map((c) => {
										const cKey = nodeKey(c);
										const t = c.type ?? null;
										const detailsTypeId = t?.id ?? c.typeId ?? null;
										const detailsTypes = t ? [{ id: t.id, type: t.type, name: t.name }] : [];
										const legacyType = toLegacyKpiType(t?.type ?? null);
										const s = scores[cKey] ?? { score: "", checkedIds: [] };

										const criteria = t?.rubric?.kind === "QUALITATIVE_CHECKLIST"
														? t.rubric.checklist.map((x: any, i: number) => ({
															id: String(i + 1),
															weight: Number(x.weight_percent ?? 0),
														}))
														: [];

										return (
											<div key={cKey} className="bg-myApp-white rounded-xl shadow-sm px-4 py-3 ml-10">
												<div className={`${colClass}`}>
													<div className="text-myApp-blueDark flex gap-2">
														<span className="font-medium">
															{(c.displayNo ? `${c.displayNo} ` : "") + c.title}
														</span>
													</div>

													<div className="flex items-center justify-center text-myApp-blueLight">
														<span className="font-semibold">{c.weightPercent}%</span>
													</div>

													<div className="flex items-center justify-center text-myApp-blueDark">
														<KpiScoreInput
															mode={mode}
															kpiType={legacyType}
															score={s.score}
															criteria={criteria}
															checkedIds={s.checkedIds ?? []}
															onScoreChange={(next) => setItemScore(cKey, { score: next })}
															onCheckedIdsChange={(next) => setItemScore(cKey, { checkedIds: next })}
														/>
													</div>

													<div className="flex items-center justify-center text-myApp-blueDark">
														{/* <span>{c.relation}</span> */}
													</div>
												</div>

												{showAllDetails && (
													<div className="flex flex-col mt-2 rounded-xl px-4 gap-1.5">
														<KpiDetailsBar
															mode={detailsMode}
															typeId={detailsTypeId}
															onTypeIdChange={() => {}}
															kpiTypes={detailsTypes}
															unit={c.unit ?? ""}
															onUnitChange={() => {}}
															startDate={c.startDate ?? ""}
															onStartDateChange={() => {}}
															endDate={c.endDate ?? ""}
															onEndDateChange={() => {}}
														/>
														{renderRubric(t)}
													</div>
												)}
											</div>
										)
									})}

								</div>
							)}
						</div>
					)
				})}

			</div>
		</div>
	);
}