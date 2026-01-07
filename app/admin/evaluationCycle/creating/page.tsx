import Button from '@/components/Button'
import Input from '@/components/InputField'
import Link from 'next/link'
import React from 'react'

const CreatingEvaluationCyclePage = () => {
	return (
		<>
			<div className='px-20 py-7.5'>

				<div className='flex items-center mb-4'>
					<p className='text-title font-medium text-myApp-blueDark'>รอบการประเมิน (สร้าง)</p>
					<div className="flex ml-auto gap-2.5">
						<Button>ยกเลิก</Button>
						<Button variant="primary">บันทึก</Button>
					</div>
				</div>

				<Input
					label="ชื่อรอบการประเมิน"
					placeholder="เช่น ปีการประเมิน 2568 รอบที่ 1"
				/>

			</div>
		</>
	)
}

export default CreatingEvaluationCyclePage
