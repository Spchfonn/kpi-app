"use client";
import AdminNavBar from "@/components/admin/AdminNavBar";
import NotificationDrawer from "@/components/NotificationDrawer";
import { NotificationProvider, useNotifications } from "@/components/NotificationProvider";
import React, { useState } from "react";

export default function UserLayout({
	children,
}: {
	children: React.ReactNode;
}) {

	return (
		<>
			<AdminNavBar/>
			<main>{children}</main>
		</>
	);
}
