import React from 'react'
import Link from 'next/link'
import { FiHome, FiUser, FiBell } from "react-icons/fi";

const AdminNavBar = () => {
  return (
	<nav className='flex bg-myApp-green space-x-10 px-6 py-4 items-center text-nav font-medium text-myApp-cream'>
		<ul className='flex items-center gap-10 w-full'>
			<li><Link href="/"><FiHome className="text-xl"/></Link></li>

			<li className="flex items-center gap-5">
				ระบบกำหนดตัวชี้วัด
				<div className="flex items-center gap-2">
					<FiUser className="text-xl" />
					ผู้ดูแลระบบ
				</div>
			</li>

			<li className="ml-auto flex items-center gap-5">
				<Link href="/"><FiBell className="text-xl" /></Link>
				<div className="flex items-center gap-2">
					<FiUser className="text-xl" />
					ผู้ดูแลระบบ
				</div>
			</li>
		</ul>
	</nav>
  )
}

export default AdminNavBar
