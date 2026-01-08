"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import Input from '@/components/InputField'
import SystemStatusCards from '@/components/SystemStatusCards';
import Link from 'next/link'
import React, { useState } from 'react'

const CreatingEvaluationCyclePage = () => {
	const [startDate, setStartDate] = useState("");

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
					<p className='text-title font-medium text-myApp-blueDark'>รอบการประเมิน (สร้าง)</p>
					<div className="flex ml-auto gap-2.5">
						<Button>ยกเลิก</Button>
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
						value={startDate}
     			 	onChange={(e) => setStartDate(e.target.value)}
     			 	className={startDate ? "" : "date-empty"}
					/>
					<SystemStatusCards defaultActive="define" />
				</div>

			</div>
		</>
	)
}

export default CreatingEvaluationCyclePage
