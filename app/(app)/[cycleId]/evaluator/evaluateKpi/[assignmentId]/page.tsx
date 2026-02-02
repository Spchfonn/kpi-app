"use client";
import Button from '@/components/Button'
import ConfirmBox from '@/components/ConfirmBox';
import TwoLevelKpiTableForEvaluateKpi, { EvalScoreState, KpiTreeNode } from '@/components/TwoLevelKpiTableForEvaluateKpi';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react'

type LoginUser = {
	employeeId: string;              // evaluatorId
	cycle: { id: string; name: string }; // cyclePublicId
};
  
function getLoginUser(): LoginUser | null {
	try {
		const raw = localStorage.getItem("user");
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
	  	return null;
	}
}  

type EvalStatus = "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED";

const EVAL_STATUS_UI: Record<EvalStatus, { label: string; className: string }> = {
	NOT_STARTED: {
		label: "ยังไม่ประเมินตัวชี้วัด",
		className: "text-myApp-red",
	},
	IN_PROGRESS: {
		label: "กำลังประเมินตัวชี้วัด",
		className: "text-myApp-orange",
	},
	SUBMITTED: {
		label: "ประเมินตัวชี้วัดสมบูรณ์",
		className: "text-myApp-green",
	},
};

type EvaluateeItem = {
	assignmentId: string;
	currentPlanId: string | null;
	evalStatus: EvalStatus;
	evaluatee: { id: string; fullName: string; title: string };
};

type PlanRes = {
	ok: boolean;
	data?: {
		id: string;
		assignmentId: string;
		version: number;
		status: string;
		updatedAt: string;
		tree: KpiTreeNode[];
	};
	message?: string;
};

type ScoresRes = {
	ok: boolean;
	data?: {
	  	scores: Record<string, EvalScoreState>;
	};
	message?: string;
};
  
type SummaryRes = {
	ok: boolean;
	data?: {
		overallPercent: number;
		items: Array<{
			nodeId: string;
			title: string;
			score0to5: number;
			weightedPercent: number;
		}>;
	};
	message?: string;
};

type KpiType = { id: string; type: "QUANTITATIVE"|"QUALITATIVE"|"CUSTOM"; name: string; rubric?: any };

type GateState = { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };

const nodeKey = (n: KpiTreeNode) => n.id ?? n.clientId!;

function computeSummary(tree: KpiTreeNode[], scores: Record<string, EvalScoreState>) {
	const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  
	const computeItemScore0to5 = (item: KpiTreeNode): number => {
		const k = nodeKey(item);
		const st = scores[k] ?? { score: "", checkedIds: [] };
		
		const rubric = item.rubric ?? item.type?.rubric;
	
		// QUALITATIVE
		if (rubric?.kind === "QUALITATIVE_CHECKLIST") {
			const checklist = rubric.checklist ?? [];
			const checked = new Set((st.checkedIds ?? []).map(String));
	
			const totalW = checklist.reduce((sum: number, x: any) => sum + Number(x.weight_percent ?? 0), 0) || 0;
			const gotW = checklist.reduce((sum: number, x: any, i: number) => {
				const id = String(i + 1);
				return sum + (checked.has(id) ? Number(x.weight_percent ?? 0) : 0);
			}, 0);
	
			return clamp(totalW > 0 ? (gotW / totalW) * 5 : 0, 0, 5);
		}
	
		// QUANT/CUSTOM
		const s = st.score;
		return typeof s === "number" ? clamp(s, 0, 5) : 0;
	};
  
	// ITEM: percent local
	const itemByNode: Record<string, { score0to5: number; percentLocal: number }> = {};
  
	// GROUP: percent global
	const groupByNode: Record<string, { score0to5: number; percentGlobal: number }> = {};
  
	// return score0to5 of node
	const walk = (node: KpiTreeNode): number => {
		const key = nodeKey(node);
	
		if (node.nodeType === "ITEM") {
			const score0to5 = computeItemScore0to5(node);
			const wItem = Number(node.weightPercent ?? 0);
			const percentLocal = (score0to5 / 5) * wItem;
	
			itemByNode[key] = { score0to5, percentLocal };
			return score0to5;
		}
	
		// GROUP: aggregate children score by children weights
		const children = node.children ?? [];
		if (!children.length) {
			groupByNode[key] = { score0to5: 0, percentGlobal: 0 };
			return 0;
		}
	
		let sumW = 0;
		let sumScoreW = 0;
	
		for (const ch of children) {
			const chScore = walk(ch);
			const chW = Number(ch.weightPercent ?? 0); // weight of child in group
			sumW += chW;
			sumScoreW += chScore * chW;
		}
	
		const score0to5 = sumW > 0 ? sumScoreW / sumW : 0;
	
		const wGroup = Number(node.weightPercent ?? 0); // weight of group
		const percentGlobal = (score0to5 / 5) * wGroup;
	
		groupByNode[key] = { score0to5, percentGlobal };
		return score0to5;
	};
  
	for (const root of tree) walk(root);
  
	const overallPercent = tree.reduce( (sum, g) => sum + (groupByNode[nodeKey(g)]?.percentGlobal ?? 0), 0 );
  
	return { overallPercent, itemByNode, groupByNode };
}

async function fetchJson(url: string, init?: RequestInit) {
	const res = await fetch(url, { cache: "no-store", ...(init || {}) });
	const text = await res.text();
	let j: any = null;
	try { j = text ? JSON.parse(text) : null; } catch { j = null; }
	if (!res.ok || !j?.ok) throw new Error(j?.message ?? `request failed (${res.status})`);
	return j;
}

const page = () => {
	const router = useRouter();
	const { cycleId, assignmentId } = useParams<{ cycleId: string; assignmentId: string }>();

	const [gates, setGates] = useState<GateState | null>(null);
  	const evaluateOpen = gates?.EVALUATE ?? true;

	const [planId, setPlanId] = useState<string | null>(null);
	const [evaluateeName, setEvaluateeName] = useState<string>("");

	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [summarizing, setSummarizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [tree, setTree] = useState<KpiTreeNode[]>([]);
	const [scores, setScores] = useState<Record<string, EvalScoreState>>({});
	const [scoresDraft, setScoresDraft] = useState<Record<string, EvalScoreState>>({});

	const [evalStatus, setEvalStatus] = useState<EvalStatus>("NOT_STARTED");
	
	// 1) load gates
	useEffect(() => {
		(async () => {
			try {
				const j = await fetchJson(`/api/evaluationCycles/${encodeURIComponent(cycleId)}/gates`);
				setGates(j.gates as GateState);
			} catch (e) {
				console.error(e);
			}
		})();
	}, [cycleId]);

	// 2) load assignment -> plan (assignment-first)
	useEffect(() => {
		(async () => {
			setLoading(true);
			setError(null);
		
			try {
				const u = getLoginUser();
				if (!u?.employeeId || !u?.cycle?.id) {
					router.push("/sign-in");
					return;
				}
		
				// (A) get current visible plan for this assignment
				const ap = await fetchJson(`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/plans`);
				const pid = ap.data?.plan?.id;
				if (!pid) throw new Error("ยังไม่มีตัวชี้วัดที่รับรองแล้วสำหรับการประเมิน");

				setEvalStatus(ap.data.assignment.evalStatus as EvalStatus);
				setPlanId(pid);
		
				// (B) plan detail (tree + rubric)
				const plan = await fetchJson(`/api/plans/${encodeURIComponent(pid)}`);
				setTree(plan.data.tree ?? []);
		
				// (C) load existing scores from currentSubmission (new API idea: use /result)
				// ใช้ /evaluationAssignments/:id/result จะได้ node.currentSubmission (ถ้า evaluator/admin)
				const result = await fetchJson(`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/result`);
		
				// result.data.items: [{ id, nodeType, submission }]
				const items = result.data?.items ?? [];
				const scoreMap: Record<string, EvalScoreState> = {};
				for (const it of items) {
					if (!it?.id || !it.submission) continue;
					// note: คุณต้องแปลง payload ของ submission ให้เป็น EvalScoreState ให้ตรงกับ UI ของคุณ
					// ถ้า payload เก็บรูปแบบ {score, checkedIds} อยู่แล้ว -> ใช้ตรงได้เลย
					const payload = it.submission.payload;
					if (payload && typeof payload === "object") {
						scoreMap[it.id] = {
							score: payload.score ?? it.submission.finalScore ?? it.submission.calculatedScore ?? "",
							checkedIds: payload.checkedIds ?? [],
						};
					}
				}
				setScores(scoreMap);

				setEvaluateeName(plan.data.evaluatee?.fullNameTh ?? "");
		
			} catch (e: any) {
				setError(e?.message ?? "Load failed");
			} finally {
				setLoading(false);
			}
		})();
	}, [assignmentId, cycleId, router]);

	const preview = useMemo(() => {
		if (!tree.length) return { overallPercent: null as number | null, itemByNode: {}, groupByNode: {} };
	  
		const allComputedPercent = computeSummary(tree, scores);
	  
		return {
			overallPercent: Number(allComputedPercent.overallPercent.toFixed(2)),
			itemByNode: allComputedPercent.itemByNode,
			groupByNode: allComputedPercent.groupByNode,
		};
	}, [tree, scores]);


	// summary: count evaluated
	const itemKeys = useMemo(() => {
		const keys: string[] = [];
		const walk = (nodes: KpiTreeNode[]) => {
			for (const n of nodes) {
				if (n.nodeType === "ITEM" && n.id) keys.push(n.id);
				if (n.children?.length) walk(n.children);
			}
		};
		walk(tree);
		return keys;
	}, [tree]);
	
	const evaluatedCount = useMemo(() => {
		let c = 0;
		for (const k of itemKeys) {
			const st = scores[k];
			const hasScore = st?.score !== "" && st?.score !== undefined && st?.score !== null;
			const hasChecklist = Array.isArray(st?.checkedIds) && st!.checkedIds!.length > 0;
			if (hasScore || hasChecklist) c++;
		}
		return c;
	}, [itemKeys, scores]);

	const reloadScoresFromResult = async () => {
		const result = await fetchJson(`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/result`);
		const items = result.data?.items ?? [];
		const scoreMap: Record<string, EvalScoreState> = {};
		for (const it of items) {
			if (!it?.id || !it.submission) continue;
			const payload = it.submission.payload;
			if (payload && typeof payload === "object") {
				scoreMap[it.id] = {
					score: payload.score ?? it.submission.finalScore ?? it.submission.calculatedScore ?? "",
					checkedIds: payload.checkedIds ?? [],
				};
			}
		}
		setScores(scoreMap);
		setScoresDraft(scoreMap);
	};

	const isSubmitted = evalStatus === "SUBMITTED";
  	const lockEdit = !evaluateOpen || isSubmitted;

	// edit console
	const startEdit = () => {
		if (lockEdit) return;
		setScoresDraft(scores);
		setMode("edit");
	};
	
	const cancelEdit = () => {
		setScores(scoresDraft);
		setMode("view");
	}

	const saveEdit = async () => {
		if (!planId) return;
	
		setSaving(true);
		setError(null);
	
		try {
			// flatten item nodes from tree
			const itemNodes: KpiTreeNode[] = [];
			const walk = (arr: KpiTreeNode[]) => {
				for (const n of arr) {
				if (n.nodeType === "ITEM") itemNodes.push(n);
				if (n.children?.length) walk(n.children);
				}
			};
			walk(tree);
		
			// ยิง score เฉพาะ item ที่มีค่า (score หรือ checklist)
			for (const n of itemNodes) {
				const k = n.id!;
				const st = scores[k];
				if (!st) continue;
		
				const hasScore = st.score !== "" && st.score !== null && st.score !== undefined;
				const hasChecklist = Array.isArray(st.checkedIds) && st.checkedIds.length > 0;
				if (!hasScore && !hasChecklist) continue;
		
				// payload ที่ backend เก็บ: แนะนำให้เก็บ { score, checkedIds } ตรง ๆ
				await fetchJson(`/api/nodes/${encodeURIComponent(n.id!)}/score`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						payload: { score: st.score, checkedIds: st.checkedIds ?? [] },
						finalScore: typeof st.score === "number" ? st.score : null,
					}),
				});
			}
		
			await reloadScoresFromResult();
			setMode("view");
			setEvalStatus("IN_PROGRESS");
		} catch (e: any) {
			setError(e?.message ?? "Save failed");
		} finally {
			setSaving(false);
		}
	};

	const onSubmit = async () => {
		setSummarizing(true);
		setError(null);
		try {
			await fetchJson(`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/submitEvaluation`, {
				method: "POST",
			});

			const ap2 = await fetchJson(`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/plans`);
			setEvalStatus(ap2.data.assignment.evalStatus as EvalStatus);

			setMode("view");
		} catch (e: any) {
			const msg = e?.message ?? "Submit failed";
			if (/reeval|re-eval|needsreeval/i.test(msg)) {
			  	setError("KPI ถูกแก้ไขหลังเริ่มประเมิน กรุณาประเมินใหม่ตาม KPI ล่าสุดก่อนส่งผล");
			}
			else {
			  	setError(msg);
			}
		} finally {
		  	setSummarizing(false);
		}
	};

	const onSummary = async () => {
		try {
			setSummarizing(true);
			setError(null);
		
			const res = await fetch("/api/submissions/summary", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planId }),
			});
		
			const json = (await res.json()) as SummaryRes;
		
			if (!res.ok || !json.ok) {
				throw new Error(json.message || "Summary failed");
			}
		
		} catch (e: any) {
		  	setError(e?.message ?? "Summary failed");
		} finally {
		  	setSummarizing(false);
		}
	};

	if (loading) return <div className="p-10">Loading...</div>;
	if (error) return <div className="p-10 text-myApp-red">{error}</div>;

	const statusUI = EVAL_STATUS_UI[evalStatus] ?? EVAL_STATUS_UI.NOT_STARTED;

  	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-6'>
				<p className='text-title font-medium text-myApp-blueDark'>ประเมินตัวชี้วัด ({evaluateeName})</p>
				<div className='flex gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>สถานะการประเมินตัวชี้วัด</p>
					<p className={`text-button font-semibold ${statusUI?.className}`}>
						{statusUI.label}
					</p>
				</div>
				<div className='flex ml-auto gap-2'>
					<p className='text-title font-semibold text-myApp-blueDark'>สรุปผลคะแนน</p>
					<p className='text-title font-semibold text-myApp-blueDark'>
						{preview.overallPercent === null ? "-" : `${preview.overallPercent}%`}
					</p>
				</div>
			</div>

			{!evaluateOpen && (
				<div className="mb-3 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
					ตอนนี้ยังไม่เปิดช่วง “ประเมินตัวชี้วัด” คุณสามารถดูข้อมูลได้ แต่ไม่สามารถแก้ไข/ส่งผลการประเมินได้
				</div>
			)}

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				<Button 
					variant={showAllDetails ? "outline" : "primary"}
					primaryColor="blueDark"
					onClick={() => setShowAllDetails((prev) => !prev)}>
					{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
				</Button>

				<div className="flex ml-auto gap-2.5">

					{/* if in 'view' mode, show edit button
					if in 'edit' mode, show save and cancel button */}
					{mode === "view" ? (
						<>
							{!isSubmitted && (
							<Button
								variant="primary"
								primaryColor="green"
								onClick={onSubmit}
								disabled={!evaluateOpen || summarizing || saving}
							>
								{summarizing ? "กำลังส่งผล..." : "ส่งผลการประเมิน"}
							</Button>
							)}

							{!isSubmitted && (
							<Button
								onClick={startEdit}
								variant="primary"
								primaryColor="orange"
								disabled={lockEdit}
							>
								แก้ไขผลการประเมิน
							</Button>
							)}
						</>
					) : (
						<>
						<Button onClick={cancelEdit} primaryColor="red" disabled={saving}>ยกเลิก</Button>
						<Button onClick={saveEdit} variant="primary" disabled={saving}>บันทึก</Button>
						</>
					)}
				</div>
			</div>

			{error && <div className="mb-2 text-myApp-red text-sm">{error}</div>}

			<div className='flex-1 overflow-y-auto'>
				<TwoLevelKpiTableForEvaluateKpi
					mode={mode}
					readOnlyDetails={true}
					showAllDetails={showAllDetails}
					tree={tree}
					scores={scores}
					itemByNode={preview.itemByNode}
					groupByNode={preview.groupByNode}
					onChangeScores={setScores}
				/>
			</div>
		</div>
	</>
  )
}

export default page
