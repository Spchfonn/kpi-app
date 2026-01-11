"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import SelectCycleDropDown from '@/components/SelectCycleDropDown';
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable'
import SelectOwnerKpiModal from '@/components/user/SelectOwnerKpiModal';
import React, { useState } from 'react'

const page = () => {

	const [round, setRound] = useState<string | null>(null);

	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [openSelectOwnerKpiModal, setOpenSelectOwnerKpiModal] = useState(false);
	const [filterValue, setFilterValue] = useState<string>("op01");

	const owners = [
		{ id: "1", employeeNo: "22", name: "นางสาวรักงาน สู้ชีวิต", position: "Software Engineer", level: "ระดับ 3" },
	];

	const [open, setOpen] = useState(false);
	const handleCopyClick = () => setOpen(true);
	const handleConfirm = () => {
		setOpen(false);
		// TODO: call API บันทึกจริงตรงนี้
		console.log("confirmed save");
	};
	const handleCancel = () => setOpen(false);

	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-7'>
				<p className='text-title font-medium text-myApp-blueDark'>นางสาวรักงาน สู้ชีวิต / คัดลอกตัวชี้วัด</p>
				<Button 
					variant="primary"
					primaryColor="pink"
					className='ml-auto'>
					กลับไปยังหน้ากำหนดตัวชี้วัด
				</Button>
			</div>

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				<button
					className={`
						w-49 h-9 border-2 border-myApp-blueDark rounded-2xl bg-myApp-white py-2
						text-center text-body font-medium text-myApp-grey
					`}
					onClick={() => setOpenSelectOwnerKpiModal(true)}>
					เลือกเจ้าของตัวชี้วัด
				</button>

				{/* modal for select kpi's owner wil show when click the select button */}
				<SelectOwnerKpiModal
					open={openSelectOwnerKpiModal}
					owners={owners}
					filterValue={filterValue}
					onFilterChange={setFilterValue}
					onClose={() => setOpenSelectOwnerKpiModal(false)}
					onSelect={(o) => {
						setOpenSelectOwnerKpiModal(false);
					}}
				/>

				<SelectCycleDropDown
					value={round}
					onChange={setRound}
				/>

				<div className='flex ml-auto gap-2.5'>
					<Button 
						variant={showAllDetails ? "outline" : "primary"}
						primaryColor="blueDark"
						onClick={() => setShowAllDetails((prev) => !prev)}>
						{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
					</Button>
					<Button
						variant="primary"
						primaryColor="green"
						onClick={handleCopyClick}>
						คัดลอกตัวชี้วัดที่เลือก
					</Button>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto'>
				<TwoLevelKpiTable mode={mode} showAllDetails={showAllDetails} selectable={true} />
			</div>

			<ConfirmBox
				open={open}
				message="ต้องการคัดลอกตัวชี้วัดที่เลือกไปยังการกำหนดตัวชี้วัดรอบปัจจุบันใช่หรือไม่?"
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={handleCancel}
				onConfirm={handleConfirm}
			/>
		</div>
	</>
  )
}

export default page
