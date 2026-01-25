"use client";
import { useEffect, useState } from "react";
import { FiPlusCircle, FiTrash2, FiUser } from "react-icons/fi";
import DropDown from "@/components/DropDown";
import EvaluationPairsTable, { BasicInfoObj, type EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/Table";
import ConfirmBox from "@/components/ConfirmBox";
import { EditMode } from "../types";
import SelectOwnerKpiModal from "@/components/user/SelectOwnerKpiModal";
import SelectEmployeeModal from "@/components/admin/SelectEmployeeModal";
import { useParams } from "next/navigation";

function getLabel(v: string | BasicInfoObj) {
	return typeof v === "string" ? v : v?.name ?? "";
}

const groupOptions = [
	{ value: "evaluator", label: "ผู้ประเมิน" },
	{ value: "evaluatee", label: "ผู้รับการประเมิน" },
] as const;

type GroupBy = typeof groupOptions[number]["value"];

type Props = {
	mode: EditMode;
	groups: EvaluationGroup[];
	groupBy: "evaluator" | "evaluatee";
	onChangeGroupBy: (v: "evaluator" | "evaluatee") => void;
};

export default function EvaluationAssignmentTab({
		mode,
		groups,
		groupBy,
		onChangeGroupBy,
	}: Props) {

	const { id } = useParams<{ id: string }>();    // cycleId (/admin/evaluationCycle/[id])
  	const cycleId = Number(id);

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

	const [openSelectEmployeeModal, setOpenSelectEmployeeModal] = useState(false);

	const addEvaluatee = (o: any) => {
		setDetailEvaluatees((prev) => {
			const exists = prev.some((p) => {
				// check duplicate employee by id and employeeNo
				if (p.id && o.id) return p.id === o.id;
				return p.employeeNo === o.employeeNo;
			});
		
			if (exists) return prev;
		
			// add to list
			return [...prev, o];
		});
	};

	const [saving, setSaving] = useState(false);
	const [saveErr, setSaveErr] = useState<string | null>(null);
	const [saveOk, setSaveOk] = useState<string | null>(null);

	const onSave = async () => {
		if (!selectedGroup) return;
	
		try {
			setSaving(true);
			setSaveErr(null);
			setSaveOk(null);
		
			// avoid duplicated employee by id or employeeNo
			const uniqMap = new Map<string, any>();
			for (const e of detailEvaluatees) {
				const key = e.id ?? e.employeeNo;
				if (!uniqMap.has(key)) uniqMap.set(key, e);
			}
			const uniqueEvaluatees = Array.from(uniqMap.values());
		
			const evaluatorId = selectedGroup.evaluator.id;
		
			const res = await fetch(
				`/api/evaluationCycles/${cycleId}/evaluationAssignments/${evaluatorId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						evaluateeIds: uniqueEvaluatees.map((x) => x.id),
					}),
				}
			);
		
			const json = await res.json();
			if (!res.ok) {
				throw new Error(json?.error ?? `HTTP ${res.status}`);
			}
		
			setSaveOk("บันทึกสำเร็จ");
			setTimeout(() => setSaveOk(null), 1500);
		} catch (e: any) {
		  	setSaveErr(e?.message ?? "บันทึกไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
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
						onChange={(v) => onChangeGroupBy(v as GroupBy)}
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
						{getLabel(selectedGroup.evaluator.position)} {getLabel(selectedGroup.evaluator.level)}
					</span>
				</p>
			</div>
			)}
		</div>

		{!selectedGroup ? (
			<EvaluationPairsTable
			groups={groups}
			groupBy={groupBy}
			selectedIndex={selectedGroupIndex ?? undefined}
			onSelectGroup={(idx, group) => {
				setSelectedGroupIndex(idx);
				setSelectedGroup(group);
			}}
			/>
		) : (
			<div>
				<div className="flex">
					<p className="text-nav font-medium text-myApp-blueDark">
						ผู้รับการประเมิน ({detailEvaluatees.length})
					</p>

					<div className="flex items-center ml-auto">
						{mode === "edit" && (
							<button
							type="button"
							className="flex items-center justify-center gap-1 rounded-lg hover:bg-myApp-grey/30"
							onClick={() => {setOpenSelectEmployeeModal(true)}}
							>
								<FiPlusCircle className="text-lg text-myApp-blueDark" />
								<p className="text-button font-medium text-myApp-blueDark">เพิ่มผู้รับการประเมิน</p>
							</button>
						)}
					</div>
					
				</div>

				{/* modal for add employee */}
				<SelectEmployeeModal
					open={openSelectEmployeeModal}
					onClose={() => setOpenSelectEmployeeModal(false)}
					onSelect={(o) => {
						addEvaluatee(o);
						setOpenSelectEmployeeModal(false);
					}}
				/>

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
							<Td>{p.name} {p.lastName}</Td>
							<Td className="text-center">{getLabel(p.position)}</Td>
							<Td className="text-center">{getLabel(p.level)}</Td>
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