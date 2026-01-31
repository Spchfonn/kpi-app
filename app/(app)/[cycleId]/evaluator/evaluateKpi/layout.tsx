"use client";
import React, { useState } from "react";
import UserNavBarForEvaluateKpi from "@/components/user/UserNavBarForEvaluateKpi";
import NotificationDrawer from "@/components/NotificationDrawer";
import { NotificationProvider, useNotifications } from "@/components/NotificationProvider";

function Shell({ children }: { children: React.ReactNode }) {
	const [openNoti, setOpenNoti] = useState(false);
	const { notifications, unreadCount, refetch } = useNotifications();

	return (
		<>
		<UserNavBarForEvaluateKpi
			unreadCount={unreadCount}
			onOpenNoti={() => {
				setOpenNoti(true);
				refetch("all");
			}}
			onCloseNoti={() => setOpenNoti(false)}
		/>

		<NotificationDrawer
			open={openNoti}
			onClose={() => setOpenNoti(false)}
			notifications={notifications}
		/>

		<main>{children}</main>
		</>
	);
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
	return (
		<NotificationProvider>
			<Shell>{children}</Shell>
		</NotificationProvider>
	);
}