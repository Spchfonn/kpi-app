"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiLevelBox from '@/components/KpiLevelBox'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import TwoLevelKpiTableForEvaluateKpi, { EvalScoreState, KpiTreeNode } from '@/components/TwoLevelKpiTableForEvaluateKpi';
import Link from 'next/link';
import { useState } from 'react'

type Row = {
	id: string;
	name: string;
	weight: number;
	status: string;
};

type KpiType = { id: string; type: "QUANTITATIVE"|"QUALITATIVE"|"CUSTOM"; name: string; rubric?: any };

const nodeKey = (n: KpiTreeNode) => n.id ?? n.clientId!;

const page = () => {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [tree, setTree] = useState<KpiTreeNode[]>([]);
	const [types, setTypes] = useState<KpiType[]>([]);
	const [scores, setScores] = useState<Record<string, EvalScoreState>>({});
	const [scoresDraft, setScoresDraft] = useState<Record<string, EvalScoreState>>({});

	const [data, setData] = useState<Row>({
		id: "row-1",
		name: "xxxx",
		weight: 60,
		status: "xx",
	});

	// เก็บ draft ตอน edit (เผื่อกดยกเลิก)
	const [draft, setDraft] = useState<Row>(data);

	const startEdit = () => {
		setDraft(data);
		setMode("edit");
	};

	const cancelEdit = () => {
		setDraft(data);
		setMode("view");
	};

	const saveEdit = () => {
		setData(draft);
		setMode("view");
		// TODO: call API save
	};

	const [confirmOpen, setConfirmOpen] = useState(false);
	const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

	const requestDelete = (id: string) => {
		setPendingDeleteId(id);
		setConfirmOpen(true);
	};

	const cancelDelete = () => {
	setConfirmOpen(false);
	setPendingDeleteId(null);
	};
	
	const confirmDelete = () => {
	setDraft({ ...draft, name: "", weight: 0, status: "" });
	setConfirmOpen(false);
	setPendingDeleteId(null);
	};

  	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-6'>
				<p className='text-title font-medium text-myApp-blueDark'>กำหนดตัวชี้วัด (นางสาวรักงาน สู้ชีวิต)</p>
				<div className='flex gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>สถานะการประเมินตัวชี้วัด</p>
					<p className='text-button font-semibold text-myApp-red'>ยังไม่ประเมิน</p>
				</div>
				<div className='flex flex-1 gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>ตัวชี้วัดที่ประเมินแล้ว</p>
					<p className='text-button font-semibold text-myApp-green'>0</p>
					<p className='text-button font-semibold text-myApp-blueDark'>/ 4</p>
				</div>
				<div className='flex ml-auto gap-2'>
					<p className='text-title font-semibold text-myApp-blueDark'>สรุปผลคะแนน</p>
					<p className='text-title font-semibold text-myApp-blueDark'>95%</p>
				</div>
			</div>

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				<Button 
					variant={showAllDetails ? "outline" : "primary"}
					primaryColor="blueDark"
					onClick={() => setShowAllDetails((prev) => !prev)}>
					{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
				</Button>

				<div className="flex ml-auto gap-2.5">
					<Button
						variant="primary"
						primaryColor="pink">
						สรุปผลการประเมิน
					</Button>

					{/* if in 'view' mode, show edit button
					if in 'edit' mode, show save and cancel button */}
					{mode === "view" ? (
						<Button onClick={startEdit} variant="primary" primaryColor="orange">ประเมิน</Button>
					) : (
						<>
						<Button onClick={cancelEdit} primaryColor="red">ยกเลิก</Button>
						<Button onClick={saveEdit} variant="primary">บันทึก</Button>
						</>
					)}
				</div>
			</div>

			<div className='flex-1 overflow-y-auto'>
				<TwoLevelKpiTableForEvaluateKpi
					mode={mode}
					showAllDetails={showAllDetails}
					tree={tree}
					kpiTypes={types}
					scores={scores}
					onChangeScores={setScores}
				/>
			</div>

			<ConfirmBox
				open={confirmOpen}
				message="ต้องการลบตัวชี้วัดแถวนี้ใช่หรือไม่?"
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
			/>
		</div>
	</>
  )
}

export default page
