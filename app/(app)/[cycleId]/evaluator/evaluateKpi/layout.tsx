import React from "react";
import UserNavBarForEvaluateKpi from "@/components/user/UserNavBarForEvaluateKpi";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserNavBarForEvaluateKpi />
      <main>{children}</main>
    </>
  );
}
