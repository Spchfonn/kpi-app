"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiUser, FiFilter, FiChevronDown, FiX } from "react-icons/fi";
import DropDown from "../DropDown";

type Owner = {
  id: string;           // internal id
  employeeNo: string;   // หมายเลขพนักงาน
  name: string;         // ชื่อ
  position: string;     // ตำแหน่ง
  level: string;        // ระดับ
};

type Props = {
  open: boolean;
  title?: string;
  owners: Owner[];
  selectedOwnerId?: string | null;
  onSelect: (owner: Owner) => void;
  onClose: () => void;

  // optional: filter dropdown
  filterLabel?: string;
  filterValue?: string;
  filterOptions?: { value: string; label: string }[];
  onFilterChange?: (value: string) => void;
};

export default function SelectOwnerKpiModal({
  open,
  title = "เลือกเจ้าของตัวชี้วัด",
  owners,
  selectedOwnerId = null,
  onSelect,
  onClose,
  filterLabel = "ตัวชี้วัดของผู้รับการประเมิน",
  filterValue = "",
  filterOptions = [	{ value: "op01", label: "ตัวชี้วัดของผู้รับการประเมิน" },
					{ value: "op02", label: "ตัวชี้วัดของผู้ระดับสูงกว่า" },
					{ value: "op03", label: "ตัวชี้วัดของผู้รับการประเมินอื่น" },
  ],
  onFilterChange,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
	if (!open) return;
	const onKey = (e: KeyboardEvent) => {
	  if (e.key === "Escape") onClose();
	};
	document.addEventListener("keydown", onKey);
	return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
	<div className="fixed inset-0 z-50">
	  {/* overlay */}
	  <button
		type="button"
		aria-label="Close modal"
		onClick={onClose}
		className="absolute inset-0 bg-black/20"
	  />

	  {/* panel */}
	  <div
		ref={panelRef}
		className="
		  relative
		  mx-auto mt-20
		  w-240 max-w-[92vw] h-140
		  rounded-3xl
		  bg-myApp-white
		  shadow-lg
		  px-10 py-8
		"
	  >
		{/* header */}
		<div className="flex items-center gap-1">
		  <h2 className="text-button font-semibold text-myApp-blueDark">
			{title}
		  </h2>

		  {/* filter */}
		  <div className="ml-6 flex items-center gap-2">
			<FiFilter className="text-myApp-blueDark text-lg" />

			<div className="relative">
				<DropDown
					value={filterValue || null}
					onChange={(v) => onFilterChange?.(v)}
					options={filterOptions}
				/>
			</div>
		  </div>

		  <button
			type="button"
			onClick={onClose}
			className="ml-auto rounded-full hover:bg-myApp-shadow/40 transition"
			aria-label="Close"
		  >
			<FiX className="text-xl text-myApp-blueDark" />
		  </button>
		</div>

		{/* table header */}
		<div className="mt-4 grid grid-cols-[58px_136px_1fr_222px_132px] items-center text-smallTitle font-semibold text-myApp-blueDark">
		  <div />
		  <div className="text-center">หมายเลขพนักงาน</div>
		  <div className="text-left">ชื่อ</div>
		  <div className="text-left">ตำแหน่ง</div>
		  <div className="text-left">ระดับ</div>
		</div>
		<div className="mt-2 h-0.5 w-full bg-myApp-blueDark" />

		{/* rows */}
		<div className="mt-2 space-y-3">
		  {owners.map((o) => {
			const active = o.id === selectedOwnerId;
			return (
			  <button
				key={o.id}
				type="button"
				onClick={() => onSelect(o)}
				className={`
				  w-full
				  grid grid-cols-[58px_136px_1fr_222px_132px]
				  items-center
				  rounded-2xl
				  border
				  py-2
				  text-left
				  transition
				  ${active ? "border-myApp-blueDark bg-myApp-shadow/30" : "border-myApp-grey bg-myApp-white hover:bg-myApp-grey/20"}
				`}
			  >
				<div className="flex items-center justify-center">
				  <div className="w-8 h-8 rounded-full border-2 border-myApp-blueDark text-myApp-blueDark flex items-center justify-center">
					<FiUser />
				  </div>
				</div>

				<div className="text-center text-body font-medium text-myApp-blueDark">
				  {o.employeeNo}
				</div>

				<div className="text-left text-body font-medium text-myApp-blueDark">
				  {o.name}
				</div>

				<div className="text-left text-body font-medium text-myApp-blueDark">
				  {o.position}
				</div>

				<div className="text-left text-body font-medium text-myApp-blueDark">
				  {o.level}
				</div>
			  </button>
			);
		  })}
		</div>

		{/* footer spacing */}
		<div className="h-8" />
	  </div>
	</div>
  );
}