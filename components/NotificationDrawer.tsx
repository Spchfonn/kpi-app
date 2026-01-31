"use client";
import React from "react";
import { FiX } from "react-icons/fi";
import NotificationPanel from "./NotificationPanel";

export default function NotificationDrawer({ open, onClose, notifications, }: {
	open: boolean;
	onClose: () => void;
	notifications: any[];
	}) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 mt-14.5">
			{/* overlay */}
			<button
				type="button"
				className="absolute inset-0 bg-myApp-black/30"
				onClick={onClose}
				aria-label="Close modal"
			/>

			<div className="absolute right-0 top-0 w-124 max-w-[100vw] h-dvh">
				<div className="h-full bg-myApp-cream shadow-lg p-4 flex flex-col">
					<div className="flex items-center mb-2">
						<div className="text-button font-semibold text-myApp-blueDark">การแจ้งเตือน</div>
						<button
							type="button"
							onClick={onClose}
							className="ml-auto p-1 rounded-full hover:bg-myApp-shadow/40"
							aria-label="Close notifications"
						>
							<FiX className="text-myApp-blueDark" />
						</button>
					</div>

					<div className="flex-1 overflow-y-auto">
						<NotificationPanel notifications={notifications as any} />
					</div>

					<div className="h-14" />
				</div>
			</div>
		</div>
	);
}