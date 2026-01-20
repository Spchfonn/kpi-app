import React from "react";
import UserNavBarForDefineKpi from "@/components/user/UserNavBarForDefineKpi";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserNavBarForDefineKpi />
      <main>{children}</main>
    </>
  );
}
