"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiUser, FiX } from "react-icons/fi";
import { BasicInfoObj } from "./EvaluationPairsTable";

type Owner = {
	id: string;
	employeeNo: string;
	name: string;
	lastName: string;
	position: string | BasicInfoObj;
	level: string | BasicInfoObj;
};

function getLabel(v: string | BasicInfoObj | null | undefined) {
	return typeof v === "string" ? v : v?.name ?? "";
}

type Props = {
	open: boolean;
	title?: string;
	selectedOwnerId?: string | null;
	onSelect: (owner: Owner) => void;
	onClose: () => void;

	// filter dropdown
	filterLabel?: string;
	filterValue?: string;
	filterOptions?: { value: string; label: string }[];
	onFilterChange?: (value: string) => void;
};

export default function SelectEmployeeModal({
	open,
	title = "เลือกพนักงาน",
	selectedOwnerId = null,
	onSelect,
	onClose,
	}: Props) {
	const panelRef = useRef<HTMLDivElement>(null);

	const [owners, setOwners] = useState<Owner[]>([]);
	const [loading, setLoading] = useState(false);
	const [errMsg, setErrMsg] = useState<string | null>(null);

	const [q, setQ] = useState("");

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	// fetch when open / q
	useEffect(() => {
		if (!open) return;
	
		const ctrl = new AbortController();
	
		async function load() {
			try {
				setLoading(true);
				setErrMsg(null);
		
				const params = new URLSearchParams();
				if (q.trim()) params.set("q", q.trim());
		
				const res = await fetch(`/api/employees?${params.toString()}`, {
					method: "GET",
					signal: ctrl.signal,
					headers: { "Content-Type": "application/json" },
					cache: "no-store",
				});
		
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
		
				const json = await res.json();
				setOwners(json.data ?? []);
			} catch (e: any) {
				if (e?.name === "AbortError") return;
				setErrMsg("โหลดรายชื่อพนักงานไม่สำเร็จ");
			} finally {
				setLoading(false);
			}
		}
	
		load();
		return () => ctrl.abort();
	}, [open, q]);

	const visibleOwners = useMemo(() => owners, [owners]);

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
			className="relative mx-auto mt-17 w-250 max-w-[95vw] h-150 rounded-2xl
					bg-myApp-white shadow-xl px-10 py-8 flex flex-col"
		>
			{/* header */}
			<div className="flex items-center gap-1">
				<h2 className="text-button font-semibold text-myApp-blueDark">
					{title}
				</h2>

				<button
					type="button"
					onClick={onClose}
					className="ml-auto rounded-full hover:bg-myApp-shadow/40 transition"
					aria-label="Close"
				>
					<FiX className="text-xl text-myApp-blueDark" />
				</button>
			</div>

			{/* search bar */}
			<div className="mt-4 flex items-center gap-3">
				<input
					value={q}
					onChange={(e) => setQ(e.target.value)}
					placeholder="ค้นหา: ชื่อ / รหัสพนักงาน / ตำแหน่ง"
					className="w-full rounded-2xl border border-myApp-grey px-4 py-2
								text-body outline-none focus:border-myApp-blueDark"
				/>
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

			{/* rows scroll */}
			<div className="mt-2 space-y-3 overflow-auto pr-1 flex-1 min-h-0">
				{loading && (
					<div className="text-body text-myApp-blueDark/70 py-4">กำลังโหลด...</div>
				)}

				{errMsg && (
					<div className="text-body text-myApp-red py-4">{errMsg}</div>
				)}

				{!loading && !errMsg && visibleOwners.length === 0 && (
					<div className="text-body text-myApp-blueDark/70 py-4">ไม่พบข้อมูล</div>
				)}

				{visibleOwners.map((o) => {
					const active = o.id === selectedOwnerId;
					return (
						<button
							key={o.id}
							type="button"
							onClick={() => onSelect(o)}
							className={`w-full grid grid-cols-[58px_136px_1fr_222px_132px]
							items-center rounded-2xl border py-2 text-left transition
							${active ? "border-myApp-blueDark bg-myApp-shadow/30" : "border-myApp-grey bg-myApp-white hover:bg-myApp-grey/20"}`}
						>
							<div className="flex items-center justify-center">
							<div className="w-8 h-8 rounded-full border-2 border-myApp-blueDark text-myApp-blueDark flex items-center justify-center">
								<FiUser />
							</div>
							</div>

							<div className="text-center text-body font-medium text-myApp-blueDark">{o.employeeNo}</div>
							<div className="text-left text-body font-medium text-myApp-blueDark">{o.name} {o.lastName}</div>
							<div className="text-left text-body font-medium text-myApp-blueDark">{getLabel(o.position)}</div>
							<div className="text-left text-body font-medium text-myApp-blueDark">{getLabel(o.level)}</div>
						</button>
					);
				})}
				</div>
		</div>
		</div>
	);
}