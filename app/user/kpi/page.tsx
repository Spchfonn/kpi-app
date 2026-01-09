"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiDetailsBar from '@/components/KpiDetailsBar';
import KpiLevelBox from '@/components/KpiLevelBox'
import ScoreBoxForQuantitativeKpi from '@/components/ScoreBoxForQuantitativeKpi';
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import Link from 'next/link';
import React, { useState } from 'react'
import { FiArrowDown, FiArrowUp, FiPlusCircle, FiTrash2 } from 'react-icons/fi';

type Row = {
	id: string;
	name: string;
	weight: number;
	status: string;
  };

const page = () => {
	const [mode, setMode] = useState<"view" | "edit">("view");

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

	const [kpiType, setKpiType] = useState<"quantitative" | "qualitative" | "custom" | null>(null);
	const [unit, setUnit] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const [values, setValues] = useState<Record<1|2|3|4|5, number| "">>({
		1: "",
		2: "",
		3: "",
		4: "",
		5: "",
	});

	const [showAllDetails, setShowAllDetails] = useState(false);

  	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-7'>
				<p className='text-title font-medium text-myApp-blueDark'>นางสาวรักงาน สู้ชีวิต / กำหนดตัวชี้วัด</p>
				<div className='flex flex-1 gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>สถานะการกำหนดตัวชี้วัด</p>
					<p className='text-button font-semibold text-myApp-red'>ยังไม่กำหนด</p>
				</div>
				<KpiLevelBox level={2} />
			</div>

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				<Button 
					variant={showAllDetails ? "outline" : "primary"}
					primaryColor="blueDark"
					onClick={() => setShowAllDetails((prev) => !prev)}>
					{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
				</Button>
				<Link href="/user/kpi/copyKpi">
					<Button
						variant="primary"
						primaryColor="yellow">
						คัดลอกตัวชี้วัด
					</Button>
				</Link>
				<Button variant="primary" primaryColor="pink">ให้ระบบช่วยแนะนำตัวชี้วัด</Button>
				<div className="flex ml-auto gap-2.5">
					{/* if in 'view' mode, show edit button
					if in 'edit' mode, show save and cancel button */}
					{mode === "view" ? (
						<Button onClick={startEdit} variant="primary" primaryColor="orange">แก้ไข</Button>
					) : (
						<>
						<Button onClick={cancelEdit} primaryColor="red">ยกเลิก</Button>
						<Button onClick={saveEdit} variant="primary">บันทึก</Button>
						</>
					)}
				</div>
			</div>

			<div className='flex-1 overflow-y-auto'>
				<TwoLevelKpiTable mode={mode} showAllDetails={showAllDetails} selectable={false}/>
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
