"use client";
import React from 'react'
import AdminMenuBar from '../../components/admin/AdminMenuBar'
import Button from '@/components/Button'
import { Table, THead, Th, Td, Tr, TBody } from "@/components/Table";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const AdminHomePage = () => {

	const router = useRouter();
	
	return (
		<>
			<div className='px-20 py-7.5'>
				<AdminMenuBar />

				<div className='flex items-center mt-4 mb-1'>
					<p className='text-title font-medium text-myApp-blueDark'>รอบการประเมิน</p>
					<Link href="/admin/evaluationCycle/creating" className="ml-auto">
						<Button variant="primary">สร้าง</Button>
					</Link>
				</div>

				<Table>
					<THead>
						<Tr bg="blue" row="header">
							<Th className="w-[50%]">ชื่อรอบการประเมิน</Th>
							<Th className="w-[15%]">วันเริ่มต้น</Th>
							<Th className="w-[15%]">วันสิ้นสุด</Th>
							<Th className="w-[20%]">สถานะการทำงาน</Th>
						</Tr>
					</THead>
					<TBody>
						<Tr
							className="cursor-pointer hover:bg-myApp-shadow/30 transition"
							onClick={() => router.push("/admin/evaluationCycle/2568-1")}
						>
							<Td>ปีการประเมิน 2568 รอบที่ 1</Td>
							<Td className='text-center'>01/01/2568</Td>
							<Td className='text-center'>30/06/2568</Td>
							<Td className='text-center'>กำหนดตัวชี้วัด</Td>
						</Tr>
					</TBody>
				</Table>

			</div>
		</>
	)
}

export default AdminHomePage
