"use client";
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FiHome, FiUser, FiBell, FiClock, FiX, FiRepeat, FiKey, FiLogOut } from "react-icons/fi";
import NotificationPanel from '../NotificationPanel';
import { useRouter } from "next/navigation";
import ConfirmBox from '../ConfirmBox';

type LoginUser = {
  fullName?: string;
  cycle?: {
    id: number;
    name: string;
  };
};

const ROLE_LABEL: Record<string, string> = {
  evaluator: "ผู้ประเมิน",
  evaluatee: "ผู้รับการประเมิน",
};

const UserNavBarForEvaluateKpi = ({
	onOpenNoti,
	onCloseNoti,
	unreadCount,
  }: {
	onOpenNoti: () => void;
	onCloseNoti: () => void;
	unreadCount: number;
  }) => {
	return (
		<nav className='flex bg-myApp-pinkLight space-x-10 px-6 py-4 items-center text-nav font-medium text-myApp-cream'>
			<ul className='flex items-center gap-10 w-full'>
				<li><Link href="/"><FiHome className="text-xl"/></Link></li>

				<li className="flex items-center gap-5">
					ระบบประเมินตัวชี้วัด
					<div className="flex items-center gap-2">
						<FiClock className="text-xl" />
						ปีการประเมิน 2568 รอบที่ 1
					</div>
					<div className="flex items-center gap-2">
						<FiUser className="text-xl" />
						ผู้ประเมิน
					</div>
				</li>

				<li className="ml-auto flex items-center gap-5">
				{/* bell */}
				<div className="relative">
					<button
					type="button"
					onClick={onOpenNoti}
					className="relative"
					aria-label="Notifications"
					>
					<FiBell className="text-xl" />
					{unreadCount > 0 && (
						<span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-myApp-red text-myApp-cream text-xs flex items-center justify-center">
						{unreadCount}
						</span>
					)}
					</button>

				</div>

				<div className="flex items-center gap-2">
					<FiUser className="text-xl" />
					นายสวัสดี สวีดัส
				</div>
			</li>
			</ul>
		</nav>
	)
}

export default UserNavBarForEvaluateKpi
