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

type EvaluateeItem = {
	assignmentId: string;
	currentPlanId: string | null;
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

const nodeKey = (n: KpiTreeNode) => n.id ?? n.clientId!;

const page = () => {
	const router = useRouter();
	const params = useParams<{ evaluateeId: string }>();
  	const evaluateeId = params.evaluateeId;

	const [planId, setPlanId] = useState<string | null>(null);
	const [evaluateeName, setEvaluateeName] = useState<string>("");

	const [mode, setMode] = useState<"view" | "edit">("view");
	const [showAllDetails, setShowAllDetails] = useState(false);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [summarizing, setSummarizing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [tree, setTree] = useState<KpiTreeNode[]>([]);
	const [types, setTypes] = useState<KpiType[]>([]);
	const [scores, setScores] = useState<Record<string, EvalScoreState>>({});
	const [scoresDraft, setScoresDraft] = useState<Record<string, EvalScoreState>>({});

	const [overallPercent, setOverallPercent] = useState<number | null>(null);

	// find currentPlanId from employeeId
	useEffect(() => {
		if (!evaluateeId) return;
	
		const run = async () => {
			try {
				setLoading(true);
				setError(null);
		
				const u = getLoginUser();
				if (!u?.employeeId || !u?.cycle?.id) {
					router.push("/sign-in");
					return;
				}
		
				const res = await fetch(
					`/api/evaluationAssignments/evaluatees?cyclePublicId=${encodeURIComponent(
						u.cycle.id
					)}&evaluatorId=${encodeURIComponent(u.employeeId)}`,
					{ cache: "no-store" }
				);
				const j = await res.json();
		
				if (!res.ok || !j.ok) throw new Error(j.message || "Load evaluatees failed");
		
				const items: EvaluateeItem[] = j.data?.items ?? [];
				const found = items.find((x) => String(x.evaluatee.id) === String(evaluateeId));
		
				if (!found) throw new Error("ไม่พบผู้รับการประเมินคนนี้ในรายการ");
				if (!found.currentPlanId) throw new Error("ผู้รับการประเมินคนนี้ยังไม่มี KPI Plan");
		
				setPlanId(found.currentPlanId);
				setEvaluateeName(found.evaluatee.fullName);
			} catch (e: any) {
				setError(e?.message ?? "Load failed");
			} finally {
				setLoading(false);
			}
		};
	
		run();
	}, [evaluateeId, router]);

	// load plan tree
	useEffect(() => {
		if (!planId) return;
	
		const run = async () => {
			try {
				setLoading(true);
				setError(null);
		
				const [planRes, scoreRes] = await Promise.all([
					fetch(`/api/kpiPlans/${planId}`, { cache: "no-store" }),
					fetch(`/api/submissions?planId=${planId}`, { cache: "no-store" }),
				]);
		
				const planJson: PlanRes = await planRes.json();
				if (!planRes.ok || !planJson.ok || !planJson.data) {
				 	throw new Error(planJson.message || "Load plan failed");
				}
				setTree(planJson.data.tree ?? []);
		
				let nextScores: Record<string, EvalScoreState> = {};

				try {
					const scoreJson = await scoreRes.json();
					if (scoreRes.ok && scoreJson.ok) {
						nextScores = scoreJson.data?.scores ?? {};
					}
					// not evaluate yet
					else {
						nextScores = {};
					}
				} catch {
					nextScores = {};
				}

				setScores(nextScores);
				setScoresDraft(nextScores);
			} catch (e: any) {
				setError(e?.message ?? "Load failed");
			} finally {
				setLoading(false);
			}
		};
	
		run();
	}, [planId]);

	// summary: count evaluated
	const itemKeys = useMemo(() => {
		const keys: string[] = [];
		const walk = (nodes: KpiTreeNode[]) => {
			for (const n of nodes) {
				if (n.nodeType === "ITEM") keys.push(nodeKey(n));
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

	// edit console
	const startEdit = () => {
		setScoresDraft(scores);
		setMode("edit");
	};

	const cancelEdit = () => {
		setScores(scoresDraft);
		setMode("view");
	};

	const saveEdit = async () => {
		try {
			setSaving(true);
			setError(null);
		
			const res = await fetch("/api/submissions", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ planId, scores }),
			});
		
			const text = await res.text();
     		if (!res.ok) throw new Error(text || "Save failed");
		
			setScoresDraft(scores)
			setMode("view");

			const reloadScores = async () => {
				const r = await fetch(`/api/submissions?planId=${planId}`, { cache: "no-store" });
				const j = await r.json();
				if (r.ok && j.ok) {
					setScores(j.data.scores ?? {});
					setScoresDraft(j.data.scores ?? {});
				}
			};

			await reloadScores();
			  
		} catch (e: any) {
		  	setError(e?.message ?? "Save failed");
		} finally {
		  	setSaving(false);
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
		
			setOverallPercent(json.data?.overallPercent ?? 0);
		} catch (e: any) {
		  	setError(e?.message ?? "Summary failed");
		} finally {
		  	setSummarizing(false);
		}
	};

	const [confirmOpen, setConfirmOpen] = useState(false);
	const cancelDelete = () => setConfirmOpen(false);
	const confirmDelete = () => setConfirmOpen(false);

	if (loading) return <div className="p-10">Loading...</div>;
	if (error) return <div className="p-10 text-myApp-red">{error}</div>;

  	return (
	<>
		<div className='px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col'>
			<div className='flex items-center mb-2.5 gap-6'>
				<p className='text-title font-medium text-myApp-blueDark'>ประเมินตัวชี้วัด ({evaluateeName})</p>
				<div className='flex gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>สถานะการประเมินตัวชี้วัด</p>
					<p className='text-button font-semibold text-myApp-red'>ยังไม่ประเมิน</p>
				</div>
				<div className='flex flex-1 gap-2'>
					<p className='text-button font-semibold text-myApp-blueDark'>ตัวชี้วัดที่ประเมินแล้ว</p>
					<p className='text-button font-semibold text-myApp-green'>{evaluatedCount}</p>
					<p className='text-button font-semibold text-myApp-blueDark'>/ {itemKeys.length}</p>
				</div>
				<div className='flex ml-auto gap-2'>
					<p className='text-title font-semibold text-myApp-blueDark'>สรุปผลคะแนน</p>
					<p className='text-title font-semibold text-myApp-blueDark'>
						{overallPercent === null ? "-" : `${overallPercent}%`}
					</p>
				</div>
			</div>

			{/* menu tab */}
			<div className='flex items-center mb-3 gap-2.5'>
				<Button 
					variant={showAllDetails ? "outline" : "primary"}
					primaryColor="blueDark"
					onClick={() => setShowAllDetails((prev) => !prev)}>
					{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
				</Button>

				<div className="flex ml-auto gap-2.5">
					<Button
						variant="primary"
						primaryColor="pink"
						onClick={onSummary}
						disabled={summarizing || mode === "edit" || saving}>
						{summarizing ? "กำลังคำนวณ..." : "คำนวณผลการประเมิน"}
					</Button>

					{/* if in 'view' mode, show edit button
					if in 'edit' mode, show save and cancel button */}
					{mode === "view" ? (
						<Button onClick={startEdit} variant="primary" primaryColor="orange">ประเมิน</Button>
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
					onChangeScores={setScores}
				/>
			</div>

			<ConfirmBox
				open={confirmOpen}
				message="ต้องการลบตัวชี้วัดแถวนี้ใช่หรือไม่?"
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={cancelDelete}
				onConfirm={confirmDelete}
			/>
		</div>
	</>
  )
}

export default page
