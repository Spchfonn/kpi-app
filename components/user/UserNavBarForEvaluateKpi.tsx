"use client";
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FiHome, FiUser, FiBell, FiClock, FiX } from "react-icons/fi";
import NotificationPanel from '../NotificationPanel';

const UserNavBarForEvaluateKpi = () => {
  const [openNoti, setOpenNoti] = useState(false);
  const notiRef = useRef<HTMLDivElement>(null);

  // ปิดเมื่อคลิกนอกกล่อง
  useEffect(() => {
	const onDown = (e: MouseEvent) => {
	  if (!openNoti) return;
	  if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
		setOpenNoti(false);
	  }
	};
	document.addEventListener("mousedown", onDown);
	return () => document.removeEventListener("mousedown", onDown);
  }, [openNoti]);

  // ปิดด้วย ESC
  useEffect(() => {
	const onKey = (e: KeyboardEvent) => {
	  if (e.key === "Escape") setOpenNoti(false);
	};
	document.addEventListener("keydown", onKey);
	return () => document.removeEventListener("keydown", onKey);
  }, []);

  // mock notifications
  const notifications = [
	{ id: "n1", type: "pending", title: "นางสาวรักงาน สู้ชีวิต ขออนุมัติตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "1 hour ago", unread: true },
	{ id: "n2", type: "success", title: "นายสวัสดี ดีใจ รับรองตัวชี้วัด ปี 2568 รอบ 1 แล้ว", timeLabel: "2 hours ago", unread: true },
	{ id: "n3", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n4", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n5", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n6", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n7", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n8", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n9", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
	{ id: "n10", type: "error", title: "นายสวัสดี ดีใจ ปฏิเสธการรับรองตัวชี้วัด ปี 2568 รอบ 1", timeLabel: "2 hours ago", unread: false },
  ] as const;

  const unreadCount = notifications.filter((n) => n.unread).length;

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
			{/* bell + dropdown */}
			<div ref={notiRef} className="relative">
				<button
				type="button"
				onClick={() => setOpenNoti((p) => !p)}
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

				{openNoti && (
				<div className="fixed inset-0 z-50 mt-14.5">

					{/* overlay */}
					<button
						type="button"
						className="absolute inset-0 bg-myApp-black/30"
						onClick={() => setOpenNoti(false)}
						aria-label="Close modal"
					/>

					<div className="absolute right-0 top-0 w-124 max-w-[100vw] h-dvh">
						<div className="h-full bg-myApp-cream shadow-lg p-4 flex flex-col">
							<div className="flex items-center mb-2">
								<div className="text-button font-semibold text-myApp-blueDark">การแจ้งเตือน</div>
								<button
									type="button"
									onClick={() => setOpenNoti(false)}
									className="ml-auto p-1 rounded-full hover:bg-myApp-shadow/40"
									aria-label="Close notifications"
								>
									<FiX className="text-myApp-blueDark" />
								</button>
							</div>

							<div className='flex-1 overflow-y-auto'>
								<NotificationPanel notifications={notifications as any} />
							</div>

							<div className='h-14'></div>
						</div>
					</div>
				</div>
				)}
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
