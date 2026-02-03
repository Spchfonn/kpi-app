"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import KpiLevelBox from '@/components/KpiLevelBox'
import TwoLevelKpiTable from '@/components/TwoLevelKpiTable';
import TwoLevelKpiTableForGenerateKpi from '@/components/TwoLevelKpiTableForGenerateKpi';
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
	rubricDraft?: any | null;
  
	children: Node[];
  
	// computed from server
	displayNo?: string;
	type?: KpiType | null;
};

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";
type PlanConfirmTarget = "EVALUATOR" | "EVALUATEE" | null;

type DraftNodeInput = {
	tempId: string;
	parentTempId: string | null;
	nodeType: NodeType;
	title: string;
	description?: string | null;
	weightPercent: number;
	typeId?: string | null;
	unit?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	sortOrder?: number;
};

type GateState = { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };

const PLAN_CONFIRM_UI: Record<PlanConfirmStatus, { label: string; className: string }> = {
	"DRAFT": { label: "ยังไม่กำหนดตัวชี้วัด", className: "text-myApp-red" },
	"REQUESTED": { label: "รอการอนุมัติ/รับรอง", className: "text-myApp-orange" },
	"CONFIRMED": { label: "กำหนดตัวชี้วัดสมบูรณ์", className: "text-myApp-green" },
	"REJECTED": { label: "ตัวชี้วัดถูกปฏิเสธ", className: "text-myApp-red" },
	"CANCELLED": { label: "ยกเลิกคำขอ", className: "text-myApp-red" },
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
		rubricDraft: n.rubric ?? null,
	
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
		rubric: n.nodeType === "ITEM" ? (n.rubricDraft ?? n.type?.rubric ?? null) : null,
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

function toDraftInputs(tree: Node[]): DraftNodeInput[] {
	const out: DraftNodeInput[] = [];
  
	const walk = (n: Node, parentTempId: string | null, sortOrder: number) => {
		const tempId = n.id || `${parentTempId ?? "root"}:${n.displayNo ?? Math.random()}`;
		out.push({
			tempId,
			parentTempId,
			nodeType: n.nodeType,
			title: n.title,
			description: n.description ?? null,
			weightPercent: n.weightPercent,
			typeId: n.nodeType === "ITEM" ? (n.typeId ?? null) : null,
			unit: n.nodeType === "ITEM" ? (n.unit ?? null) : null,
			startDate: n.nodeType === "ITEM" ? (n.startDate ?? null) : null,
			endDate: n.nodeType === "ITEM" ? (n.endDate ?? null) : null,
			sortOrder,
		});
	
		if (n.nodeType === "GROUP") {
			(n.children ?? []).forEach((c, idx) => walk(c, tempId, idx));
		}
	};
  
	tree.forEach((g, idx) => walk(g, null, idx));
	return out;
}

const getNodeKey = (n: Node) => n.id || n.displayNo || "";

async function fetchJson(url: string, init?: RequestInit) {
	const res = await fetch(url, { cache: "no-store", ...(init || {}) });
	const text = await res.text();
  
	let j: any = null;
	try { j = text ? JSON.parse(text) : null; } catch { j = null; }
  
	if (!res.ok || !j?.ok) {
		console.error("API failed", { url, status: res.status, bodyPreview: text.slice(0, 200), json: j });
		throw new Error(j?.message ?? `Request failed (${res.status})`);
	}
	return j;
}

const page = () => {
	const router = useRouter();
	const params = useParams();
	const cycleId = (params?.cycleId as string) || "";
	const evaluateeId = (params?.evaluateeId as string) || "";
	const ready = Boolean(cycleId && evaluateeId);
	const [evaluateeName, setEvaluateeName] = useState<string>("");
	const [employeeData, setEmployeeData] = useState<any>(null);

	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false); 
	const [isGenerating, setIsGenerating] = useState(false); // เพิ่ม State แยกสำหรับการ Generate AI
	const [error, setError] = useState<string>("");

	const [confirmStatus, setConfirmStatus] = useState<PlanConfirmStatus>("DRAFT");
	const [confirmTarget, setConfirmTarget] = useState<PlanConfirmTarget>(null);

	const isRequested = confirmStatus === "REQUESTED";
	const isConfirmed = confirmStatus === "CONFIRMED";

	const [gates, setGates] = useState<GateState | null>(null);
	const defineOpen = gates?.DEFINE ?? true;
	const lockEdit = !defineOpen || confirmStatus === "REQUESTED" || confirmStatus === "CONFIRMED";

	const [planId, setPlanId] = useState<string | null>(null);
	const [types, setTypes] = useState<KpiType[]>([]);
	const [tree, setTree] = useState<Node[]>([]);
	const [assignmentId, setAssignmentId] = useState<string | null>(null);

	// for handle if click cancel in edit mode
	const [draftTree, setDraftTree] = useState<Node[]>([]);
	const { isWeightValid, validationErrorMsg } = useMemo(() => {
    // 1. เช็คผลรวมของ Level 1 (Groups)
    // หมายเหตุ: ถ้าข้อมูลตั้งต้นไม่มี Level 1 (เป็น Item เลย) ก็จะเช็ครวมกัน
    const totalLevel1 = draftTree.reduce((sum, node) => sum + (Number(node.weightPercent) || 0), 0);
    
    // ถ้าไม่มีข้อมูลเลย ให้ถือว่าผ่านไปก่อน (หรือจะให้ผิดก็ได้แล้วแต่ Logic)
    if (draftTree.length > 0 && totalLevel1 !== 100) {
      return { 
        isWeightValid: false, 
        validationErrorMsg: `น้ำหนักรวมของกลุ่ม (Level 1) ต้องเท่ากับ 100% (ปัจจุบัน ${totalLevel1}%)` 
      };
    }

    // 2. เช็คผลรวมของ Level 2 (Items ภายในแต่ละ Group)
    for (const group of draftTree) {
      // เช็คเฉพาะ Group ที่มีลูก
      if (group.children && group.children.length > 0) {
        const totalLevel2 = group.children.reduce((sum, child) => sum + (Number(child.weightPercent) || 0), 0);
        if (totalLevel2 !== 100) {
          return { 
            isWeightValid: false, 
            validationErrorMsg: `น้ำหนักรวมในกลุ่ม "${group.title}" ต้องเท่ากับ 100% (ปัจจุบัน ${totalLevel2}%)` 
          };
        }
      }

      // 3. เช็คเกณฑ์คะแนนเชิงคุณภาพ (Qualitative)
      for (const item of group.children) {
        const rubric = item.rubricDraft ?? item.type?.rubric;
        if (rubric?.kind === "QUALITATIVE_CHECKLIST") {
           const checklist = rubric.checklist ?? [];
           const total = checklist.reduce((sum: number, x: any) => sum + (Number(x.weight_percent) || 0), 0);
           if (total !== 100) {
              return { isWeightValid: false, validationErrorMsg: `น้ำหนักรวมของเกณฑ์คะแนนใน "${item.title}" ต้องเท่ากับ 100% (ปัจจุบัน ${total}%)` };
           }
        }
      }
    }

    return { isWeightValid: true, validationErrorMsg: "" };
  }, [draftTree]);

	// for confirm delete
	const [confirmOpenDelete, setConfirmOpenDelete] = useState(false);

	// for confirm send noti
	const [confirmOpenConfirm, setConfirmOpenConfirm] = useState(false);
	const [confirmOpenCancel, setConfirmOpenCancel] = useState(false);

	const [cycleStartIso, setCycleStartIso] = useState<string>("");
	const [cycleEndIso, setCycleEndIso] = useState<string>("");

	// AI & Inform States
	const [aiTree, setAiTree] = useState<Node[]>([]);
	const [showAiModal, setShowAiModal] = useState(false);
	const [showInformModal, setShowInformModal] = useState(false);
	const [aiSelectedIds, setAiSelectedIds] = useState<Set<string>>(new Set());
	const [showCountModal, setShowCountModal] = useState(false);
	const [targetKpiCount, setTargetKpiCount] = useState<number>(5);

	useEffect(() => {
		if (!cycleId) return;
		(async () => {
			try {
				const res = await fetch(`/api/evaluationCycles/${encodeURIComponent(cycleId)}/gates`, { cache: "no-store" });
				const j = await res.json().catch(() => null);
				if (res.ok && j?.ok) setGates(j.gates as GateState);
			} catch (e) {
				console.error("load gates failed:", e);
			}
		})();
	}, [cycleId]);

	useEffect(() => {
		if (!ready) return;
		(async () => {
			setLoading(true);
			setError("");
		
			try {
				const u = getLoginUser();
				if (!u?.employeeId || !u?.cycle?.id) {
					router.push("/sign-in");
					return;
				}
		
				// 1) หา assignmentId ของ evaluatorId + evaluateeId ใน cycle นี้
				const list = await fetchJson(
					`/api/evaluationAssignments/evaluatees?cyclePublicId=${encodeURIComponent(cycleId)}&evaluatorId=${encodeURIComponent(u.employeeId)}`,
				);
		
				const found = (list.data.items as any[]).find((x) => x.evaluatee.id === evaluateeId);
				if (!found?.assignmentId) throw new Error("ไม่พบ assignment ของผู้รับการประเมินคนนี้");
		
				const aid = found.assignmentId as string;
				setAssignmentId(aid);
		
				// 2) ดึง plan ที่ "current + เห็นได้"
				const ap = await fetchJson(`/api/evaluationAssignments/${encodeURIComponent(aid)}/plans`);
				let pid = ap.data?.plan?.id as string | undefined;

				// ครั้งแรกยังไม่มี plan -> สร้าง DRAFT ก่อน
				if (!pid) {
					const created = await fetchJson(
						`/api/evaluationAssignments/${encodeURIComponent(aid)}/plans`,
						{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ status: "DRAFT" }), // หรือ "ACTIVE" ถ้าคุณอยาก set currentPlanId เลย
						}
					);

					pid = created.data?.id as string | undefined;
				}

				if (!pid) {
					setError("ยังไม่สามารถสร้าง KPI plan ได้");
					setLoading(false);
					return;
				}

				setPlanId(pid);
		
				// 3) ดึง types + plan detail (plan detail ใหม่อยู่ที่ /api/plans/:planId)
				const [jTypes, jPlan] = await Promise.all([
					fetchJson("/api/kpiTypes"),
					fetchJson(`/api/plans/${pid}`),
				]);
		
				setTypes(jTypes.data as KpiType[]);
		
				// jPlan.data: เราปรับ /api/plans/[planId] ให้คืน tree + cycle + evaluatee/evaluator แล้ว
				setCycleStartIso(jPlan.data.cycle?.startDate ?? "");
				setCycleEndIso(jPlan.data.cycle?.endDate ?? "");
		
				const ev = jPlan.data.evaluatee;
				setEvaluateeName(ev?.fullNameTh ?? ev?.fullName ?? ev?.fullNameEn ?? "");
				setEmployeeData(ev ?? null);
		
				const loadedTree: Node[] = (jPlan.data.tree ?? []).map(normalizeNode);
				setTree(loadedTree);
				setDraftTree(loadedTree);
		
				setConfirmStatus((jPlan.data.confirmStatus ?? "DRAFT") as PlanConfirmStatus);
				setConfirmTarget((jPlan.data.confirmTarget ?? null) as PlanConfirmTarget);
			} catch (e: any) {
				console.error(e);
				setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
			} finally {
				setLoading(false);
			}
		})();
	}, [cycleId, evaluateeId, router]);

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
			const nodes = toDraftInputs(draftTree);
		
			const res = await fetch(`/api/plans/${planId}/saveDraft`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ nodes }),
			});
		
			const j = await res.json();
			if (!j.ok) throw new Error(j.message ?? "บันทึกไม่สำเร็จ");
		
			// ถ้า server สร้าง version ใหม่ จะได้ planId ใหม่กลับมา
			const nextPlanId = (j.planId as string) || planId;
			if (nextPlanId && nextPlanId !== planId) setPlanId(nextPlanId);
		
			// reload plan detail จาก server เพื่อได้ displayNo/type/rubric ถูกต้อง
			const jPlan = await fetchJson(`/api/plans/${nextPlanId}`);
			const nextTree: Node[] = (jPlan.data.tree ?? []).map(normalizeNode);
		
			setTree(nextTree);
			setDraftTree(nextTree);
			setConfirmStatus(jPlan.data.confirmStatus);
			setConfirmTarget(jPlan.data.confirmTarget ?? null);
		
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
				? `/api/plans/${planId}/cancel`
				: `/api/plans/${planId}/request`;
		
			const res = await fetch(endpoint, { method: "POST" });
			const j = await res.json();
			if (!j.ok) throw new Error(j.message ?? "ทำรายการไม่สำเร็จ");
		
			// reload status จาก plan ใหม่
			const jPlan = await fetchJson(`/api/plans/${planId}`);
			setConfirmStatus(jPlan.data.confirmStatus);
			setConfirmTarget(jPlan.data.confirmTarget ?? null);
		} catch (e: any) {
		  	setError(e?.message ?? "ทำรายการไม่สำเร็จ");
		} finally {
		  	setSaving(false);
		}
	};

   const openAiCountModal = () => {
      setTargetKpiCount(5); // reset default value
      setShowCountModal(true);
   };

   const generateKpiByAI = async (count: number) => {
         // ปิด Modal เลือกจำนวนก่อน
         setShowCountModal(false);

         try {
            setIsGenerating(true);
            setError("");
            setShowInformModal(true); 
      
            // ส่งค่า kpiCount ไปยัง API
            const res = await fetch("/api/generate-kpi", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({ 
                  evaluateeId,
                  kpiCount: count // [NEW] ส่งจำนวนข้อที่ต้องการไปให้ API (ต้องไปแก้ฝั่ง API ให้รับค่านี้ด้วย)
               }),
            });
      
            const j = await res.json();
            if (!j.success) throw new Error(j.error ?? "AI generate failed");
      
            // ... (Logic เดิมสำหรับการ map ข้อมูล unitMap, typeFullMap, aiNodes) ...
            // ... Copy Code ส่วนเดิมมาวางตรงนี้ได้เลยครับ ...
            // สร้าง Map สำหรับค้นหา Type Object เต็มรูปแบบตาม ID
            const typeFullMap = new Map(types.map((t) => [t.type.toLowerCase(), t]));
            
            const unitMap = new Map<string, string>();
            const measurementMap = new Map<string, any>();

            if (j.measurements?.kpi_measurements) {
               j.measurements.kpi_measurements.forEach((m: any) => {
                  const u = m.measurement?.unit || m.measurement?.metric_name; 
                  if (m.kpi_code && u) unitMap.set(m.kpi_code, u);
                  if (m.kpi_code) measurementMap.set(m.kpi_code, m);
               });
            }

            const aiNodes: Node[] = j.round1_raw.level1_groups.map((group: any) => ({
               nodeType: "GROUP",
               title: group.group_title,
               description: group.group_goal,
               weightPercent: group.group_percent,
               children: group.level2_kpis.map((kpi: any) => {
                  const typeObj = typeFullMap.get(kpi.kpi_type.toLowerCase());
                  
                  // Construct rubric from AI measurement
                  let rubricDraft = null;
                  const m = measurementMap.get(kpi.kpi_code);
                  if (m) {
                     const kpiType = kpi.kpi_type.toLowerCase();
                     if (kpiType === "qualitative" && m.checklist?.length) {
                        rubricDraft = {
                           kind: "QUALITATIVE_CHECKLIST",
                           checklist: m.checklist
                        };
                     } else if (kpiType === "quantitative" && m.scoring?.length) {
                        rubricDraft = {
                           kind: "QUANTITATIVE_1_TO_5",
                           levels: m.scoring.map((s: any) => ({
                              unit: unitMap.get(kpi.kpi_code) || "",
                              score: s.score,
                              value: s.condition,
                              desc: `${s.condition}`,
                           }))
                        };
                     } else if (kpiType === "custom" && m.scoring?.length) {
                        rubricDraft = {
                           kind: "CUSTOM_DESCRIPTION_1_TO_5",
                           levels: m.scoring.map((s: any) => ({
                              score: s.score,
                              desc: s.condition
                           }))
                        };
                     }
                  }

					return {
						nodeType: "ITEM",
						title: kpi.title,
						description: kpi.description,
						weightPercent: kpi.kpi_percent,
						typeId: typeObj?.id ?? null, // เก็บ ID ไว้
						type: typeObj ?? null,       // ใส่ Object Type (ที่มี rubric) เข้าไปด้วย
						unit: unitMap.get(kpi.kpi_code) || null,
						startDate: cycleStartIso,
						endDate: cycleEndIso,
						children: [],
					};
				}),
			}));
	
			const withDisplayNo = assignDisplayNo(aiNodes);
			setAiTree(withDisplayNo);
			
			const allIds = new Set<string>();
			withDisplayNo.forEach(p => {
					allIds.add(getNodeKey(p));
					p.children.forEach(c => allIds.add(getNodeKey(c)));
			});
			setAiSelectedIds(allIds);
	
			setShowInformModal(false); 
			setShowAiModal(true); 
	
		} catch (e: any) {
			console.error(e);
			setShowInformModal(false);
			setError(e.message ?? "ไม่สามารถสร้าง KPI จาก AI ได้");
		} finally {
			setIsGenerating(false); // ปิด isGenerating
		}
	};
	
	const handleConfirmAiSelection = () => {
		const selectedFromAi = aiTree.reduce<Node[]>((acc, group) => {
			const groupKey = getNodeKey(group);
			const selectedChildren = group.children.filter(child => aiSelectedIds.has(getNodeKey(child)));
			if (aiSelectedIds.has(groupKey) || selectedChildren.length > 0) {
				acc.push({ ...group, children: selectedChildren });
			}
			return acc;
		}, []);
	
		if (selectedFromAi.length === 0) return;
	
		const currentTree = mode === "edit" ? draftTree : tree;
		const mergedTree = [...currentTree, ...selectedFromAi];
		const finalTree = assignDisplayNo(mergedTree);
	
		setDraftTree(finalTree);
		setMode("edit");
		setShowAiModal(false);
		setAiTree([]);
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

			{!defineOpen && (
				<div className="mb-3 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
					ตอนนี้ยังไม่เปิดช่วง “กำหนดตัวชี้วัด” คุณสามารถดูข้อมูลได้ แต่ไม่สามารถแก้ไข/บันทึก/ส่งขอรับรองได้
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
				
				{!isConfirmed &&
					<>
						<Button
							variant="primary"
							primaryColor="yellow"
							onClick={goCopyKpi}
							disabled={!defineOpen}
						>
							คัดลอกตัวชี้วัด
						</Button>

						<Button
							variant="primary"
							primaryColor="pink"
							onClick={openAiCountModal}
						>
							ให้ระบบช่วยแนะนำตัวชี้วัด
						</Button>
					</>
				}
				
				{!isConfirmed &&
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
								disabled={saving || !defineOpen}
							>
								{isRequested ? "ยกเลิกการขอให้รับรองตัวชี้วัด" : "ขอให้รับรองตัวชี้วัด"}
							</Button>
							<Button onClick={startEdit} variant="primary" primaryColor="orange" disabled={lockEdit}>แก้ไข</Button>
							</>
						) : (
							<>
							{/* [ส่วนที่ต้องเพิ่ม]: แสดงข้อความเตือนสีแดงถ้าน้ำหนักผิด */}
							{!isWeightValid && (
								<div className="flex items-center text-myApp-red text-sm font-medium animate-pulse mr-2">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
								{validationErrorMsg}
								</div>
							)}
							<Button onClick={cancelEdit} primaryColor="red" disabled={!defineOpen || saving}>ยกเลิก</Button>
							<Button 
								onClick={saveEdit} 
								variant="primary" 
								disabled={!defineOpen || saving || !isWeightValid}
								className={!isWeightValid ? "opacity-50 cursor-not-allowed" : ""}
							>
								บันทึก
							</Button>
							</>
						)}
					</div>
				}
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

			{/* --- [NEW] Modal ถามจำนวน KPI --- */}
			{showCountModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
					<div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 transform transition-all scale-100">
						<div className="text-center mb-6">
							<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-pink-100 mb-4">
								<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
								</svg>
							</div>
							<h3 className="text-xl font-medium text-myApp-blueDark">ระบุจำนวนตัวชี้วัด</h3>
							<p className="text-sm text-gray-500 mt-2">
								ต้องการให้ระบบแนะนำตัวชี้วัดกี่ข้อ?
							</p>
						</div>

						<div className="mb-6">
							<label className="block text-sm font-normal text-gray-600 mb-2">
								จำนวนข้อที่ต้องการ
							</label>
							<input
								type="number"
								min={1}
								max={20}
								value={targetKpiCount}
								onChange={(e) => setTargetKpiCount(Number(e.target.value))}
								className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 sm:text-sm text-center font-semibold text-lg text-myApp-blueDark"
							/>
						</div>

						<div className="flex gap-3 justify-end">
							<Button
								variant="outline"
								primaryColor="red"
								onClick={() => setShowCountModal(false)}
							>
								ยกเลิก
							</Button>
							<Button
								variant="primary"
								primaryColor="green"
								onClick={() => generateKpiByAI(targetKpiCount)} // ส่งค่าที่เลือกไป generate
							>
								เริ่มสร้างตัวชี้วัด
							</Button>
						</div>
					</div>
				</div>
			)}


			{/* --- 1. Inform Data Modal (ขณะรอ AI) --- */}
			{showInformModal && (
				<div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in-95">
						<div className="mb-6 flex justify-center">
							<div className="w-16 h-16 border-4 border-t-pink-500 border-gray-100 rounded-full animate-spin"></div>
						</div>
						<h3 className="text-xl font-bold text-myApp-blueDark mb-2">กำลังเตรียมข้อมูลแนะนำ</h3>
						<p className="text-sm text-gray-500 mb-6">ระบบกำลังวิเคราะห์ข้อมูลพนักงานเพื่อออกแบบตัวชี้วัด</p>
						
						<div className="text-left bg-gray-50 p-5 rounded-xl space-y-3 border border-gray-100">
							<div className="flex justify-between border-b pb-2">
								<span className="text-xs text-gray-400 font-medium">ชื่อพนักงาน</span>
								<span className="text-sm text-gray-700 font-semibold">{evaluateeName}</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-xs text-gray-400 font-medium">ตำแหน่ง</span>
								<span className="text-sm text-gray-700 font-semibold">
									{employeeData?.position?.name || "-"}
								</span>
							</div>
							<div className="flex justify-between border-b pb-2">
								<span className="text-xs text-gray-400 font-medium">ระดับ</span>
								<span className="text-sm text-gray-700 font-semibold">
									{employeeData?.level?.name || "-"}
								</span>
							</div>
							<div className="flex justify-between">
								<span className="text-xs text-gray-400 font-medium">แผนก</span>
								<span className="text-sm text-gray-700 font-semibold">
									{employeeData?.organization?.name || "-"}
								</span>
							</div>
						</div>
						<p className="mt-6 text-xs text-gray-400 animate-pulse italic">
							* ขั้นตอนนี้อาจใช้เวลาประมาณ 30-40 วินาที...
						</p>
					</div>
				</div>
		 	)}

			{/* --- 2. AI Selection Modal --- */}
			{showAiModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-10">
					<div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

					<div className="px-6 py-3 flex justify-between items-center bg-gray-50">
						<div>
							<h3 className="text-l font-bold text-myApp-blueDark">ระบบแนะนำตัวชี้วัด</h3>
							<p className="text-sm text-gray-500">เลือกตัวชี้วัดที่ต้องการใช้</p>
						</div>
						<button 
							onClick={() => setShowAiModal(false)}
							className="text-gray-400 hover:text-gray-600 transition rounded-full p-1 hover:bg-gray-200"
						>
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<div className="flex-1 overflow-y-auto p-4 bg-gray-100/50">
						<TwoLevelKpiTableForGenerateKpi
							mode="view"
							showAllDetails={true} // ตัวนี้จะเป็นตัวสั่งให้กางเกณฑ์คะแนนออก
							selectable={true}
							selectedIds={aiSelectedIds}
							onSelectionChange={setAiSelectedIds}
							tree={aiTree} // ข้อมูลในนี้ต้องมี property 'type' ที่มี 'rubric' อยู่ข้างใน
							onChangeTree={setAiTree}
							kpiTypes={types}
							defaultStartDate={cycleStartIso}
							defaultEndDate={cycleEndIso}
						/>
					</div>

					<div className="px-6 py-2 bg-white flex justify-end gap-3 items-center">
						<div className="mr-auto text-sm text-gray-500">
							เลือกเพิ่มเติม <span className="font-semibold text-myApp-blueDark">{aiSelectedIds.size}</span> รายการ
						</div>
						
						<Button 
							variant="primary" 
							primaryColor="red"
							onClick={() => setShowAiModal(false)}
						>
							ยกเลิก
						</Button>
						
						<Button
							variant="primary"
							primaryColor="green"
							onClick={handleConfirmAiSelection}
							disabled={aiSelectedIds.size === 0}
						>
							ยืนยัน
						</Button>
					</div>
					</div>
				</div>
			)}

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
