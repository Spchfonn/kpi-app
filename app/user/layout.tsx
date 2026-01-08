import React from "react";
import UserNavBar from "@/components/user/UserNavBar";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserNavBar />
      <main>{children}</main>
    </>
  );
}
