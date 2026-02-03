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
	CANCELLED: { label: "ยกเลิกคำขอ", className: "text-myApp-red" },
};

type GateState = { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };

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

function formatBangkok(dtIso: string) {
	const d = new Date(dtIso);
	return new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Bangkok",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(d);
}

type PlanEvent = { type: string; createdAt: string };

function latestEventAt(events: PlanEvent[] | undefined, type: string): string | null {
	if (!events?.length) return null;
	const filtered = events.filter(e => e.type === type && e.createdAt);
	if (!filtered.length) return null;
	filtered.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
	return filtered[0].createdAt;
}

async function fetchJson(url: string, init?: RequestInit) {
	const res = await fetch(url, { cache: "no-store", ...(init || {}) });
	const text = await res.text();
	let j: any = null;
	try { j = text ? JSON.parse(text) : null; } catch { j = null; }
	return { res, j };
}

const page = () => {
	const router = useRouter();
	const { cycleId, assignmentId } = useParams<{ cycleId: string; assignmentId: string; }>();
	const [planId, setPlanId] = useState<string | null>(null);

	const [gates, setGates] = useState<GateState | null>(null);
	const defineOpen = gates?.DEFINE ?? true;

	const [evaluateeName, setEvaluateeName] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false); 
	const [error, setError] = useState<string>("");
	
	const [confirmStatus, setConfirmStatus] = useState<PlanConfirmStatus>("DRAFT");
	const [confirmTarget, setConfirmTarget] = useState<PlanConfirmTarget>(null);

	const [confirmRequestedAt, setConfirmRequestedAt] = useState<string | null>(null);
	const [events, setEvents] = useState<PlanEvent[]>([]);
	
	const [types, setTypes] = useState<KpiType[]>([]);
	const [tree, setTree] = useState<Node[]>([]);
	const [showAllDetails, setShowAllDetails] = useState(false);
	
	// for confirm send noti
	const [confirmOpenConfirm, setConfirmOpenConfirm] = useState(false);
	const [confirmOpenReject, setConfirmOpenReject] = useState(false);
	
	const [cycleStartIso, setCycleStartIso] = useState<string>("");
	const [cycleEndIso, setCycleEndIso] = useState<string>("");

	const [rejectReason, setRejectReason] = useState("");
	const [rejectReasonOpen, setRejectReasonOpen] = useState(false);

	const canAct = confirmStatus === "REQUESTED" && confirmTarget === "EVALUATEE";

	useEffect(() => {
		(async () => {
			try {
				const { res, j } = await fetchJson(`/api/evaluationCycles/${encodeURIComponent(cycleId)}/gates`);
				if (res.ok && j?.ok) setGates(j.gates);
			} catch (e) { console.error(e); }
		})();
	}, [cycleId]);

	async function loadAll() {
		setLoading(true);
		setError("");
  
		try {
			const u = getLoginUser();
			if (!u?.employeeId || !u?.cycle?.id) {
				router.push("/sign-in");
				return;
			}
	
			// load types + assignment plan (parallel)
			const [typesRes, apRes] = await Promise.all([
				fetchJson("/api/kpiTypes"),
				fetchJson(`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/plans`),
			]);
	
			if (typesRes.res.ok && typesRes.j.ok) setTypes(typesRes.j.data as KpiType[]);
	
			if (!apRes.res.ok || !apRes.j.ok) {
				throw new Error(apRes.j.message ?? "โหลดแผนตัวชี้วัดไม่สำเร็จ");
			}
	
			const pid = apRes.j.data?.plan?.id as string | undefined;
			if (!pid) {
				// ไม่มี plan ที่ evaluatee เห็นได้ (ยังไม่ request)
				setPlanId(null);
				setTree([]);
				setConfirmStatus("DRAFT");
				setConfirmTarget(null);
				setEvaluateeName("");
				setCycleStartIso("");
				setCycleEndIso("");
				setLoading(false);
				return;
			}
	
			setPlanId(pid);
	
			// load plan detail
			const planRes = await fetchJson(`/api/plans/${encodeURIComponent(pid)}`);
			if (!planRes.res.ok || !planRes.j.ok) {
				throw new Error(planRes.j.message ?? "โหลดรายละเอียดแผนไม่สำเร็จ");
			}
	
			const data = planRes.j.data;

			setConfirmRequestedAt(data.confirmRequestedAt ?? null);
			setEvents((data.events ?? []) as PlanEvent[]);
	
			setConfirmStatus((data.confirmStatus ?? "DRAFT") as PlanConfirmStatus);
			setConfirmTarget((data.confirmTarget ?? null) as PlanConfirmTarget);
	
			if (data.cycle?.startDate) setCycleStartIso(data.cycle.startDate);
			if (data.cycle?.endDate) setCycleEndIso(data.cycle.endDate);
	
			if (data.evaluatee?.fullNameTh) setEvaluateeName(data.evaluatee.fullNameTh);
	
			const loadedTree: Node[] = (data.tree ?? []).map(normalizeNode);
			setTree(loadedTree);
		} catch (e: any) {
			console.error(e);
			setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [assignmentId]);

	const confirmKpi = async () => {
		if (!planId) return;
	
		setSaving(true);
		setError("");
	
		try {
			const { res, j } = await fetchJson(`/api/plans/${encodeURIComponent(planId)}/confirm`, {
				method: "POST",
			});
			if (!res.ok || !j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
			await loadAll();
		} catch (e: any) {
		  	setError(e?.message ?? "ทำรายการไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};
	  
	const rejectKpi = async (reason: string) => {
		if (!planId) return;
	  
		setSaving(true);
		setError("");
	  
		try {
			const { res, j } = await fetchJson(`/api/plans/${encodeURIComponent(planId)}/reject`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ reason }),
			});
		
			if (!res.ok || !j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
			await loadAll();
		} catch (e: any) {
		  	setError(e?.message ?? "ทำรายการไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};

	if (loading) {
		return <div className="px-20 py-7.5">Loading...</div>;
	}

	if (!planId) {
		return (
			<div className="px-20 py-7.5">
				<div className="text-title font-medium text-myApp-blueDark">รับรองตัวชี้วัด</div>
				<div className="mt-3 rounded-xl border p-4 text-sm text-myApp-blue">
					ยังไม่มีตัวชี้วัดที่ถูกส่งมาให้รับรองในตอนนี้
				</div>
			</div>
		);
	}

	const lastRequestedAt = latestEventAt(events, "REQUESTED");
	const lastCancelledAt = latestEventAt(events, "CANCELLED");
	const lastConfirmedAt = latestEventAt(events, "CONFIRMED");
	const lastRejectedAt = latestEventAt(events, "REJECTED");

  	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-7'>
				<p className='text-title font-medium text-myApp-blueDark'>
					{`รับรองตัวชี้วัด (${evaluateeName})`}
				</p>
				<div className='flex flex-1 gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>สถานะการกำหนดตัวชี้วัด</p>
					<p className={`text-button font-semibold ${PLAN_CONFIRM_UI[confirmStatus].className}`}>
						{PLAN_CONFIRM_UI[confirmStatus].label}
					</p>
					{confirmStatus === "REQUESTED" && lastRequestedAt && (
						<div className="text-center text-smallTitle font-medium text-myApp-blueDark mt-auto">
							( ผู้ประเมินส่งขอรับรองเมื่อ {formatBangkok(lastRequestedAt)} )
						</div>
					)}

					{confirmStatus === "CANCELLED" && lastCancelledAt && (
						<div className="text-center text-smallTitle font-medium text-myApp-blueDark mt-auto">
							( ผู้ประเมินยกเลิกคำขอเมื่อ {formatBangkok(lastCancelledAt)} )
						</div>
					)}

					{confirmStatus === "CONFIRMED" && lastConfirmedAt && (
						<div className="text-center text-smallTitle font-medium text-myApp-blueDark mt-auto">
							( รับรองแล้วเมื่อ {formatBangkok(lastConfirmedAt)} )
						</div>
					)}

					{confirmStatus === "REJECTED" && lastRejectedAt && (
						<div className="text-center text-smallTitle font-medium text-myApp-blueDark mt-auto">
							( ปฏิเสธแล้วเมื่อ {formatBangkok(lastRejectedAt)} )
						</div>
					)}
				</div>
				<p className="text-center text-body font-medium text-myApp-blueDark">
					รูปแบบการกำหนดตัวชี้วัด : 2 ระดับ
				</p>
			</div>

			{!defineOpen && (
			<div className="mb-3 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
				ตอนนี้ยังไม่เปิดช่วง “กำหนดตัวชี้วัด” จึงไม่สามารถรับรอง/ปฏิเสธได้
			</div>
			)}

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				<Button 
					variant={showAllDetails ? "outline" : "primary"}
					primaryColor="blueDark"
					onClick={() => setShowAllDetails((prev) => !prev)}
				>
					{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
				</Button>
				
				{canAct && (
					<div className="flex ml-auto gap-2.5">
						<Button 
							variant="primary"
							primaryColor="red"
							onClick={() => {
								setRejectReason("");
								setRejectReasonOpen(true);
							}}
							disabled={saving || !defineOpen}
						>
							ปฏิเสธการรับรองตัวชี้วัด
						</Button>
						<Button 
							variant="primary"
							primaryColor="green"
							onClick={() => {setConfirmOpenConfirm(true)}}
							disabled={saving || !defineOpen}
						>
							รับรองตัวชี้วัด
						</Button>
					</div>
				)}
			</div>

			{error && (
				<div className="mb-3 p-3 rounded-xl border border-myApp-red bg-white text-myApp-red text-sm">
					{error}
				</div>
			)}

			<div className='flex-1 overflow-y-auto'>
				<TwoLevelKpiTable
					mode="view"
					showAllDetails={showAllDetails}
					selectable={false}
					tree={tree}
					kpiTypes={types}
					onChangeTree={() => {}}
					defaultStartDate={cycleStartIso}
  					defaultEndDate={cycleEndIso}
				/>
			</div>

			{rejectReasonOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
					<div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
						<div className="text-lg font-semibold text-myApp-blueDark">เหตุผลที่ปฏิเสธ</div>
						<p className="mt-1 text-sm text-gray-600">
							กรุณาระบุเหตุผลเพื่อให้ผู้กำหนดตัวชี้วัดแก้ไขได้ถูกต้อง
						</p>

						<textarea
							className="mt-3 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-myApp-blue"
							rows={4}
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							placeholder="เช่น ตัวชี้วัดไม่สอดคล้องกับหน้าที่ / เกณฑ์คะแนนไม่เหมาะสม"
						/>

						<div className="mt-4 flex justify-end gap-2">
							<Button
								variant="primary"
								primaryColor="red"
								onClick={() => setRejectReasonOpen(false)}
								disabled={saving || !defineOpen}
							>
								ยกเลิก
							</Button>

							<Button
								variant="primary"
								primaryColor="green"
								disabled={saving || !defineOpen || !rejectReason.trim()}
								onClick={() => {
									setRejectReasonOpen(false);
									setConfirmOpenReject(true);
								}}
							>
								ถัดไป
							</Button>
						</div>
					</div>
				</div>
			)}

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
					await rejectKpi(rejectReason.trim());
				}}
			/>
		</div>
	</>
  )
}

export default page
