"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import Input from '@/components/InputField'
import SystemStatusCards from '@/components/SystemStatusCards';
import EmploymentHistoryTable, { WorkHistoryItem } from '@/components/user/EmploymentHistoryTable';
import Link from 'next/link'
import React, { useState } from 'react'

const Page = () => {
	const [mode, setMode] = useState<"view" | "edit">("view");
	const isView = mode === "view";

	const startEdit = () => {
		setMode("edit");
	};
	const cancelEdit = () => {
		setMode("view");
	};
	const saveEdit = () => {
		setMode("view");
		// TODO: call API save
	};

	const [birthDate, setBirthDate] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const [open, setOpen] = useState(false);
	const handleSaveClick = () => setOpen(true);
	const handleConfirm = () => {
		setOpen(false);
		// TODO: call API บันทึกจริงตรงนี้
		console.log("confirmed save");
	};
  	const handleCancel = () => setOpen(false);

	const [form, setForm] = useState({
		name: "John Doe",
		email: "john@example.com",
	});

	const [employmentItems, setEmploymentItems] = useState<WorkHistoryItem[]>([
		{ title: "Software Engineer / Level 3", startDate: "01/01/2025", endDate: "-" },
		{ title: "Software Engineer / Level 2", startDate: "01/07/2024", endDate: "31/12/2024" },
		{ title: "Software Engineer / Level 1", startDate: "01/01/2024", endDate: "30/06/2024" },
	]);

	return (
		<>
			<div className='px-20 py-7.5'>
				<div className='flex items-center mb-4'>
					<p className='text-title font-medium text-myApp-blueDark'>นางสาวรักงาน สู้ชีวิต / ข้อมูลพื้นฐาน</p>
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

				{/* <ConfirmBox
					open={open}
					message="ต้องการสร้างรอบการประเมินใหม่ใช่หรือไม่?"
					cancelText="ยกเลิก"
					confirmText="ตกลง"
					onCancel={handleCancel}
					onConfirm={handleConfirm}
				/> */}

				{/* form */}
				<div className='grid grid-cols-1 md:grid-cols-[500px_500px]'>
					<div className='flex flex-col gap-4'>
						<Input
							label="คำนำหน้า"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="ชื่อ"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="นามสกุล"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="ชื่อเล่น"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="หมายแลขพนักงาน"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="วัน/เดือน/ปีเกิด"
							type="date"
							value={birthDate}
							onChange={(e) => setBirthDate(e.target.value)}
							className={birthDate ? "" : "date-empty"}
						/>
						<Input
							label="อีเมล"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="เบอร์ติดต่อ"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="วันเริ่มต้นทำงาน"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							className={startDate ? "" : "date-empty"}
						/>
						<Input
							label="วันสิ้นสุดการทำงาน"
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							className={endDate ? "" : "date-empty"}
						/>
					</div>

					<div className='flex flex-col gap-4'>
						<Input
							label="แผนก"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="ตำแหน่ง"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="ระดับ"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="รายละเอียดงาน"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<Input
							label="ผู้บังคับบัญชา"
							value={form.name}
							readOnly={isView}
							onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
						/>
						<EmploymentHistoryTable
							items={employmentItems}
							mode={mode}
							onChangeItems={setEmploymentItems}
						/>
					</div>
				</div>
			</div>
		</>
	)
}

export default Page
