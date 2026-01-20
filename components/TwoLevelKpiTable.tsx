"use client";

import React, { useState } from "react";
import { FiChevronDown, FiChevronRight, FiPlusCircle, FiTrash2, FiArrowUp, FiArrowDown, FiCheck } from "react-icons/fi";
import KpiDetailsBar, { type KpiType } from "./KpiDetailsBar";
import ScoreBoxForQuantitativeKpi from "./ScoreBoxForQuantitativeKpi";

type ChildRow = {
  id: string;
  name: string;
  weight: number;
  relation: string;
};

type ParentRow = {
  id: string;
  name: string;
  weight: number;
  relation: string;
  children: ChildRow[];
  expanded: boolean;
};

const uid = () => Math.random().toString(36).slice(2, 10);

function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
	return (
	  <button
		type="button"
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

export default function TwoLevelKpiTable({ mode, showAllDetails, selectable = false, }: {
	mode: "view" | "edit";
	showAllDetails: boolean;
	selectable: boolean;
  }) {

	const [rows, setRows] = useState<ParentRow[]>([
		{
		id: "p1",
		name: "1. การบริหารจัดการเพื่อสร้างคุณค่าเชิงเศรษฐศาสตร์ (EVM)",
		weight: 60,
		relation: "xx",
		expanded: true,
		children: [
			{ id: "c1", name: "1.1 วันที่ส่งรายงานเหตุผลประกอบการเบิกจ่าย", weight: 50, relation: "xx" },
			{ id: "c2", name: "1.2 ร้อยละของการลดค่าใช้จ่ายที่ควบคุมได้เทียบกับงบประมาณ", weight: 50, relation: "xx" },
		],
		},
		{
		id: "p2",
		name: "2. ความสามารถในการบริหารแผนลงทุน",
		weight: 40,
		relation: "xx",
		expanded: true,
		children: [
			{ id: "c3", name: "2.1 ปรับปรุงแผนการลงทุนให้สอดคล้องกับงบประมาณ", weight: 60, relation: "xx" },
			{ id: "c4", name: "2.2 ค่าเฉลี่ยของร้อยละการเบิกจ่ายของลงทุน", weight: 40, relation: "xx" },
		],
		},
	]);

	const [selected, setSelected] = useState<Set<string>>(new Set());
	const isSelected = (id: string) => selected.has(id);
	const toggleId = (id: string, checked: boolean) => {
		setSelected(prev => {
			const next = new Set(prev);
			if (checked) next.add(id);
			else next.delete(id);
			return next;
		});
	};

	const toggleParentSelect = (parentId: string, checked: boolean) => {
		setSelected(prev => {
			const next = new Set(prev);
			const p = rows.find(x => x.id === parentId);
			if (!p) return next;

			if (checked) {
			next.add(parentId);
			p.children.forEach(c => next.add(c.id));
			} else {
			next.delete(parentId);
			p.children.forEach(c => next.delete(c.id));
			}
			return next;
		});
	};

	const toggleChildSelect = (parentId: string, childId: string, checked: boolean) => {
		setSelected(prev => {
			const next = new Set(prev);
			if (checked) next.add(childId);
			else next.delete(childId);

			const p = rows.find(x => x.id === parentId);
			if (!p) return next;

			const allChildrenSelected = p.children.every(c => next.has(c.id));
			if (allChildrenSelected) next.add(parentId);
			else next.delete(parentId);

			return next;
		});
	};

	const colClass = mode === "edit"
		? "grid grid-cols-[1fr_100px_110px_48px] items-center"
		: "grid grid-cols-[1fr_100px_110px] items-center";

	const toggleExpand = (parentId: string) => {
		setRows(prev =>
		prev.map(p => (p.id === parentId ? { ...p, expanded: !p.expanded } : p))
		);
	};

	const addParent = () => {
		setRows(prev => [
		...prev,
		{
			id: `p_${uid()}`,
			name: "",
			weight: 0,
			relation: "",
			expanded: true,
			children: [],
		},
		]);
	};

	const addChild = (parentId: string) => {
		setRows(prev =>
		prev.map(p =>
			p.id === parentId
			? {
				...p,
				expanded: true,
				children: [
					...p.children,
					{ id: `c_${uid()}`, name: "", weight: 0, relation: "" },
				],
				}
			: p
		)
		);
	};

	const updateParent = (parentId: string, patch: Partial<ParentRow>) => {
		setRows(prev => prev.map(p => (p.id === parentId ? { ...p, ...patch } : p)));
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

	const deleteParent = (parentId: string) => {
		setRows(prev => prev.filter(p => p.id !== parentId));
	};

	const deleteChild = (parentId: string, childId: string) => {
		setRows(prev =>
		prev.map(p =>
			p.id === parentId ? { ...p, children: p.children.filter(c => c.id !== childId) } : p
		)
		);
	};

	function moveItem<T>(arr: T[], from: number, to: number) {
		if (to < 0 || to >= arr.length) return arr;
		const next = arr.slice();
		const [item] = next.splice(from, 1);
		next.splice(to, 0, item);
		return next;
	}

	const moveParent = (parentId: string, dir: "up" | "down") => {
		setRows((prev) => {
		const idx = prev.findIndex((p) => p.id === parentId);
		const to = dir === "up" ? idx - 1 : idx + 1;
		return moveItem(prev, idx, to);
		});
  	};

	const moveChild = (parentId: string, childId: string, dir: "up" | "down") => {
		setRows((prev) =>
		prev.map((p) => {
			if (p.id !== parentId) return p;
	
			const idx = p.children.findIndex((c) => c.id === childId);
			const to = dir === "up" ? idx - 1 : idx + 1;
	
			return {
			...p,
			children: moveItem(p.children, idx, to),
			};
		})
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
			<div>ความสัมพันธ์</div>
			{mode === "edit" && <div />}
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
				
					{selectable && (
					<CheckBox
						checked={isSelected(p.id)}
						onChange={(ck) => toggleParentSelect(p.id, ck)}
					/>
					)}

					<button
						type="button"
						onClick={() => toggleExpand(p.id)}
						className="p-1 rounded-xl hover:bg-myApp-shadow/40 transition"
						title="ขยาย/ย่อ"
					>
						{p.expanded ? <FiChevronDown /> : <FiChevronRight />}
					</button>

					{mode === "edit" ? (
						<input
						className="w-full bg-transparent outline-none"
						value={p.name}
						onChange={(e) => updateParent(p.id, { name: e.target.value })}
						placeholder="กรอกตัวชี้วัดระดับ 1"
						/>
					) : (
						<span className="text-body font-medium">{p.name}</span>
					)}
				</div>

				<div className="flex items-center justify-center text-myApp-blueDark">
				  {mode === "edit" ? (
					<input
					  type="number"
					  className="w-full bg-transparent outline-none text-center"
					  value={p.weight}
					  onChange={(e) => updateParent(p.id, { weight: Number(e.target.value) })}
					/>
				  ) : (
					<span className="text-body font-medium">{p.weight}%</span>
				  )}
				</div>

				<div className="flex items-center justify-center text-myApp-blueDark">
				  {mode === "edit" ? (
					<input
					  className="w-full bg-transparent outline-none text-center"
					  value={p.relation}
					  onChange={(e) => updateParent(p.id, { relation: e.target.value })}
					/>
				  ) : (
					<span>{p.relation}</span>
				  )}
				</div>

				{/* actions */}
				<div className="flex items-center justify-end text-myApp-shadow">
				  {mode === "edit" && (
					<>
					  <button 
					  	onClick={() => moveParent(p.id, "down")}
					  	className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
						<FiArrowDown className="text-lg scale-x-80" />
					  </button>
					  <button
					  	onClick={() => moveParent(p.id, "up")} 
					  	className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
						<FiArrowUp className="text-lg scale-x-80" />
					  </button>
					  <button
						type="button"
						onClick={() => deleteParent(p.id)}
						className="flex items-center justify-center rounded-lg hover:bg-myApp-red/10 text-myApp-shadow"
						title="ลบระดับ 1"
					  >
						<FiTrash2 className="text-lg" />
					  </button>
					</>
				  )}
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

							{selectable && (
							<CheckBox
								checked={isSelected(c.id)}
								onChange={(ck) => toggleChildSelect(p.id, c.id, ck)}
							/>
							)}

							{mode === "edit" ? (
							<input
								className="w-full bg-transparent outline-none"
								value={c.name}
								onChange={(e) => updateChild(p.id, c.id, { name: e.target.value })}
								placeholder="กรอกตัวชี้วัดระดับ 2"
							/>
							) : (
							<span className="font-medium">{c.name}</span>
							)}
						</div>

						<div className="flex items-center justify-center text-myApp-blueLight">
							{mode === "edit" ? (
							<input
								type="number"
								className="w-full bg-transparent outline-none text-center"
								value={c.weight}
								onChange={(e) => updateChild(p.id, c.id, { weight: Number(e.target.value) })}
							/>
							) : (
							<span className="font-semibold">{c.weight}%</span>
							)}
						</div>

						<div className="flex items-center justify-center text-myApp-blueDark">
							{mode === "edit" ? (
							<input
								className="w-full bg-transparent outline-none text-center"
								value={c.relation}
								onChange={(e) => updateChild(p.id, c.id, { relation: e.target.value })}
							/>
							) : (
							<span>{c.relation}</span>
							)}
						</div>

						<div className="flex items-center justify-end text-myApp-shadow">
							{mode === "edit" && (
							<>
								<button 
									onClick={() => moveChild(p.id, c.id, "down")}
									className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
									<FiArrowDown className="text-lg scale-x-80" />
								</button>
								<button 
									onClick={() => moveChild(p.id, c.id, "up")}
									className="flex items-center justify-center rounded-lg hover:bg-myApp-blue/10">
									<FiArrowUp className="text-lg scale-x-80" />
								</button>
								<button
								type="button"
								onClick={() => deleteChild(p.id, c.id)}
								className="flex items-center justify-center rounded-lg hover:bg-myApp-red/10"
								title="ลบระดับ 2"
								>
								<FiTrash2 className="text-lg" />
								</button>
							</>
							)}
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

				{/* if in 'edit' mode, show add button */}
				{mode === "edit" && (
				<button
				  type="button"
				  onClick={() => addChild(p.id)}
				  className="ml-10 inline-flex items-center gap-2 text-myApp-blueDark hover:opacity-80"
				>
				  <FiPlusCircle className="text-xl" />
				</button>
				)}
			  </div>
			)}
		  </div>
		))}

		{/* if in 'edit' mode, show add button */}
		{mode === "edit" && (
		<button
		  type="button"
		  onClick={addParent}
		  className="inline-flex items-center gap-2 text-myApp-blueDark hover:opacity-80"
		>
		  <FiPlusCircle className="text-xl" />
		</button>
		)}
	  </div>
	</div>
  );
}