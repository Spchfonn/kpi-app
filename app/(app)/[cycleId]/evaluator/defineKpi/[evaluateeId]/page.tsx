"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiLevelBox from '@/components/KpiLevelBox'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react'

type LoginUser = {
	userId: string;
	employeeId: string;
	cycle: { id: string; name: string }; // id = cyclePublicId
	availableRoles: string[];
};

type KpiTypeChoices = "QUANTITATIVE" | "QUALITATIVE" | "CUSTOM";
type NodeType = "GROUP" | "ITEM";

type KpiType = { id: string; type: KpiTypeChoices; name: string; rubric: any };

type Node = {
	id?: string;
	nodeType: NodeType;
	title: string;
	description?: string | null;
  
	weightPercent: number;
  
	// ITEM only
	typeId?: string | null;
	unit?: string | null;
	startDate?: string | null; // ISO
	endDate?: string | null;   // ISO
  
	children: Node[];
  
	// computed from server
	displayNo?: string;
	type?: KpiType | null;
};

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type PlanConfirmTarget = "EVALUATOR" | "EVALUATEE" | null;

const PLAN_CONFIRM_UI: Record<PlanConfirmStatus, { label: string; className: string }> = {
	DRAFT: { label: "ยังไม่กำหนดตัวชี้วัด", className: "text-myApp-red" },
	REQUESTED: { label: "รอการอนุมัติ/รับรอง", className: "text-myApp-orange" },
	CONFIRMED: { label: "กำหนดตัวชี้วัดสมบูรณ์", className: "text-myApp-green" },
	REJECTED: { label: "ตัวชี้วัดถูกปฏิเสธ", className: "text-myApp-red" },
	CANCELLED: { label: "ยกเลิกคำขอ", className: "text-myApp-blueDark" },
};

//
// helper
//
function getLoginUser(): LoginUser | null {
	try {
		const raw = localStorage.getItem("user");
		if (!raw) return null;
		return JSON.parse(raw) as LoginUser;
	} catch {
	  	return null;
	}
}

function toNum(v: any) {
	const n = typeof v === "string" ? Number(v) : v;
	return Number.isFinite(n) ? n : 0;
}
 
function normalizeNode(n: any): Node {
	return {
		id: n.id,
		nodeType: n.nodeType,
		title: n.title,
		description: n.description ?? null,
		weightPercent: toNum(n.weightPercent),
	
		typeId: n.typeId ?? null,
		unit: n.unit ?? null,
		startDate: n.startDate ?? null,
		endDate: n.endDate ?? null,
	
		displayNo: n.displayNo,
		type: n.type ?? null,
	
		children: Array.isArray(n.children) ? n.children.map(normalizeNode) : [],
	};
}

function stripForPut(n: Node): any {
	return {
		id: n.id,
		nodeType: n.nodeType,
		title: n.title,
		description: n.description ?? null,
		weightPercent: n.weightPercent,
	
		typeId: n.nodeType === "ITEM" ? (n.typeId ?? null) : null,
		unit: n.nodeType === "ITEM" ? (n.unit ?? null) : null,
		startDate: n.nodeType === "ITEM" ? (n.startDate ?? null) : null,
		endDate: n.nodeType === "ITEM" ? (n.endDate ?? null) : null,
	
		children: n.nodeType === "GROUP" ? (n.children ?? []).map(stripForPut) : [],
	};
}

const page = () => {
	const router = useRouter();
	const { cycleId, evaluateeId } = useParams<{
		cycleId: string;
		evaluateeId: string;
	}>();
	const [evaluateeName, setEvaluateeName] = useState<string>("");

	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string>("");

	const [confirmStatus, setConfirmStatus] = useState<PlanConfirmStatus>("DRAFT");
	const [confirmTarget, setConfirmTarget] = useState<PlanConfirmTarget>(null);

	const isRequested = confirmStatus === "REQUESTED";
	const lockEdit = confirmStatus === "REQUESTED" || confirmStatus === "CONFIRMED";

	const [planId, setPlanId] = useState<string | null>(null);
	const [types, setTypes] = useState<KpiType[]>([]);
	const [tree, setTree] = useState<Node[]>([]);

	// for handle if click cancel in edit mode
	const [draftTree, setDraftTree] = useState<Node[]>([]);

	// for confirm delete
	const [confirmOpenDelete, setConfirmOpenDelete] = useState(false);

	// for confirm send noti
	const [confirmOpenConfirm, setConfirmOpenConfirm] = useState(false);
	const [confirmOpenCancel, setConfirmOpenCancel] = useState(false);

	const [cycleStartIso, setCycleStartIso] = useState<string>("");
	const [cycleEndIso, setCycleEndIso] = useState<string>("");

	// get plan for DB
	useEffect(() => {
		(async () => {
			setLoading(true);
			setError("");
		
			try {
				const u = getLoginUser();
				if (!u?.employeeId || !u?.cycle?.id) {
					router.push("/sign-in");
					return;
				}
		
				// (optional) check role
				// const role = localStorage.getItem("activeRole");
				// if (role !== "EVALUATOR") router.push("/sign-in/selectRole");
		
				const cyclePublicId = cycleId;
				const evaluatorId = u.employeeId;
		
				// 1) resolvePlan -> get planId
				const resResolve = await fetch(
					`/api/evaluationAssignments/resolvePlan?cyclePublicId=${encodeURIComponent(
						cyclePublicId
					)}&evaluatorId=${encodeURIComponent(evaluatorId)}&evaluateeId=${encodeURIComponent(
						evaluateeId
					)}`,
					{ cache: "no-store" }
				);

				const jResolve = await resResolve.json();
				if (!jResolve.ok) throw new Error(jResolve.message ?? "resolvePlan failed");

				const c = jResolve.data.cycle;
				setCycleStartIso(c.startDate); // ISO string
				setCycleEndIso(c.endDate);

				setEvaluateeName(jResolve.data.evaluatee?.fullNameTh ?? "");

				const pid = jResolve.data.planId as string;
				setPlanId(pid);
		
				// 2) get kpiTypes + plan tree (parallel)
				const [resTypes, resPlan] = await Promise.all([
					fetch("/api/kpiTypes", { cache: "no-store" }),
					fetch(`/api/kpiPlans/${pid}`, { cache: "no-store" }),
				]);
		
				const jTypes = await resTypes.json();
				const jPlan = await resPlan.json();
		
				if (jTypes.ok) setTypes(jTypes.data as KpiType[]);
				if (!jPlan.ok) throw new Error(jPlan.message ?? "get plan failed");
		
				const loadedTree: Node[] = (jPlan.data.tree ?? []).map(normalizeNode);
		
				setTree(loadedTree);
				setDraftTree(loadedTree); // initial draft
				setConfirmStatus((jPlan.data.confirmStatus ?? "DRAFT") as PlanConfirmStatus);
				setConfirmTarget((jPlan.data.confirmTarget ?? null) as PlanConfirmTarget);
			} catch (e: any) {
				console.error(e);
				setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
			} finally {
				setLoading(false);
			}
		})();
	}, [evaluateeId, router]);

	// edit controls
	const startEdit = () => {
		setDraftTree(tree);
		setMode("edit");
		setShowAllDetails(true);
	};

	const cancelEdit = () => {
		setDraftTree(tree);
		setMode("view");
	};

	const saveEdit = async () => {
		if (!planId) return;
	
		setSaving(true);
		setError("");
	
		try {
			const payload = { nodes: draftTree.map(stripForPut) };
		
			const res = await fetch(`/api/kpiPlans/${planId}/tree`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const j = await res.json();
			if (!j.ok) {
				const msg = j.message ?? (j.errors ? JSON.stringify(j.errors) : "บันทึกไม่สำเร็จ");
				throw new Error(msg);
			}
		
			// server send tree + displayNo back
			const nextTree: Node[] = (j.data.tree ?? []).map(normalizeNode);
			setTree(nextTree);
			setDraftTree(nextTree);
			setMode("view");
		} catch (e: any) {
			console.error(e);
			setError(e?.message ?? "บันทึกไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};

	const goCopyKpi = () => {
		router.push(
		  `/${encodeURIComponent(cycleId)}/evaluator/defineKpi/${encodeURIComponent(evaluateeId)}/copyKpi?targetPlanId=${encodeURIComponent(planId ?? "")}`
		);
	};

	const requestConfirm = async () => {
		if (!planId) return;
	  
		setSaving(true);
		setError("");
	  
		try {
			const endpoint = isRequested
				? `/api/kpiPlans/${planId}/cancelRequestConfirm`
				: `/api/kpiPlans/${planId}/requestConfirm`;
		
			const res = await fetch(endpoint, { method: "POST" });
			const j = await res.json();
			if (!j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
		
			const reloadPlanStatus = async () => {
				const r = await fetch(`/api/kpiPlans/${planId}`, { cache: "no-store" });
				const j = await r.json();
				if (r.ok && j.ok) {
					setConfirmStatus(j.data.confirmStatus);
					setConfirmTarget(j.data.confirmTarget ?? null);
				}
			};
			  
			await reloadPlanStatus();
		} catch (e: any) {
		  	setError(e?.message ?? "ทำรายการไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};

	if (loading) {
		return <div className="px-20 py-7.5">Loading...</div>;
	}

  	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-7'>
				<p className='text-title font-medium text-myApp-blueDark'>
					{`กำหนดตัวชี้วัด (${evaluateeName})`}
				</p>
				<div className='flex flex-1 gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>สถานะการกำหนดตัวชี้วัด</p>
					<p className={`text-button font-semibold ${PLAN_CONFIRM_UI[confirmStatus].className}`}>
						{PLAN_CONFIRM_UI[confirmStatus].label}
					</p>
				</div>
				<p className="text-center text-body font-medium text-myApp-blueDark">
					รูปแบบการกำหนดตัวชี้วัด : 2 ระดับ
				</p>
			</div>

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				{mode === "view" && (
					<Button 
					variant={showAllDetails ? "outline" : "primary"}
					primaryColor="blueDark"
					onClick={() => setShowAllDetails((prev) => !prev)}
					>
						{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
					</Button>
				)}
				

				<Button
					variant="primary"
					primaryColor="yellow"
					onClick={goCopyKpi}>
					คัดลอกตัวชี้วัด
				</Button>

				<Button variant="primary" primaryColor="pink">ให้ระบบช่วยแนะนำตัวชี้วัด</Button>

				<div className="flex ml-auto gap-2.5">
					{/* if in 'view' mode, show edit button
					if in 'edit' mode, show save and cancel button */}
					{mode === "view" ? (
						<>
						<Button 
							variant={isRequested ? "outline" : "primary"}
							primaryColor="green"
							onClick={() => {
								if (saving) return;
								if (isRequested) setConfirmOpenCancel(true);
								else setConfirmOpenConfirm(true);
							}}
							disabled={saving}
						>
							{isRequested ? "ยกเลิกการขอให้รับรองตัวชี้วัด" : "ขอให้รับรองตัวชี้วัด"}
						</Button>
						<Button onClick={startEdit} variant="primary" primaryColor="orange" disabled={lockEdit}>แก้ไข</Button>
						</>
					) : (
						<>
						<Button onClick={cancelEdit} primaryColor="red">ยกเลิก</Button>
						<Button onClick={saveEdit} variant="primary">บันทึก</Button>
						</>
					)}
				</div>
			</div>

			{error && (
				<div className="mb-3 p-3 rounded-xl border border-myApp-red bg-white text-myApp-red text-sm">
					{error}
				</div>
			)}

			<div className='flex-1 overflow-y-auto'>
				<TwoLevelKpiTable
					mode={mode}
					showAllDetails={showAllDetails}
					selectable={false}
					tree={mode === "edit" ? draftTree : tree}
					kpiTypes={types}
					onChangeTree={setDraftTree}
					defaultStartDate={cycleStartIso}
  					defaultEndDate={cycleEndIso}
				/>
			</div>

			<ConfirmBox
				open={confirmOpenDelete}
				message="ต้องการลบตัวชี้วัดแถวนี้ใช่หรือไม่?"
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={() => setConfirmOpenDelete(false)}
        		onConfirm={() => setConfirmOpenDelete(false)}
			/>

			{/* confirm for send confirm kpi noti */}
			<ConfirmBox
				open={confirmOpenConfirm}
				message={`ต้องการขอให้ ${evaluateeName} รับรองตัวชี้วัดใช่หรือไม่?`}
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={() => setConfirmOpenConfirm(false)}
        		onConfirm={async () => {
					setConfirmOpenConfirm(false);
					await requestConfirm();
				}}
			/>

			{/* confirm for send cancel confirm kpi noti */}
			<ConfirmBox
				open={confirmOpenCancel}
				message={`ต้องการยกเลิกการขอให้ ${evaluateeName} รับรองตัวชี้วัดใช่หรือไม่?`}
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={() => setConfirmOpenCancel(false)}
				onConfirm={async () => {
					setConfirmOpenCancel(false);
					await requestConfirm();
				}}
			/>
		</div>
	</>
  )
}

export default page
