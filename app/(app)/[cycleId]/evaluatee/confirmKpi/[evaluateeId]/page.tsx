"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react'

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

function assignDisplayNo(tree: Node[]): Node[] {
  return tree.map((group, gi) => {
	const groupNo = `${gi + 1}`;
	return {
	  ...group,
	  displayNo: groupNo,
	  children: group.children.map((item, ii) => ({
		...item,
		displayNo: `${groupNo}.${ii + 1}`,
	  })),
	};
  });
}

const getNodeKey = (n: Node) => n.id || n.displayNo || "";

const page = () => {
	const router = useRouter();
	const { cycleId, evaluateeId } = useParams<{
		cycleId: string;
		evaluateeId: string;
	}>();
	const [evaluateeName, setEvaluateeName] = useState<string>("");
	const [employeeData, setEmployeeData] = useState<any>(null);

	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false); 
	const [error, setError] = useState<string>("");

	const [confirmStatus, setConfirmStatus] = useState<PlanConfirmStatus>("DRAFT");
	const [confirmTarget, setConfirmTarget] = useState<PlanConfirmTarget>(null);

	const [planId, setPlanId] = useState<string | null>(null);
	const [types, setTypes] = useState<KpiType[]>([]);
	const [tree, setTree] = useState<Node[]>([]);

	// for handle if click cancel in edit mode
	const [draftTree, setDraftTree] = useState<Node[]>([]);

	// for confirm delete
	const [confirmOpenDelete, setConfirmOpenDelete] = useState(false);

	// for confirm send noti
	const [confirmOpenConfirm, setConfirmOpenConfirm] = useState(false);
	const [confirmOpenReject, setConfirmOpenReject] = useState(false);

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

	const confirmKpi = async () => {
		if (!planId) return;
	  
		setSaving(true);
		setError("");
	  
		try {
			const res = await fetch(`/api/kpiPlans/${planId}/confirmByEvaluatee`, { method: "POST" });
			const j = await res.json();
			if (!j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
		
			const r = await fetch(`/api/kpiPlans/${planId}`, { cache: "no-store" });
			const jj = await r.json();
			if (r.ok && jj.ok) {
				setConfirmStatus(jj.data.confirmStatus);
				setConfirmTarget(jj.data.confirmTarget ?? null);
			}
		} catch (e: any) {
		  	setError(e?.message ?? "ทำรายการไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};
	  
	const rejectKpi = async () => {
		if (!planId) return;
	  
		setSaving(true);
		setError("");
	  
		try {
			const res = await fetch(`/api/kpiPlans/${planId}/rejectByEvaluatee`, { method: "POST" });
			const j = await res.json();
			if (!j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
		
			const r = await fetch(`/api/kpiPlans/${planId}`, { cache: "no-store" });
			const jj = await r.json();
			if (r.ok && jj.ok) {
				setConfirmStatus(jj.data.confirmStatus);
				setConfirmTarget(jj.data.confirmTarget ?? null);
			}
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
				
				<div className="flex ml-auto gap-2.5">
					<Button 
						variant="primary"
						primaryColor="red"
						onClick={() => {setConfirmOpenReject(true)}}
						disabled={saving}
					>
						ปฏิเสธการรับรองตัวชี้วัด
					</Button>
					<Button 
						variant="primary"
						primaryColor="green"
						onClick={() => {setConfirmOpenConfirm(true)}}
						disabled={saving}
					>
						รับรองตัวชี้วัด
					</Button>
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
				message={`ต้องการรับรองตัวชี้วัดใช่หรือไม่?`}
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={() => setConfirmOpenConfirm(false)}
				onConfirm={async () => {
					setConfirmOpenConfirm(false);
					await confirmKpi();
				}}
			/>

			{/* confirm for send reject confirm kpi noti */}
			<ConfirmBox
				open={confirmOpenReject}
				message={`ต้องการปฏิเสธการรับรองตัวชี้วัดใช่หรือไม่?`}
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={() => setConfirmOpenReject(false)}
				onConfirm={async () => {
					setConfirmOpenReject(false);
					await rejectKpi();
				}}
			/>
		</div>
	</>
  )
}

export default page
