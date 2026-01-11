"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import Input from '@/components/InputField'
import SystemStatusCards from '@/components/SystemStatusCards';
import Link from 'next/link'
import React, { useState } from 'react'

const Page = () => {
	const [mode, setMode] = useState<"view" | "edit">("view");

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
							label="ชื่อ-สกุล"
						/>
						<Input
							label="ชื่อเล่น"
						/>
						<Input
							label="หมายแลขพนักงาน"
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
						/>
						<Input
							label="เบอร์ติดต่อ"
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
							label="ชื่อ-สกุล"
						/>
						<Input
							label="ชื่อเล่น"
						/>
						<Input
							label="หมายแลขพนักงาน"
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
						/>
						<Input
							label="เบอร์ติดต่อ"
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
				</div>
			</div>
		</>
	)
}

export default Page
