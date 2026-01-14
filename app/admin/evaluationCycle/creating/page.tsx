"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import Input from '@/components/InputField'
import SystemStatusCards, { type StatusKey } from "@/components/SystemStatusCards";
import Link from 'next/link'
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'

const CreatingEvaluationCyclePage = () => {
	const router = useRouter();
	
	const [name, setName] = useState("");
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [systemStatus, setSystemStatus] = useState<StatusKey>("define");

	const statusMap = {
		define: "DEFINE",
		evaluate: "EVALUATE",
		summary: "SUMMARY",
	} as const;

	const [open, setOpen] = useState(false);

  const handleSaveClick = () => {
		if (!name || !startDate || !endDate) {
			alert("กรอกข้อมูลให้ครบก่อน");
			return;
		}
		setOpen(true);
	};

  const handleCancel = () => setOpen(false);

	const handleConfirm = async () => {
		setOpen(false);

		const res = await fetch("/api/evaluationCycles", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				name,
				startDate,
				endDate,
				status: statusMap[systemStatus],
			}),
		});

		const json = await res.json();
		if (!res.ok) {
			console.log(json);
			alert("บันทึกไม่สำเร็จ");
			return;
		}

		console.log("created:", json.data);

		// redirect to admin home page and refresh ui
		router.push("/admin");
    router.refresh();
	};

	return (
		<>
			<div className='px-20 py-7.5'>

				<div className='flex items-center mb-4'>
					<p className='text-title font-medium text-myApp-blueDark'>รอบการประเมิน (สร้าง)</p>
					<div className="flex ml-auto gap-2.5">
						<Button primaryColor="red" onClick={() => router.push("/admin")}>ยกเลิก</Button>
						<Button variant="primary" onClick={handleSaveClick}>บันทึก</Button>
					</div>
				</div>

				<ConfirmBox
					open={open}
					message="ต้องการสร้างรอบการประเมินใหม่ใช่หรือไม่?"
					cancelText="ยกเลิก"
					confirmText="ตกลง"
					onCancel={handleCancel}
					onConfirm={handleConfirm}
				/>

				{/* form */}
				<div className='flex flex-col gap-4'>
					<Input
						label="ชื่อรอบการประเมิน"
						placeholder="เช่น ปีการประเมิน 2568 รอบที่ 1"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<Input
						label="วันเริ่มต้น"
						type="date"
						value={startDate}
     			 	onChange={(e) => setStartDate(e.target.value)}
     			 	className={startDate ? "" : "date-empty"}
					/>
					<Input
						label="วันสิ้นสุด"
						type="date"
						value={endDate}
     			 	onChange={(e) => setEndDate(e.target.value)}
     			 	className={endDate ? "" : "date-empty"}
					/>
					<SystemStatusCards
						active={systemStatus}
						onChange={setSystemStatus}
					/>
				</div>

			</div>
		</>
	)
}

export default CreatingEvaluationCyclePage
