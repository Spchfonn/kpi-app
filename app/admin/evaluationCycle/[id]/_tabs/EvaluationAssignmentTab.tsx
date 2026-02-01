"use client";
import { useEffect, useState } from "react";
import { FiPlusCircle, FiTrash2, FiUser } from "react-icons/fi";
import DropDown from "@/components/DropDown";
import EvaluationPairsTable, { BasicInfoObj, PairRow, type EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/Table";
import ConfirmBox from "@/components/ConfirmBox";
import { EditMode } from "../types";
import SelectEmployeeModal from "@/components/admin/SelectEmployeeModal";
import { useParams } from "next/navigation";
import Button from "@/components/Button";

function getLabel(v: string | BasicInfoObj) {
	return typeof v === "string" ? v : v?.name ?? "";
}

function sumWeightPercent(list: { weightPercent?: number }[]) {
	return list.reduce((s, x) => s + (Number(x.weightPercent) || 0), 0);
}
  
// tolerance เผื่อทศนิยม (0.01)
function isSum100(sum: number) {
	return Math.abs(sum - 100) <= 0.01;
}

const groupOptions = [
	{ value: "evaluator", label: "ผู้ประเมิน" },
	{ value: "evaluatee", label: "ผู้รับการประเมิน" },
] as const;

type GroupBy = typeof groupOptions[number]["value"];

type ModalMode = "view" | "edit";

type Props = {
	groups: EvaluationGroup[];
	groupBy: "evaluator" | "evaluatee";
	onChangeGroupBy: (v: "evaluator" | "evaluatee") => void;
	reloadGroups?: () => Promise<void> | void;
};

export default function EvaluationAssignmentTab({
		groups,
		groupBy,
		onChangeGroupBy,
		reloadGroups,
	}: Props) {

	const { id } = useParams<{ id: string }>();    // cycleId (/admin/evaluationCycle/[id])
  	const cycleId = Number(id);

	//
	// modal state
	//
	const [openGroupModal, setOpenGroupModal] = useState(false);
	const [modalMode, setModalMode] = useState<ModalMode>("view");

	const [selectedGroup, setSelectedGroup] = useState<EvaluationGroup | null>(null);
	const [detailEvaluatees, setDetailEvaluatees] = useState<PairRow[]>([]);

	// sync evaluatee when select new group
	useEffect(() => setDetailEvaluatees(selectedGroup?.evaluatees ?? []), [selectedGroup]);

	//
	// delete ui
	//
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

	//
	// add employee modal
	//
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

	function toWeightNum(v: any) {
		const n = typeof v === "number" ? v : Number(v);
		if (!Number.isFinite(n)) return 0;
		return Math.max(0, Math.min(100, n));
	}
	  
	function updateWeight(idx: number, next: number) {
		setDetailEvaluatees((prev) =>
		  	prev.map((p, i) => (i === idx ? { ...p, weightPercent: toWeightNum(next) } : p))
		);
	}

	//
	// save
	//
	const [saving, setSaving] = useState(false);
	const [saveErr, setSaveErr] = useState<string | null>(null);
	const [saveOk, setSaveOk] = useState<string | null>(null);

	const canEditInModal = modalMode === "edit";

	const onSave = async () => {
		if (!selectedGroup) return;
		if (!Number.isFinite(cycleId)) { setSaveErr("cycleId ไม่ถูกต้อง"); return; }

		if (groupBy === "evaluatee") {
			const normalized = detailEvaluatees.map((x) => ({ ...x, weightPercent: toWeightNum(x.weightPercent ?? 0) }));
			const sum = sumWeightPercent(normalized);
			if (!isSum100(sum)) {
				setSaveErr(`น้ำหนักรวมต้องเท่ากับ 100 (ตอนนี้ ${sum.toFixed(2)})`);
				return;
			}
		}
	  
		try {
			setSaving(true);
			setSaveErr(null);
			setSaveOk(null);
		
			const baseList = groupBy === "evaluatee"
				? detailEvaluatees.map((x) => ({ ...x, weightPercent: toWeightNum(x.weightPercent ?? 0) }))
				: detailEvaluatees;

			const uniqMap = new Map<string, any>();
			for (const e of baseList) uniqMap.set(e.id ?? e.employeeNo, e);
			const unique = Array.from(uniqMap.values());
		
			let url = "";
			let body: any = {};
		
			if (groupBy === "evaluator") {
				const evaluatorId = selectedGroup.evaluator.id;
				url = `/api/evaluationCycles/${cycleId}/evaluationAssignments/${evaluatorId}`;
				body = { evaluateeIds: unique.map((x) => x.id) };
			}
			else {
				const evaluateeId = selectedGroup.evaluator.id; // ใน groupBy=evaluatee ฝั่งซ้ายคือผู้รับการประเมิน
				url = `/api/evaluationCycles/${cycleId}/evaluationAssignments/byEvaluatee/${evaluateeId}`;
				body = {
					evaluatorItems: unique.map((x) => ({
						evaluatorId: x.id,
						weightPercent: toWeightNum(x.weightPercent ?? 0),
					})),
				};
			}
		
			const res = await fetch(url, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});
	  
			const json = await res.json().catch(() => null);
			if (!res.ok) throw new Error(json?.error ?? json?.message ?? `HTTP ${res.status}`);
		
			await reloadGroups?.();
		
			setSaveOk("บันทึกสำเร็จ");
			setModalMode("view");
			setTimeout(() => { setSaveOk(null); closeGroup(); }, 800);
		} catch (e: any) {
		  	setSaveErr(e?.message ?? "บันทึกไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};

	//
	// Modal open/close helpers
	//
	const openGroup = (g: EvaluationGroup) => {
		setSelectedGroup(g);
		setDetailEvaluatees(g.evaluatees ?? []);
		setModalMode("view");
		setSaveErr(null);
		setSaveOk(null);
		setOpenGroupModal(true);
	};

	const closeGroup = () => {
		setOpenGroupModal(false);
		setModalMode("view");
		setSelectedGroup(null);
		setDetailEvaluatees([]);
		setSaveErr(null);
		setSaveOk(null);

		// reset nested modals
		setOpenSelectEmployeeModal(false);
		closeDelete();
	};

	const subjectLabel = groupBy === "evaluator" ? "ผู้ประเมิน" : "ผู้รับการประเมิน";
	const targetLabel  = groupBy === "evaluator" ? "ผู้รับการประเมิน" : "ผู้ประเมิน";

	return (
		<>
		<div className="flex items-center gap-2 mb-3 -mt-1">
			<p className="text-body font-medium text-myApp-blueDark">จัดกลุ่มตาม</p>
			<div className="w-54">
				<DropDown
					value={groupBy}
					onChange={(v) => onChangeGroupBy(v as GroupBy)}
					options={groupOptions as any}
				/>
			</div>
		</div>

		<EvaluationPairsTable
			groups={groups}
			groupBy={groupBy}
			onOpenGroup={openGroup}
			canDelete={false}
		/>

		{openGroupModal && selectedGroup && (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
			<div className="w-250 max-w-[95vw] h-150 rounded-2xl bg-white p-6 shadow-xl">
				<div className="flex items-start">
					<div>
						<div className="text-body-changed font-semibold text-myApp-blueDark">
							{subjectLabel}: {selectedGroup.evaluator.employeeNo} {selectedGroup.evaluator.name} {selectedGroup.evaluator.lastName}
						</div>
						<div className="text-body font-semibold text-myApp-blue">
							{getLabel(selectedGroup.evaluator.position)} • {getLabel(selectedGroup.evaluator.level)}
						</div>

						{saveErr && <div className="mt-2 text-sm text-myApp-red">{saveErr}</div>}
                		{saveOk && <div className="mt-2 text-sm text-myApp-green">{saveOk}</div>}
					</div>

					<div className="ml-auto flex gap-2">
						<Button
							primaryColor="red"
							onClick={closeGroup}
							disabled={saving}
						>
							ปิด
						</Button>

						{modalMode === "view" ? (
							<Button
								variant="primary"
								primaryColor="orange"
								onClick={() => setModalMode("edit")}
							>
								แก้ไข
							</Button>
						) : (
							<Button
								variant="primary"
								onClick={onSave}
								disabled={saving}
							>
								{saving ? "กำลังบันทึก..." : "บันทึก"}
							</Button>
						)}
					</div>
				</div>

				<div className="mt-4">
					<div className="flex">
						<div className="flex gap-2">
							<p className="text-nav font-medium text-myApp-blueDark">
								{targetLabel} ({detailEvaluatees.length})
							</p>

							{groupBy === "evaluatee" && (() => {
							const sum = sumWeightPercent(detailEvaluatees.map(x => ({ ...x, weightPercent: toWeightNum(x.weightPercent ?? 0) })));
							return (
								<div className={`mt-auto text-body font-medium ${isSum100(sum) ? "text-myApp-green" : "text-myApp-red"}`}>
									น้ำหนักรวม: {sum.toFixed(2)} / 100
								</div>
							);
							})()}
						</div>

						<div className="flex items-center ml-auto">
							{canEditInModal && (
								<button
								type="button"
								className="flex items-center justify-center gap-1 rounded-lg hover:bg-myApp-grey/30"
								onClick={() => {setOpenSelectEmployeeModal(true)}}
								>
									<FiPlusCircle className="text-lg text-myApp-blueDark" />
									<p className="text-button font-medium text-myApp-blueDark">เพิ่ม{targetLabel}</p>
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
								<Th className="w-[34%]">ชื่อ</Th>
								<Th className="w-[20%]">ตำแหน่ง</Th>
								<Th className="w-[12%]">ระดับ</Th>

								{groupBy === "evaluatee" && (
								<Th className="w-[10%] text-center">ค่าน้ำหนัก(%)</Th>
								)}

								<Th className="w-[5%]"> </Th>
							</Tr>
						</THead>

						<TBody>
						{detailEvaluatees.map((p, i) => (
							<Tr key={p.id ?? `${p.employeeNo}-${i}`} className="cursor-pointer hover:bg-myApp-shadow/30 transition">
								<Td>
									<div className="w-8 h-8 rounded-full border-2 border-myApp-blueDark flex items-center justify-center">
										<FiUser className="text-myApp-blueDark text-lg" />
									</div>
								</Td>
								<Td className="text-center">{p.employeeNo}</Td>
								<Td>{p.name} {p.lastName}</Td>
								<Td className="text-center">{getLabel(p.position)}</Td>
								<Td className="text-center">{getLabel(p.level)}</Td>
								{groupBy === "evaluatee" && (
								<Td className="text-center">
									{canEditInModal ? (
									<input
										type="number"
										min={0}
										max={100}
										value={p.weightPercent ?? 0}
										onChange={(e) => updateWeight(i, Number(e.target.value))}
										className="w-20 rounded-lg border border-myApp-grey px-2 py-1 text-center outline-none focus:border-myApp-blueDark"
									/>
									) : (
									<span className="text-body font-medium text-myApp-blueDark">
										{p.weightPercent ?? 0}
									</span>
									)}
								</Td>
								)}
								<Td>
									<button
									type="button"
									disabled={!canEditInModal}
									className={`flex items-center justify-center rounded-lg hover:bg-myApp-grey/30 ${
										!canEditInModal ? "opacity-40 cursor-not-allowed" : ""}`}
									onClick={(e) => {
										if (!canEditInModal) return;
										e.stopPropagation();
										openDelete(i);
									}}
									>
										<FiTrash2 className="text-lg text-myApp-blueLight" />
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
							message={`ต้องการลบ${targetLabel}นี้ใช่หรือไม่? (จะมีผลเมื่อกดบันทึก)`}
							cancelText="ยกเลิก"
							confirmText="ตกลง"
							onCancel={closeDelete}
							onConfirm={confirmDelete}
						/>
					)}
				</div>
			</div>
		</div>
		)}
		
		</>
	);
}