"use client";
import React, { useState } from "react";
import { FiTrash2, FiUser } from "react-icons/fi";
import ConfirmBox from "../ConfirmBox";

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

export type PairRow = PersonRow & { pairId: string };

export type EvaluationGroup = {
	evaluator: PersonRow;
	evaluatees: PairRow[];
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

	onDeletedAssignment?: (deletedAssignmentId: string) => void;
	canDelete?: boolean;

	onOpenGroup?: (group: EvaluationGroup) => void;
};

export default function EvaluationPairsTable({
	groups,
	className = "",
	selectedIndex,
	onSelectGroup,
	groupBy = "evaluator",
	onDeletedAssignment,
	canDelete = true,
	onOpenGroup,
  }: Props) {

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pending, setPending] = useState<{pairId: string; label: string;} | null>(null);
	const [deleting, setDeleting] = useState(false);

	function openDeleteConfirm(pairId: string, label: string) {
		setPending({ pairId, label });
		setConfirmOpen(true);
	}

	function cancelDelete() {
		if (deleting) return;
		setConfirmOpen(false);
		setPending(null);
	}

	async function confirmDelete() {
		if (!pending) return;

		setDeleting(true);
		try {
			const res = await fetch(`/api/evaluationAssignments/${pending.pairId}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			});

			const json = await res.json().catch(() => null);

			if (!res.ok) {
				alert(json?.message ?? `ลบไม่สำเร็จ (${res.status})`);
				return;
			}

			onDeletedAssignment?.(pending.pairId);

			setConfirmOpen(false);
			setPending(null);
		} catch (e: any) {
			alert(e?.message ?? "ลบไม่สำเร็จ");
		} finally {
			setDeleting(false);
		}
	}
	
  return (
	<div className={`w-full ${className} flex flex-col`}>
		{/* Top header bar (2 sides) */}
		<div className="rounded-3xl bg-myApp-blue px-4 py-3 shrink-0">
			<div className={`grid gap-6 ${groupBy === "evaluator"
				? "grid-cols-[1fr_2px_1fr]"
				: "grid-cols-[4fr_2px_5fr]"}`}>
				<div className="text-center text-myApp-cream font-semibold text-body-changed">
					{ groupBy === "evaluator" ? "ผู้ประเมิน" : "ผู้รับการประเมิน" }
					<div>
						{/* <div className={`absolute -left-2 top-1/2 h-0.75 bg-myApp-blueLight rounded-full
										${ groupBy === "evaluator" ? "w-[50%]" : "w-[44%]" }`} /> */}
						<div className="mt-2 h-0.75 w-full bg-myApp-blueLight rounded-full mb-2" />
						<HeaderCols />
					</div>
				</div>

				{/* center divider */}
				{/* <div className={`absolute top-0 h-full w-0.75 bg-myApp-blueLight rounded-full
								${ groupBy === "evaluator" ? "left-1/2" : "left-71/160" }`} /> */}
				<div className="bg-myApp-blueLight w-1 rounded-full" />

				<div className="text-center text-myApp-cream font-semibold text-body-changed">
					{ groupBy === "evaluator" ? "ผู้รับการประเมิน" : "ผู้ประเมิน" }
					<div>
						{/* <div className={`absolute top-1/2 h-0.75 bg-myApp-blueLight rounded-full
										${ groupBy === "evaluator" ? "w-[50%]" : "w-[55%]" }`} /> */}
						<div className="mt-2 h-0.75 w-full bg-myApp-blueLight rounded-full mb-2" />
						{ groupBy === "evaluator" ? <HeaderCols /> : <HeaderColsWeight /> }
					</div>
				</div>

			</div>
		</div>

		{/* Groups */}
		<div className="mt-2 space-y-2 text-body-changed font-medium overflow-y-auto max-h-125">
			{groups.map((g, idx) => {
				const isActive = idx === selectedIndex;
				return (
					<div
						key={idx}
						role="button" 
						onClick={() => {
							onSelectGroup?.(idx, g);
							onOpenGroup?.(g);
						}}
						className={`
						bg-white rounded-xl px-4 py-3
						shadow-sm cursor-pointer transition
						${isActive ? "ring-2 ring-myApp-blue" : "hover:shadow-md"}
						`}
					>
						<div className={`grid gap-6 relative ${ groupBy === "evaluator" ? "grid-cols-[1fr_1fr]" : "grid-cols-[4fr_5fr]" }`}>
							{/* left: evaluator (single row) */}
							<div>
								<Row p={g.evaluator} />
							</div>

							{/* right: evaluatees (multi rows) */}
							<div>
								{g.evaluatees.map((p, i) => (
								<div key={p.pairId ?? i} className={`flex items-center ${i === 0 ? "" : "pt-2"}`}>
									<div className="flex-1">
										{ groupBy === "evaluator" ? <Row p={p} /> : <RowWeight p={p} /> }
									</div>
								</div>
								))}
							</div>

						</div>
					</div>
				);
			})}
		</div>

		<ConfirmBox
			open={confirmOpen}
			message="ต้องการลบคู่ประเมินนี้ใช่หรือไม่?"
			cancelText="ยกเลิก"
			confirmText="ตกลง"
			onCancel={cancelDelete}
			onConfirm={confirmDelete}
		/>
	</div>
  );
}