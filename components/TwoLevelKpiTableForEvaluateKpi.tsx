"use client";
import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import KpiDetailsBar, { type KpiType } from "./KpiDetailsBar";
import ScoreBoxForQuantitativeKpi from "./ScoreBoxForQuantitativeKpi";
import KpiScoreInput from "./user/KpiScoreInput";

type ChecklistCriterion = {
	id: string;
	weight: number;
};

type ChildRow = {
	id: string;
	name: string;
	weight: number;
	relation: string;
	kpiType: KpiType;
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

export default function TwoLevelKpiTableForEvaluateKpi({ mode, showAllDetails }: {
	mode: "view" | "edit";
	showAllDetails: boolean;
  }) {

	const [rows, setRows] = useState<ParentRow[]>([
		{
		id: "p1",
		name: "1. การบริหารจัดการเพื่อสร้างคุณค่าเชิงเศรษฐศาสตร์ (EVM)",
		weight: 60,
		relation: "xx",
		expanded: true,
		children: [
			{ 	id: "c1",
				name: "1.1 วันที่ส่งรายงานเหตุผลประกอบการเบิกจ่าย",
				weight: 50,
				kpiType: "quantitative",
				score: "",
				relation: "xx" },
			{ 	id: "c2",
				name: "1.2 ร้อยละของการลดค่าใช้จ่ายที่ควบคุมได้เทียบกับงบประมาณ",
				weight: 50,
				kpiType: "quantitative",
				score: "",
				relation: "xx" },
		],
		},
		{
		id: "p2",
		name: "2. ความสามารถในการบริหารแผนลงทุน",
		weight: 40,
		relation: "xx",
		expanded: true,
		children: [
			{ 	id: "c3",
				name: "2.1 ปรับปรุงแผนการลงทุนให้สอดคล้องกับงบประมาณ",
				weight: 60,
				kpiType: "qualitative",
				score: "",
				criteria: [
					{ id: "crit-1", weight: 10 },
					{ id: "crit-2", weight: 20 },
					{ id: "crit-3", weight: 30 },
					{ id: "crit-4", weight: 40 },
				],
				checkedIds: [],
				relation: "xx" },
			{ 	id: "c4",
				name: "2.2 ค่าเฉลี่ยของร้อยละการเบิกจ่ายของลงทุน",
				weight: 40,
				kpiType: "quantitative",
				score: "",
				relation: "xx" },
		],
		},
	]);

	const colClass = "grid grid-cols-[1fr_100px_100px_110px] items-center"

	const toggleExpand = (parentId: string) => {
		setRows(prev =>
		prev.map(p => (p.id === parentId ? { ...p, expanded: !p.expanded } : p))
		);
	};

	const updateChild = (parentId: string, childId: string, patch: Partial<ChildRow>) => {
		setRows(prev =>
		prev.map(p =>
			p.id === parentId
			? {
				...p,
				children: p.children.map(c => (c.id === childId ? { ...c, ...patch } : c)),
				}
			: p
		)
		);
	};

	// set default for details of kpi
	const [kpiType, setKpiType] = useState<KpiType | null>(null);
	const [unit, setUnit] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const [values, setValues] = useState<Record<1|2|3|4|5, number | "">>({
		1: "",
		2: "",
		3: "",
		4: "",
		5: "",
	});

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
			{rows.map((p) => (
			<div key={p.id}>
				{/* parent row */}
				<div className="bg-myApp-white rounded-xl shadow-sm px-4 py-3">
				<div className={`${colClass}`}>
					<div className="flex items-center gap-1 text-myApp-blueDark">

						<button
							type="button"
							onClick={() => toggleExpand(p.id)}
							className="p-1 rounded-xl hover:bg-myApp-shadow/40 transition"
							title="ขยาย/ย่อ"
						>
							{p.expanded ? <FiChevronDown /> : <FiChevronRight />}
						</button>

						<span className="text-body font-medium">{p.name}</span>
					</div>

					<div className="flex items-center justify-center text-myApp-blueDark">
						<span className="text-body font-medium">{p.weight}%</span>
					</div>

					<div></div>

					<div className="flex items-center justify-center text-myApp-blueDark">
						<span>{p.relation}</span>
					</div>
				</div>
				</div>

				{/* children */}
				{p.expanded && (
				<div className="mt-2 space-y-2">
					{p.children.map((c) => (
					<div key={c.id} className="bg-myApp-white rounded-xl shadow-sm px-4 py-3 ml-10">
						<div className={`${colClass}`}>
							<div className="text-myApp-blueDark flex gap-2">
								<span className="font-medium">{c.name}</span>
							</div>

							<div className="flex items-center justify-center text-myApp-blueLight">
								<span className="font-semibold">{c.weight}%</span>
							</div>

							<div className="flex items-center justify-center text-myApp-blueDark">
								{mode === "edit" ? (
								<KpiScoreInput
									mode={mode}
									kpiType={c.kpiType}
									score={c.score}
									criteria={c.criteria}
									checkedIds={c.checkedIds}
									onScoreChange={(next) => updateChild(p.id, c.id, { score: next })}
									onCheckedIdsChange={(next) => updateChild(p.id, c.id, { checkedIds: next })}
								/>
								) : (
								<span>{c.score === "" ? "-" : c.score}</span>
								)}
							</div>

							<div className="flex items-center justify-center text-myApp-blueDark">
								<span>{c.relation}</span>
							</div>
						</div>

						{showAllDetails && (
							<div className="mt-2 rounded-xl px-4">
								<KpiDetailsBar
									kpiType={kpiType}
									onKpiTypeChange={setKpiType}
									unit={unit}
									onUnitChange={setUnit}
									startDate={startDate}
									onStartDateChange={setStartDate}
									endDate={endDate}
									onEndDateChange={setEndDate}
								/>
								<ScoreBoxForQuantitativeKpi values={values} onChange={setValues} />
							</div>
						)}
					</div>
					))}

				</div>
				)}
			</div>
			))}

		</div>
	</div>
  );
}