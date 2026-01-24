"use client";
import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FiHome, FiUser, FiBell, FiClock, FiX, FiRepeat, FiKey, FiLogOut } from "react-icons/fi";
import NotificationPanel from '../NotificationPanel';
import { useRouter } from "next/navigation";
import ConfirmBox from '../ConfirmBox';
import { formatTimeLabel } from "@/lib/time";
import type { Notification } from "../NotificationPanel";
import { NOTIFICATION_UI } from "@/lib/notificationText";
import type { NotificationType } from "@prisma/client";


type LoginUser = {
  fullName?: string;
  cycle?: {
    id: number;
    name: string;
  };
};

type ApiNotification = {
  id: string;
  type: NotificationType;
  createdAt: string;
  unread: boolean;
  notification?: {
    actor?: {
      name?: string;
      lastName?: string;
    };
  };
};

const ROLE_LABEL: Record<string, string> = {
  evaluator: "ผู้ประเมิน",
  evaluatee: "ผู้รับการประเมิน",
};

const UserNavBarForDefineKpi = () => {
	const router = useRouter();

	const [openNoti, setOpenNoti] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
  	const unreadCount = notifications.filter((n) => n.unread).length;
	const notiRef = useRef<HTMLDivElement>(null);

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

			if (openNoti && notiRef.current && !notiRef.current.contains(target)) {
				setOpenNoti(false);
			}
			if (openUserMenu && userMenuRef.current && !userMenuRef.current.contains(target)) {
				setOpenUserMenu(false);
			}
			if (openSignOut && signOutRef.current && !signOutRef.current.contains(target)) {
				setOpenSignOut(false);
			}
		};
		document.addEventListener("mousedown", onDown);
		return () => document.removeEventListener("mousedown", onDown);
	}, [openNoti, openUserMenu, openSignOut]);

	useEffect(() => {
		if (!openNoti) return;

		const loadNotifications = async () => {
			const res = await fetch("/api/notifications");
			if (!res.ok) return;

			const data: ApiNotification[] = await res.json();

			setNotifications(
				data.map((n) => {
					const config = NOTIFICATION_UI[n.type]; // ✅ n.type = NotificationType

					const actorName = n.notification?.actor
						? `${n.notification.actor.name ?? ""} ${n.notification.actor.lastName ?? ""}`.trim()
						: undefined;

					return {
						id: n.id,
						type: config.uiType,
						title: config.title(actorName, cycleName),
						unread: n.unread,
						timeLabel: formatTimeLabel(n.createdAt),
					} satisfies Notification;
				})
			);
		};

		loadNotifications();
	}, [openNoti]);

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
	  
		// TODO: call api sign out
	};

	const markAsRead = async (id: string) => {
		await fetch(`/api/notifications/${id}/read`, {
			method: "PATCH",
		});

		setNotifications((prev) =>
			prev.map((n) =>
			n.id === id ? { ...n, unread: false } : n
			)
		);
	};

	return (
		<nav className='flex bg-myApp-blueLight space-x-10 px-6 py-4 items-center text-nav font-medium text-myApp-cream'>
			<ul className='flex items-center gap-10 w-full'>
				<li><Link href="/"><FiHome className="text-xl"/></Link></li>

				<li className="flex items-center gap-5">
					ระบบกำหนดตัวชี้วัด
					{cycleName && (
						<div className="flex items-center gap-2">
						<FiClock className="text-xl" />
						{cycleName}
						</div>
					)}

					{roleLabel && (
						<div className="flex items-center gap-2">
						<FiUser className="text-xl" />
						{roleLabel}
						</div>
					)}
				</li>

				<li className="ml-auto flex items-center gap-5">
				{/* bell + dropdown */}
				<div ref={notiRef} className="relative">
					<button
					type="button"
					onClick={() => setOpenNoti((p) => !p)}
					className="relative"
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
							className="absolute inset-0 bg-myApp-black/30"
                  	onClick={() => setOpenNoti(false)}
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
									<NotificationPanel
										notifications={notifications}
										onClickItem={(id: string) => markAsRead(id)}
										/>
								</div>

								<div className='h-14'></div>
							</div>
						</div>
					</div>
					)}
				</div>

				{/* user menu */}
				<div ref={userMenuRef} className="relative">
					<button
					type="button"
					onClick={() => {
						setOpenUserMenu((p) => !p);
						setOpenNoti(false);
					}}
					className="flex items-center gap-2 hover:opacity-90"
					aria-haspopup="dialog"
					aria-expanded={openUserMenu}
					>
					<FiUser className="text-xl" />
					{fullName || "-"}
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

export default UserNavBarForDefineKpi
