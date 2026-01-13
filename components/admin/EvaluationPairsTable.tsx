"use client";
import React from "react";
import { FiUser } from "react-icons/fi";

export type PersonRow = {
	id: string;
	employeeNo: string;
	name: string;
	position: string;
	level: string;
};

export type EvaluationGroup = {
	evaluator: PersonRow;
	evaluatees: PersonRow[];
};

type Props = {
	groups: EvaluationGroup[];
	className?: string;
  
	selectedIndex?: number;
	onSelectGroup?: (index: number, group: EvaluationGroup) => void;
};

function Avatar() {
  return (
	<div className="w-9 h-9 rounded-full border-2 border-myApp-blueDark flex items-center justify-center">
	  <FiUser className="text-myApp-blueDark text-lg" />
	</div>
  );
}

function Row({ p }: { p: PersonRow }) {
  return (
	<div className="grid grid-cols-[90px_1.3fr_1fr_74px] items-center gap-2">
		<div className="flex gap-2 items-center">
			<Avatar />
			<div className="text-myApp-blueDark font-medium">{p.employeeNo}</div>
		</div>
		<div className="text-myApp-blueDark font-medium">{p.name}</div>
		<div className="text-myApp-blueDark font-medium">{p.position}</div>
		<div className="text-myApp-blueDark font-medium">{p.level}</div>
	</div>
  );
}

function HeaderCols() {
  return (
	<div className="grid grid-cols-[90px_1.3fr_1fr_74px] text-left items-center gap-1 text-myApp-cream text-body">
	  <div>หมายเลข</div>
	  <div>ชื่อ</div>
	  <div>ตำแหน่ง</div>
	  <div>ระดับ</div>
	</div>
  );
}

export default function EvaluationPairsTable({
	groups,
	className = "",
	selectedIndex,
	onSelectGroup,
  }: Props) {
	
  return (
	<div className={`w-full ${className} flex flex-col`}>
		{/* Top header bar (2 sides) */}
		<div className="rounded-3xl bg-myApp-blue px-6 py-3 shrink-0">
			<div className="grid grid-cols-2 gap-6 relative">
				<div className="text-center text-myApp-cream font-semibold text-body-changed">
					ผู้ประเมิน
					<div className="mt-3 pt-2">
						<div className="absolute -left-2 top-1/2 w-[50%] h-0.75 bg-myApp-blueLight rounded-full" />
						<HeaderCols />
					</div>
				</div>

				{/* center divider */}
				<div className="absolute left-1/2 top-0 h-full w-0.75 bg-myApp-blueLight rounded-full" />

				<div className="text-center text-myApp-cream font-semibold text-body-changed">
					ผู้รับการประเมิน
					<div className="mt-3 pt-2">
						<div className="absolute top-1/2 w-[50%] h-0.75 bg-myApp-blueLight rounded-full" />
						<HeaderCols />
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
						bg-white rounded-xl px-6 py-4
						shadow-sm cursor-pointer transition
						${isActive ? "ring-2 ring-myApp-blue" : "hover:shadow-md"}
						`}
					>
						<div className="grid grid-cols-2 gap-6 relative">
							{/* left: evaluator (single row) */}
							<div>
								<Row p={g.evaluator} />
							</div>

							{/* right: evaluatees (multi rows) */}
							<div>
								{g.evaluatees.map((p, i) => (
								<div key={i} className={i === 0 ? "" : "pt-2"}>
									<Row p={p} />
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