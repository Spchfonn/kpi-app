"use client";
import React, { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import NotificationDrawer from "@/components/NotificationDrawer";
import { NotificationProvider, useNotifications } from "@/components/NotificationProvider";
import UserNavBarForDefineKpi from "@/components/user/UserNavBarForDefineKpi";
import UserNavBarForEvaluateKpi from "@/components/user/UserNavBarForEvaluateKpi";
import UserNavBarForSummaryKpi from "@/components/user/UserNavBarForSummaryKpi";

type ActivityType = "DEFINE" | "EVALUATE" | "SUMMARY";

function Shell({ children }: { children: React.ReactNode }) {
  const params = useParams() as { cycleId?: string; employeeId?: string };
  const searchParams = useSearchParams();

  const [openNoti, setOpenNoti] = useState(false);
  const { notifications, unreadCount, refetch } = useNotifications();

  const activity = (searchParams.get("activity") ?? "DEFINE").toUpperCase() as ActivityType;

  const from = searchParams.get("from") ?? "";

  const Nav = useMemo(() => {
    if (activity === "EVALUATE") return UserNavBarForEvaluateKpi;
    if (activity === "SUMMARY") return UserNavBarForSummaryKpi;
    return UserNavBarForDefineKpi;
  }, [activity]);

  return (
    <>
      <Nav
        unreadCount={unreadCount}
        onOpenNoti={() => {
          setOpenNoti(true);
          refetch("all");
        }}
        onCloseNoti={() => setOpenNoti(false)}
        // backHref={from || `/${params.cycleId}/evaluator/defineKpi`}
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <Shell>{children}</Shell>
    </NotificationProvider>
  );
}