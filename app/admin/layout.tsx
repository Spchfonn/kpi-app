import React from "react";
import AdminNavBar from "@/components/admin/AdminNavBar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminNavBar />
      <main>{children}</main>
    </>
  );
}