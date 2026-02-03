"use client";
import Link from "next/link";
import React, { useMemo } from "react";
import { FiFileText, FiUser } from "react-icons/fi";

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type StripColor = "red" | "green" | "yellow";
type KpiDefineMode = "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS" | "EVALUATEE_DEFINES_EVALUATOR_APPROVES";

const stripBg: Record<StripColor, string> = {
  red: "bg-myApp-red",
  green: "bg-myApp-green",
  yellow: "bg-myApp-yellow",
};

const STATUS_TO_STRIP_COLOR: Record<PlanConfirmStatus, StripColor> = {
  DRAFT: "red",
  REQUESTED: "yellow",
  CONFIRMED: "green",
  REJECTED: "red",
  CANCELLED: "red",
};

type Props = {
  id: string;
  name: string;
  title: string;
  cycleId: string;
  evaluateeId: string;
  stripColor?: StripColor;
  status?: PlanConfirmStatus;
  kpiDefineMode: KpiDefineMode;
  assignmentId: string;
  planId?: string | null;
  organization: string;
};

function PillButton({ children, href }: { children: React.ReactNode; href: string; }) {
    return (
      <Link href={href} onClick={(e) => e.stopPropagation()} className="inline-flex items-center px-2 py-1 rounded-full border text-smallButton font-medium transition bg-myApp-white text-myApp-blueDark border-myApp-blueDark hover:bg-myApp-blueDark hover:text-myApp-cream">
       {children}
      </Link>
    );
   }
	
export default function EvaluatorCardForDefineKpi({
  id,
  name,
  title,
  cycleId,
  evaluateeId,
  stripColor = "red",
  status,
  kpiDefineMode,
  assignmentId,
  planId,
  organization,
}: Props) {

  console.log(`Card ${name}: status =`, status);

  const activeStripColor: StripColor = useMemo(() => {
    if (!status) return stripColor; // ถ้าไม่มี status ให้ใช้สี default (red)

    // แปลงเป็นตัวพิมพ์ใหญ่เพื่อให้ตรงกับ Key ใน STATUS_TO_STRIP_COLOR
    const normalizedStatus = status.toUpperCase() as PlanConfirmStatus;
    
    // คืนค่าสีตาม Map หรือถ้าหาไม่เจอให้ใช้ stripColor เดิม
    return STATUS_TO_STRIP_COLOR[normalizedStatus] || stripColor;
  }, [status, stripColor]);

  const actionConfig = useMemo(() => {
    if (!cycleId || !evaluateeId) return { href: "#", label: "Loading..." };

    // กรณี: ผู้ประเมินเป็นคนกำหนด (Evaluator Defines) -> ผู้ถูกประเมินทำได้แค่เข้าไป "ดู" (หรือ Copy)
    if (kpiDefineMode === "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS") {
      return {
        // ไปหน้า copyKpi 
        href: `/${cycleId}/evaluatee/confirmKpi/${assignmentId}`,
        label: "ดูข้อมูลตัวชี้วัด",
      };
    } 
    
    // กรณี: ผู้ถูกประเมินกำหนดเอง (Evaluatee Defines) -> ไปหน้ากำหนด KPI ปกติ
    else {
      return {
        href: `/${cycleId}/evaluatee/defineKpi/${evaluateeId}?evaluatorId=${id}`,
        label: "กำหนดตัวชี้วัด",
      };
    }
  }, [cycleId, evaluateeId, id, kpiDefineMode]);

	return (
		<div className="relative w-full max-w-120 max-h-33">
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

				{/* Action Buttons - เหลือแค่ปุ่มเดียวตามสั่ง */}
       	   <div className="mt-3 flex flex-wrap gap-3">
         	   <PillButton href={actionConfig.href}>{actionConfig.label}</PillButton>
					</div>
				</div>
			</div>
		</div>
	);
}