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

const AdminNavBar = () => {
	const router = useRouter();

	const [cycleName, setCycleName] = useState<string>("");
	const [roleLabel, setRoleLabel] = useState<string>("");
  	const [fullName, setFullName] = useState<string>("");
	
	const [openUserMenu, setOpenUserMenu] = useState(false);
	const userMenuRef = useRef<HTMLDivElement>(null);

	const [openSignOut, setOpenSignOut] = useState(false);
	const signOutRef = useRef<HTMLDivElement>(null);

	// load data from localStorage
	useEffect(() => {
    const rawUser = localStorage.getItem("user");
		if (rawUser) {
			const user: LoginUser = JSON.parse(rawUser);
			setCycleName(user.cycle?.name ?? "");
			setFullName(user.fullName ?? "");
		}

		const selectedRole = localStorage.getItem("selectedRole");
		if (selectedRole) {
			setRoleLabel(ROLE_LABEL[selectedRole] ?? "");
		}
	}, []);

	// close if dlick outside modal
	useEffect(() => {
		const onDown = (e: MouseEvent) => {
			const target = e.target as Node;
			if (openUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
				setOpenUserMenu(false);
			}
			if (openSignOut && signOutRef.current && !signOutRef.current.contains(target)) {
				setOpenSignOut(false);
			}
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [openUserMenu, openSignOut]);

	const handleChangeRole = () => {
		setOpenUserMenu(false);
		router.push("/sign-in/selectRole")
	};

	const handleChangePassword = () => {
		setOpenUserMenu(false);
		router.push("/changePassword")
	};

	const handleSignOut = () => {
		setOpenUserMenu(false);
		setOpenSignOut(true);
	};

	const cancelSignOut = () => setOpenSignOut(false);

	const confirmSignOut = async () => {
		setOpenSignOut(false);
      try {
         // 1. เรียก API เพื่อลบ Session ใน Database และลบ Cookie
         await fetch("/api/auth/sign-out", {
            method: "POST",
         });

         // 2. ลบข้อมูลฝั่ง Client (LocalStorage)
         localStorage.removeItem("user");
         localStorage.removeItem("selectedRole");

         // 3. Redirect ไปหน้า Login
         // router.refresh() ใช้เพื่อให้ Server Component รู้ว่า Cookie หายไปแล้ว (เคลียร์ Cache หน้าเว็บ)
         router.refresh(); 
         router.push("/sign-in");
         
      } catch (error) {
         console.error("Logout error:", error);
         // หากเกิด Error ก็บังคับกลับไปหน้า Login
         router.push("/sign-in");
      }
	};

	return (
		<nav className='flex bg-myApp-green space-x-10 px-6 py-4 items-center text-nav font-medium text-myApp-cream'>
			<ul className='flex items-center gap-10 w-full'>
				<li><Link href="/"><FiHome className="text-xl"/></Link></li>

				<li className="flex items-center gap-5">
					ระบบจัดการตัวชี้วัด
					{cycleName && (
						<div className="flex items-center gap-2">
						<FiClock className="text-xl" />
						{cycleName}
						</div>
					)}

					{roleLabel && (
						<div className="flex items-center gap-2">
						<FiUser className="text-xl" />
						ผู้ดูแลระบบ
						</div>
					)}
				</li>

				<li className="ml-auto flex items-center gap-5">
				{/* bell + dropdown */}
				<div className="relative">
					<button
						type="button"
						onClick={() => {
							setOpenUserMenu(false);
						}}
						className="relative"
						aria-label="Notifications"
					>
						<FiBell className="text-xl" />
					</button>
				</div>

				{/* user menu */}
				<div ref={userMenuRef} className="relative">
					<button
						type="button"
						onClick={() => {
							setOpenUserMenu((p) => !p);
						}}
						className="flex items-center gap-2 hover:opacity-90"
						aria-haspopup="dialog"
						aria-expanded={openUserMenu}
					>
						<FiUser className="text-xl" />
					ผู้ดูแลระบบ
					</button>

					{openUserMenu && (
					<div className="fixed inset-0 z-50 mt-14.5">
						{/* overlay */}
						<button
						type="button"
						className="absolute inset-0 bg-myApp-black/30"
						onClick={() => setOpenUserMenu(false)}
						aria-label="Close user menu"
						/>

						{/* modal */}
						<div className="absolute right-0 top-0 w-96 max-w-[95vw]">
							<div className="bg-myApp-white shadow-lg rounded-2xl overflow-hidden border border-myApp-shadow/40">
								<div className="p-4 flex items-center">
									<div className="text-button font-semibold text-myApp-blueDark">บัญชีผู้ใช้</div>
									<button
										type="button"
										onClick={() => setOpenUserMenu(false)}
										className="ml-auto px-1 rounded-full hover:bg-myApp-shadow/40"
										aria-label="Close"
									>
										<FiX className="text-myApp-blueDark" />
									</button>
								</div>

								<div className="px-4 pb-2">
									<div className="flex items-center gap-3 p-3 rounded-xl bg-myApp-blueLight/10 border border-myApp-shadow/30">
										<div className="w-9 h-9 rounded-full border-2 border-myApp-blueDark flex items-center justify-center">
											<FiUser className="text-myApp-blueDark text-lg" />
										</div>
										<div className="min-w-0">
											<div className="text-nav text-myApp-blueDark font-semibold truncate">{fullName || "-"}</div>
											<div className="text-body text-myApp-blueDark">บทบาท: {roleLabel}</div>
										</div>
									</div>

									<div className="mt-2 space-y-1">
										<button
										type="button"
										onClick={handleChangeRole}
										className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-myApp-shadow/20 text-myApp-blueDark"
										>
											<FiRepeat />
											เปลี่ยนบทบาท
										</button>

										<button
										type="button"
										onClick={handleChangePassword}
										className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-myApp-shadow/20 text-myApp-blueDark"
										>
											<FiKey />
											เปลี่ยนรหัสผ่าน
										</button>

										<div className="h-px bg-myApp-shadow my-2" />

										<button
										type="button"
										onClick={handleSignOut}
										className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-myApp-red/10 text-myApp-red"
										>
											<FiLogOut />
											ออกจากระบบ
										</button>
									</div>
								</div>
							</div>
						</div>
					</div>
					)}
				</div>
			</li>
			</ul>

			<ConfirmBox
				open={openSignOut}
				message="ต้องการออกจากระบบใช่หรือไม่?"
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={cancelSignOut}
				onConfirm={confirmSignOut}
			/>
		</nav>
	)
}

export default AdminNavBar
