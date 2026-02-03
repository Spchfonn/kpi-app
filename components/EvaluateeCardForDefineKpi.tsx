"use client";
import Link from "next/link";
import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FiFileText, FiUser } from "react-icons/fi";

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type StripColor = "red" | "green" | "yellow";

const stripBg: Record<StripColor, string> = {
  red: "bg-myApp-red",
  green: "bg-myApp-green",
  yellow: "bg-myApp-yellow",
};

const STATUS_TO_STRIP_COLOR: Record<PlanConfirmStatus, StripColor> = {
  DRAFT: "red",
  REQUESTED: "yellow", // รออนุมัติ
  CONFIRMED: "green",  // อนุมัติแล้ว
  REJECTED: "red",
  CANCELLED: "red",
};

type Props = {
  id: string;
  name: string;
  title: string;
  stripColor?: StripColor;
  status?: PlanConfirmStatus;
  organization: string;
};

function PillButton({
	children,
	href,
  }: {
	children: React.ReactNode;
	href: string;
  }) {
	return (	
	  <Link
		href={href}
		onClick={(e) => {
		  e.stopPropagation();
		}}
		className={`
		  inline-flex items-center
		  px-2 py-1 rounded-full border
		  text-smallButton font-medium
		  transition
		  bg-myApp-white text-myApp-blueDark border-myApp-blueDark
		  hover:bg-myApp-blueDark hover:text-myApp-cream
		`}
	  >
		{children}
	  </Link>
	);
  }

export default function EvaluateeCardForDefineKpi({
  id,
  name,
  title,
  stripColor = "red",
  status,
  organization,
}: Props) {
	const router = useRouter();
	const pathname = usePathname();

	const activeStripColor: StripColor = useMemo(() => {
    if (!status) return stripColor; // ถ้าไม่มี status ใช้สี default

    const normalizedStatus = status.toUpperCase() as PlanConfirmStatus;
    return STATUS_TO_STRIP_COLOR[normalizedStatus] || stripColor;
  }, [status, stripColor]);
  
	// หา base path ของหน้าปัจจุบันให้เป็น /.../defineKpi หรือ /.../evaluateKpi
	const base = useMemo(() => {
	  if (!pathname) return "";
  
	  // ตัวอย่าง pathname:
	  // /1/evaluator/defineKpi
	  // /1/evaluator/defineKpi/123
	  // /1/evaluator/evaluateKpi
	  // /1/evaluator/evaluateKpi/123
	  const parts = pathname.split("/").filter(Boolean);
  
	  const idxDefine = parts.indexOf("defineKpi");
	  if (idxDefine !== -1) return "/" + parts.slice(0, idxDefine + 1).join("/");
  
	  const idxEval = parts.indexOf("evaluateKpi");
	  if (idxEval !== -1) return "/" + parts.slice(0, idxEval + 1).join("/");
  
	  // fallback (ถ้าเรียกการ์ดจากที่อื่น) — เลือก defineKpi ไว้ก่อน
	  return "/" + parts.slice(0, 2).join("/") + "/evaluator/defineKpi";
	}, [pathname]);
  
	const profileHref = `${base}/${id}/profile`;
	const defineKpiHref = `${base}/${id}`;

	return (
		<div
		role="link"
		tabIndex={0}
		onClick={() => router.push(profileHref)}
		onKeyDown={(e) => {
			if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			router.push(profileHref);
			}
		}}
		className="relative w-full max-w-120 max-h-33 cursor-pointer"
		>
			{/* card */}
			<div className="bg-myApp-white rounded-2xl shadow-sm px-10 py-4 flex gap-8 items-start">
				{/* left red strip */}
				<div className={`absolute left-0 top-0 h-full w-5 rounded-l-2xl ${stripBg[activeStripColor]}`} />

				<div>
					<div className="flex flex-1 gap-4">
						{/* avatar */}
						<div className="shrink-0">
						<div className="w-15 h-15 rounded-full border-3 border-myApp-blueDark flex items-center justify-center text-myApp-blueDark">
							<FiUser className="text-4xl" />
						</div>
						</div>

						{/* info */}
						<div className="flex-1">
							<div className="text-button font-semibold text-myApp-blueDark">{name}</div>
							<div className="text-smallTitle font-medium text-myApp-blueDark/80 mt-1">{title}</div>
							<div
								className="text-smallTitle font-medium text-myApp-blueDark/80 mt-1">
								{organization}
							</div>

						</div>
					</div>

					{/* tabs */}
					<div className="mt-3 flex flex-wrap gap-3">
						<PillButton href="/user/dashboard">Dashboard</PillButton>
						<PillButton href={defineKpiHref}>กำหนดตัวชี้วัด</PillButton>
					</div>
				</div>
			</div>
		</div>
	);
}