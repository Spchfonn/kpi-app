"use client";
import Input from '@/components/InputField';
import SelectCycleDropDown from '@/components/SelectCycleDropDown'
import React, { useState } from 'react'

const page = () => {

  const [round, setRound] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  return (
	<div className='min-h-screen w-screen bg-myApp-cream flex'>
		{/* Left panel */}
		<aside className={`w-[35%] bg-myApp-green flex items-center justify-center`}>
			<div className="text-white flex items-center gap-6">
				{/* Logo placeholder */}
				<div className="h-34 w-34 rounded-full flex items-center justify-center">
					<img src="/image/logo.png" alt="Logo" className="h-full w-full object-contain" />
				</div>

				<div className="w-1 h-32 bg-myApp-cream rounded-full" />
				<div className="text-bigTitle font-medium leading-12">
					ระบบ<br />จัดการ<br />ตัวชี้วัด
				</div>
			</div>
		</aside>

		{/* Right panel */}
		<main className="flex-1 flex items-center justify-center px-6">
			<div className="w-full max-w-md">
				<h1 className="text-center text-myApp-blueDark text-title font-medium mb-6">
					เข้าสู่ระบบ
				</h1>

				<div className="w-full flex flex-col items-center space-y-5">
					<div className='flex justify-center items-center gap-3'>
						<label className="block text-smallTitle font-medium text-myApp-blue">รอบการประเมิน</label>
						<SelectCycleDropDown
							value={round}
							onChange={setRound}
						/>
					</div>

					<div className='w-[80%]'>
						<Input
							label="หมายเลขประจำตัวพนักงาน"
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className='w-[80%]'>
						<Input
							label="รหัสผ่าน"
							type="password"
							showPasswordToggle
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>

					<button className="w-[50%] h-11 rounded-3xl bg-myApp-blue text-button text-white font-medium hover:opacity-95 mt-2 shadow-sm">
						เข้าสู่ระบบ
					</button>
				</div>
			</div>
		</main>
	</div>
  )
}

export default page
