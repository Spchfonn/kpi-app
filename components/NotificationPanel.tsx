"use client";
import React, { useMemo, useState } from "react";
import { FiBell, FiCheck, FiX, FiFeather } from "react-icons/fi";

type NotiType = "info" | "success" | "error" | "pending";

export type Notification = {
  id: string;
  type: NotiType;
  title: string;
  timeLabel: string; // "1 hour ago" / "24/11/2025"
  unread?: boolean;
};

const TYPE_STYLE: Record<NotiType, { bar: string; icon: React.ReactNode }> = {
  pending: { bar: "bg-myApp-yellow", icon: <FiFeather className="text-2xl text-myApp-cream" /> },
  success: { bar: "bg-myApp-green", icon: <FiCheck className="text-2xl text-myApp-cream" /> },
  error: { bar: "bg-myApp-red", icon: <FiX className="text-2xl text-myApp-cream" /> },
  info: { bar: "bg-myApp-blue", icon: <FiBell className="text-2xl text-myApp-cream" /> },
};

export default function NotificationPanel({
  notifications,
  onClickItem,
}: {
  notifications: Notification[];
  onClickItem: (id: string) => void;
}) {
	
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const list = useMemo(() => {
	if (filter === "unread") return notifications.filter((n) => n.unread);
	return notifications;
  }, [filter, notifications]);

  return (
	<aside className="w-full max-w-[90vw]">
	  {/* filter tabs */}
	  <div className="sticky top-0 z-10 bg-myApp-cream pb-2 flex gap-2">
		<button
		  type="button"
		  onClick={() => setFilter("all")}
		  className={`px-3 py-1 rounded-full text-smallBody font-medium border
			${filter === "all"
			  ? "bg-myApp-blueDark text-myApp-cream border-myApp-blueDark"
			  : "bg-myApp-white text-myApp-blueDark border-myApp-blueDark hover:bg-myApp-shadow/30"}
		  `}
		>
		  การแจ้งเตือนทั้งหมด
		</button>

		<button
		  type="button"
		  onClick={() => setFilter("unread")}
		  className={`px-3 py-1 rounded-full text-smallBody font-medium border
			${filter === "unread"
			  ? "bg-myApp-blueDark text-myApp-cream border-myApp-blueDark"
			  : "bg-myApp-white text-myApp-blueDark border-myApp-blueDark hover:bg-myApp-shadow/30"}
		  `}
		>
		  การแจ้งเตือนที่ยังไม่อ่าน
		</button>
	  </div>

	  {/* list */}
	  <div className="space-y-3">
		{list.map((n) => (
		<NotificationItem
			key={n.id}
			item={n}
			onClick={() => onClickItem(n.id)}
		/>
		))}
	  </div>
	</aside>
  );
}

function NotificationItem({
  item,
  onClick,
}: {
  item: Notification;
  onClick: () => void;
}) {
  const style = TYPE_STYLE[item.type];

  return (
	<button
		type="button"
		onClick={onClick}
		className={`
			w-full text-left relative rounded-xl shadow-sm overflow-hidden
			${item.unread ? "bg-myApp-white" : "bg-myApp-shadow/50"}
		`}
	>
		{/* left color bar */}
		<div className={`absolute left-0 top-0 h-full w-13 ${style.bar}`} />

		<div className="absolute left-0 top-0 h-full w-13 flex items-center justify-center">
			<div className="w-10 h-10 rounded-xl flex items-center justify-center bg-transparent">
				{style.icon}
			</div>
		</div>

		{/* content */}
		<div className="flex pl-17 pr-3 py-3">
			<div className="flex-1">
				<p className="text-body font-medium text-myApp-blueDark leading-snug">
					{item.title}
				</p>
				<div className="text-right mt-2 text-smallBody font-medium text-myApp-grey">
					{item.timeLabel}
				</div>
			</div>
		</div>
	</button>
  );
}