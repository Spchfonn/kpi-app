"use client";
import { useEffect, useState } from "react";
import { FiTrash2, FiUser } from "react-icons/fi";
import DropDown from "@/components/DropDown";
import EvaluationPairsTable, { type EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/Table";
import ConfirmBox from "@/components/ConfirmBox";

const groupOptions = [
	{ value: "evaluator", label: "ผู้ประเมิน" },
	{ value: "evaluatee", label: "ผู้รับการประเมิน" },
] as const;

type GroupBy = typeof groupOptions[number]["value"];

type Props = {
	mode: "view" | "edit";
	groups: EvaluationGroup[];
};

export default function EvaluationAssignmentTab({ mode, groups }: Props) {
	const [groupBy, setGroupBy] = useState<GroupBy>("evaluator");

	const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
	const [selectedGroup, setSelectedGroup] = useState<EvaluationGroup | null>(null);

	const [detailEvaluatees, setDetailEvaluatees] = useState(selectedGroup?.evaluatees ?? []);
	useEffect(() => setDetailEvaluatees(selectedGroup?.evaluatees ?? []), [selectedGroup]);

	const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const openDelete = (idx: number) => {
		setDeleteIdx(idx);
		setIsDeleteOpen(true);
	};

	const closeDelete = () => {
		setIsDeleteOpen(false);
		setDeleteIdx(null);
	};

	const confirmDelete = () => {
		if (deleteIdx === null) return;
		setDetailEvaluatees((prev) => prev.filter((_, i) => i !== deleteIdx));
		closeDelete();
	};

	return (
		<>
		<div className="flex items-center gap-2 mb-3 -mt-1">
			{!selectedGroup ? (
			<>
				<p className="text-body font-medium text-myApp-blueDark">จัดกลุ่มตาม</p>
				<div className="w-54">
					<DropDown
						value={groupBy}
						onChange={(v) => setGroupBy(v as GroupBy)}
						options={groupOptions as any}
					/>
				</div>
			</>
			) : (
			<div>
				<p className="flex text-nav font-medium text-myApp-blueDark gap-2">
					ผู้ประเมิน :{" "}
					<span>
						{selectedGroup.evaluator.employeeNo} {selectedGroup.evaluator.name}
						<br />
						{selectedGroup.evaluator.position} {selectedGroup.evaluator.level}
					</span>
				</p>
			</div>
			)}
		</div>

		{!selectedGroup ? (
			<EvaluationPairsTable
			groups={groups}
			selectedIndex={selectedGroupIndex ?? undefined}
			onSelectGroup={(idx, group) => {
				setSelectedGroupIndex(idx);
				setSelectedGroup(group);
			}}
			/>
		) : (
			<div>
				<p className="text-nav font-medium text-myApp-blueDark">
					ผู้รับการประเมิน ({detailEvaluatees.length})
				</p>

				<Table>
					<THead>
						<Tr bg="blue" row="header">
							<Th className="w-[7%]"> </Th>
							<Th className="w-[12%]">หมายเลขพนักงาน</Th>
							<Th className="w-[40%]">ชื่อ</Th>
							<Th className="w-[22%]">ตำแหน่ง</Th>
							<Th className="w-[14%]">ระดับ</Th>
							<Th className="w-[5%]"> </Th>
						</Tr>
					</THead>

					<TBody>
					{detailEvaluatees.map((p, i) => (
						<Tr key={p.id ?? i} className="cursor-pointer hover:bg-myApp-shadow/30 transition">
							<Td>
								<div className="w-8 h-8 rounded-full border-2 border-myApp-blueDark flex items-center justify-center">
								<FiUser className="text-myApp-blueDark text-lg" />
								</div>
							</Td>
							<Td className="text-center">{p.employeeNo}</Td>
							<Td>{p.name}</Td>
							<Td className="text-center">{p.position}</Td>
							<Td className="text-center">{p.level}</Td>
							<Td>
								<button
								type="button"
								disabled={mode === "view"}
								className={`flex items-center justify-center rounded-lg hover:bg-myApp-grey/30 ${
									mode === "view" ? "opacity-40 cursor-not-allowed" : ""}`}
								onClick={(e) => {
									if (mode === "view") return;
									e.stopPropagation();
									openDelete(i);
								}}
								>
									<FiTrash2 className="text-lg text-myApp-grey" />
								</button>
							</Td>
						</Tr>
					))}
					</TBody>
				</Table>

				{/* confirm modal for delete employee */}
				{isDeleteOpen && (
					<ConfirmBox
						open={isDeleteOpen}
						message="ต้องการลบตัวชี้วัดแถวนี้ใช่หรือไม่?"
						cancelText="ยกเลิก"
						confirmText="ตกลง"
						onCancel={closeDelete}
						onConfirm={confirmDelete}
					/>
				)}
			</div>
		)}
		</>
	);
}