"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ApiItem = {
	id: string; // recipientId
	type: string;
	title: string;
	timeLabel: string | Date;
	unread: boolean;
	meta?: any;
	actor?: any;
};
  
type ApiResp = {
	items: ApiItem[];
	nextCursor: string | null;
	unreadCount: number;
};

type Ctx = {
	notifications: ApiItem[];
	unreadCount: number;
	nextCursor: string | null;
	loading: boolean;
	refetch: (status?: "all" | "unread" | "read") => Promise<void>;
	loadMore: () => Promise<void>;
};

const C = createContext<Ctx | null>(null);

function toTimeLabel(d: string | Date) {
	const dt = typeof d === "string" ? new Date(d) : d;
	return dt.toLocaleString();
}

function mapType(t: string): ApiItem["type"] {
	if (t === "PENDING" || t === "pending") return "pending";
	if (t === "SUCCESS" || t === "success") return "success";
	return "error";
}

async function fetchNoti(params: { status: "all" | "unread" | "read"; take?: number; cursor?: string | null }) {
	const sp = new URLSearchParams();
	sp.set("status", params.status);
	sp.set("take", String(params.take ?? 20));
	if (params.cursor) sp.set("cursor", params.cursor);
  
	const res = await fetch(`/api/notifications?${sp.toString()}`, { cache: "no-store" });
	if (!res.ok) throw new Error("fetch notifications failed");
	return (await res.json()) as ApiResp;
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState<"all" | "unread" | "read">("all");
	const [notifications, setNotifications] = useState<ApiItem[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [nextCursor, setNextCursor] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
  
	const refetch = useCallback(async (st?: "all" | "unread" | "read") => {
		const useStatus = st ?? status;
		setLoading(true);
		try {
			const data = await fetchNoti({ status: useStatus, take: 20, cursor: null });
			setNotifications(data.items ?? []);
			setUnreadCount(data.unreadCount ?? 0);
			setNextCursor(data.nextCursor ?? null);
			setStatus(useStatus);
		} finally {
			setLoading(false);
		}
	}, [status]);
  
	const loadMore = useCallback(async () => {
		if (!nextCursor || loading) return;
		setLoading(true);
		try {
			const data = await fetchNoti({ status, take: 20, cursor: nextCursor });
			setNotifications((prev) => [...prev, ...(data.items ?? [])]);
			setUnreadCount(data.unreadCount ?? 0);
			setNextCursor(data.nextCursor ?? null);
		} finally {
			setLoading(false);
		}
		}, [nextCursor, loading, status]);
	
		useEffect(() => {
		refetch("all");
		const t = setInterval(() => refetch(status), 30_000);
		return () => clearInterval(t);
	}, []); // eslint-disable-line
  
	const value = useMemo(() => ({ notifications, unreadCount, nextCursor, loading, refetch, loadMore }), [
		notifications,
		unreadCount,
		nextCursor,
		loading,
		refetch,
		loadMore,
	]);
  
	return <C.Provider value={value}>{children}</C.Provider>;
}
  
export function useNotifications() {
	const ctx = useContext(C);
	if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
	return ctx;
}