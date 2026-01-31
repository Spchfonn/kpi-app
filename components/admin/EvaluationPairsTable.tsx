"use client";
import React from "react";
import { FiUser } from "react-icons/fi";

export type BasicInfoObj = {
	id: string;
	code: string;
	name: string;
	createdAt: string;
	updatedAt: string;
};

export type PersonRow = {
	id: string;
	employeeNo: string;
	name: string;
	lastName: string;
	position: BasicInfoObj | string;
	level: BasicInfoObj | string;
	weightPercent?: number;
};

export type EvaluationGroup = {
	evaluator: PersonRow;
	evaluatees: PersonRow[];
};

function Avatar() {
  return (
	<div className="w-9 h-9 rounded-full border-2 border-myApp-blueDark flex items-center justify-center">
	  <FiUser className="text-myApp-blueDark text-lg" />
	</div>
  );
}

function getLabel(v: string | BasicInfoObj) {
	return typeof v === "string" ? v : v?.name ?? "";
}

function RowWeight({ p }: { p: PersonRow }) {
  return (
	<div className="grid grid-cols-[118px_1.2fr_1fr_64px_75px] items-center gap-2">
		<div className="flex gap-2 items-center">
			<Avatar />
			<div className="text-myApp-blueDark font-medium">{p.employeeNo}</div>
		</div>
		<div className="text-myApp-blueDark font-medium">{p.name} {p.lastName}</div>
		<div className="text-myApp-blueDark font-medium">{getLabel(p.position)}</div>
		<div className="text-myApp-blueDark font-medium">{getLabel(p.level)}</div>
		<div className="text-myApp-blueDark font-medium text-center">{p.weightPercent}</div>
	</div>
  );
}

function Row({ p }: { p: PersonRow }) {
	return (
	  <div className="grid grid-cols-[118px_1.2fr_1fr_64px] items-center gap-2">
		  <div className="flex gap-2 items-center">
			  <Avatar />
			  <div className="text-myApp-blueDark font-medium">{p.employeeNo}</div>
		  </div>
		  <div className="text-myApp-blueDark font-medium">{p.name} {p.lastName}</div>
		  <div className="text-myApp-blueDark font-medium">{getLabel(p.position)}</div>
		  <div className="text-myApp-blueDark font-medium">{getLabel(p.level)}</div>
	  </div>
	);
}

function HeaderCols() {
  return (
	<div className="grid grid-cols-[118px_1.2fr_1fr_64px] text-left items-center gap-1 text-myApp-cream text-body">
	  <div className="text-center">หมายเลข</div>
	  <div>ชื่อ</div>
	  <div>ตำแหน่ง</div>
	  <div>ระดับ</div>
	</div>
  );
}

function HeaderColsWeight() {
	return (
	  <div className="grid grid-cols-[118px_1.2fr_1fr_64px_75px] text-left items-center gap-1 text-myApp-cream text-body">
		<div className="text-center">หมายเลข</div>
		<div>ชื่อ</div>
		<div>ตำแหน่ง</div>
		<div>ระดับ</div>
		<div>ค่าน้ำหนัก(%)</div>
	  </div>
	);
}  

type Props = {
	groups: EvaluationGroup[];
	className?: string;
  
	selectedIndex?: number;
	onSelectGroup?: (index: number, group: EvaluationGroup) => void;
	groupBy?: "evaluator" | "evaluatee";
};

export default function EvaluationPairsTable({
	groups,
	className = "",
	selectedIndex,
	onSelectGroup,
	groupBy = "evaluator",
  }: Props) {
	
  return (
	<div className={`w-full ${className} flex flex-col`}>
		{/* Top header bar (2 sides) */}
		<div className="rounded-3xl bg-myApp-blue px-4 py-3 shrink-0">
			<div className={`grid gap-6 relative ${ groupBy === "evaluator" ? "grid-cols-2" : "grid-cols-[4fr_5fr]" }`}>
				<div className="text-center text-myApp-cream font-semibold text-body-changed">
					{ groupBy === "evaluator" ? "ผู้ประเมิน" : "ผู้รับการประเมิน" }
					<div className="mt-3 pt-2">
						<div className={`absolute -left-2 top-1/2 h-0.75 bg-myApp-blueLight rounded-full
										${ groupBy === "evaluator" ? "w-[50%]" : "w-[44%]" }`} />
						<HeaderCols />
					</div>
				</div>

				{/* center divider */}
				<div className={`absolute top-0 h-full w-0.75 bg-myApp-blueLight rounded-full
								${ groupBy === "evaluator" ? "left-1/2" : "left-71/160" }`} />

				<div className="text-center text-myApp-cream font-semibold text-body-changed">
					{ groupBy === "evaluator" ? "ผู้รับการประเมิน" : "ผู้ประเมิน" }
					<div className="mt-3 pt-2">
						<div className={`absolute top-1/2 h-0.75 bg-myApp-blueLight rounded-full
										${ groupBy === "evaluator" ? "w-[50%]" : "w-[55%]" }`} />
						{ groupBy === "evaluator" ? <HeaderCols /> : <HeaderColsWeight /> }
					</div>
				</div>

			</div>
		</div>

		{/* Groups */}
		<div className="mt-2 space-y-2 text-body-changed font-medium overflow-y-auto max-h-126">
			{groups.map((g, idx) => {
				const isActive = idx === selectedIndex;
				return (
					<div
						key={idx}
						role="button" 
						onClick={() => onSelectGroup?.(idx, g)}
						className={`
						bg-white rounded-xl px-4 py-3
						shadow-sm cursor-pointer transition
						${isActive ? "ring-2 ring-myApp-blue" : "hover:shadow-md"}
						`}
					>
						<div className={`grid gap-6 relative ${ groupBy === "evaluator" ? "grid-cols-2" : "grid-cols-[4fr_5fr]" }`}>
							{/* left: evaluator (single row) */}
							<div>
								<Row p={g.evaluator} />
							</div>

							{/* right: evaluatees (multi rows) */}
							<div>
								{g.evaluatees.map((p, i) => (
								<div key={i} className={i === 0 ? "" : "pt-2"}>
									{ groupBy === "evaluator" ? <Row p={p} /> : <RowWeight p={p} /> }
								</div>
								))}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	</div>
  );
}