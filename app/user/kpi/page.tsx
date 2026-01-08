"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiDetailsBar from '@/components/KpiDetailsBar';
import KpiLevelBox from '@/components/KpiLevelBox'
import { Table, TBody, Td, Th, THead, Tr } from '@/components/Table'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
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

	const [kpiType, setKpiType] = useState<"quantitative" | "qualitative" | "custom">("quantitative");
	const [unit, setUnit] = useState("day");
	const [startDate, setStartDate] = useState("2025-01-01");
	const [endDate, setEndDate] = useState("2025-06-30");

  	return (
	<>
		<div className='px-20 py-7.5'>
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
				<Button variant="primary" primaryColor="blueDark">แสดงเกณฑ์คะแนน</Button>
				<Button variant="primary" primaryColor="yellow">คัดลอกตัวชี้วัด</Button>
				<Button variant="primary" primaryColor="pink">ให้ระบบช่วยแนะนำตัวชี้วัด</Button>
				<div className="flex ml-auto gap-2.5">
					{/* if in 'view' mode, show edit button
					if in 'edit' mode, show save and cancel button */}
					{mode === "view" ? (
						<Button onClick={startEdit} variant="primary" primaryColor="orange">แก้ไข</Button>
					) : (
						<>
						<Button onClick={cancelEdit}>ยกเลิก</Button>
						<Button onClick={saveEdit} variant="primary">บันทึก</Button>
						</>
					)}
				</div>
			</div>

			{/* <Table>
				<THead>
					<Tr bg="blue" row="header">
						<Th className='w-[72%]'>ตัวชี้วัด</Th>
						<Th className='w-[9%]'>ค่าน้ำหนัก</Th>
						<Th className='w-[12%]'>ความสัมพันธ์</Th>
						{mode === "edit" && <Th className="w-[7%]"></Th>}
					</Tr>
				</THead>
				<TBody>
					<Tr>
						<Td>
						{mode === "edit" ? (
							<input
								className="w-full bg-transparent outline-none"
								value={draft.name}
								onChange={(e) => setDraft({ ...draft, name: e.target.value })}
							/>
						) : (
							data.name
						)}
						</Td>

						<Td className="text-center">
						{mode === "edit" ? (
							<input
								type="number"
								className="w-full bg-transparent outline-none text-center"
								value={draft.weight}
								onChange={(e) => setDraft({ ...draft, weight: Number(e.target.value) })}
							/>
						) : (
							data.weight
						)}
						</Td>

						<Td className="text-center">
						{mode === "edit" ? (
							<input
								className="w-full bg-transparent outline-none text-center"
								value={draft.status}
								onChange={(e) => setDraft({ ...draft, status: e.target.value })}
							/>
							
						) : (
							data.status
						)}
						</Td>

						{mode === "edit" && (
						<Td className="align-middle px-0">
							<div className='flex items-center justify-center'>
								<button
								type="button"
								onClick={() => setDraft((prev) => ({ ...prev, name: "", weight: 0, status: "" }))}
								className="mx-auto flex items-center justify-center rounded-lg text-myApp-grey
											hover:bg-myApp-red/10 transition"
								title="ลบแถว"
								>
								<FiArrowDown className="text-lg scale-x-80" />
								</button>

								<button
								type="button"
								onClick={() => setDraft((prev) => ({ ...prev, name: "", weight: 0, status: "" }))}
								className="mx-auto flex items-center justify-center rounded-lg text-myApp-grey
											hover:bg-myApp-red/10 transition"
								title="ลบแถว"
								>
								<FiArrowUp className="text-lg scale-x-80" />
								</button>

								<button
								type="button"
								onClick={() => requestDelete(draft.id)}
								className="mx-auto flex items-center justify-center rounded-lg text-myApp-grey
											hover:bg-myApp-red/10 transition"
								title="ลบแถว"
								>
								<FiTrash2 className="text-lg" />
								</button>
							</div>
						</Td>
						)}
					</Tr>
				</TBody>

				{mode === "edit" && (
				<button className='text-myApp-blueDark'>
					<FiPlusCircle />
				</button>
				)}
			</Table> */}

			<TwoLevelKpiTable mode={mode} />

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
