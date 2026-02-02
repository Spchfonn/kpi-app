"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/Button";
import TwoLevelKpiTableForEvaluateKpi, { EvalScoreState, KpiTreeNode, } from "@/components/TwoLevelKpiTableForEvaluateKpi";

type LoginUser = {
	employeeId: string;
	cycle: { id: string; name: string };
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

// --- helper fetch json (safe) ---
async function fetchOkJson(url: string) {
	const res = await fetch(url, { cache: "no-store", credentials: "include" });
	const text = await res.text();
	let j: any = null;
	try {
		j = text ? JSON.parse(text) : null;
	} catch {
		j = null;
	}
	if (!res.ok || !j?.ok)
		throw new Error(j?.message ?? `request failed (${res.status})`);
	return j;
}

const nodeKey = (n: KpiTreeNode) => n.id ?? n.clientId!;

// --- compute summary (เหมือน evaluator) ---
function computeSummary(
  tree: KpiTreeNode[],
  scores: Record<string, EvalScoreState>
) {
	const clamp = (n: number, lo: number, hi: number) =>
		Math.max(lo, Math.min(hi, n));

	const computeItemScore0to5 = (item: KpiTreeNode): number => {
		const k = nodeKey(item);
		const st = scores[k] ?? { score: "", checkedIds: [] };

		if (item.type?.rubric?.kind === "QUALITATIVE_CHECKLIST") {
		const checklist = item.type.rubric.checklist ?? [];
		const checked = new Set((st.checkedIds ?? []).map(String));

		const totalW =
			checklist.reduce(
			(sum: number, x: any) => sum + Number(x.weight_percent ?? 0),
			0
			) || 0;
		const gotW = checklist.reduce((sum: number, x: any, i: number) => {
			const id = String(i + 1);
			return sum + (checked.has(id) ? Number(x.weight_percent ?? 0) : 0);
		}, 0);

		return clamp(totalW > 0 ? (gotW / totalW) * 5 : 0, 0, 5);
		}

		const s = st.score;
		return typeof s === "number" ? clamp(s, 0, 5) : 0;
	};

	const itemByNode: Record<
		string,
		{ score0to5: number; percentLocal: number }
	> = {};
	const groupByNode: Record<
		string,
		{ score0to5: number; percentGlobal: number }
	> = {};

	const walk = (node: KpiTreeNode): number => {
		const key = nodeKey(node);

		if (node.nodeType === "ITEM") {
			const score0to5 = computeItemScore0to5(node);
			const wItem = Number(node.weightPercent ?? 0);
			const percentLocal = (score0to5 / 5) * wItem;

			itemByNode[key] = { score0to5, percentLocal };
			return score0to5;
		}

		const children = node.children ?? [];
		if (!children.length) {
			groupByNode[key] = { score0to5: 0, percentGlobal: 0 };
			return 0;
		}

		let sumW = 0;
		let sumScoreW = 0;

		for (const ch of children) {
			const chScore = walk(ch);
			const chW = Number(ch.weightPercent ?? 0);
			sumW += chW;
			sumScoreW += chScore * chW;
		}

		const score0to5 = sumW > 0 ? sumScoreW / sumW : 0;
		const wGroup = Number(node.weightPercent ?? 0);
		const percentGlobal = (score0to5 / 5) * wGroup;

		groupByNode[key] = { score0to5, percentGlobal };
		return score0to5;
	};

	for (const root of tree) walk(root);

	const overallPercent = tree.reduce(
		(sum, g) => sum + (groupByNode[nodeKey(g)]?.percentGlobal ?? 0),
		0
	);

	return { overallPercent, itemByNode, groupByNode };
}

export default function Page() {
	const router = useRouter();
	const { cycleId, assignmentId } = useParams<{
		cycleId: string;
		assignmentId: string;
	}>();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [showAllDetails, setShowAllDetails] = useState(false);

	const [planId, setPlanId] = useState<string | null>(null);
	const [evaluateeName, setEvaluateeName] = useState<string>("");

	const [tree, setTree] = useState<KpiTreeNode[]>([]);
	const [scores, setScores] = useState<Record<string, EvalScoreState>>({});
	const [scoresVisible, setScoresVisible] = useState(false);

	// โหลดทุกอย่าง
	useEffect(() => {
		(async () => {
		setLoading(true);
		setError("");

		const u = getLoginUser();
		if (!u?.employeeId || !u?.cycle?.id) {
			router.push("/sign-in");
			return;
		}

		try {
			// 1) หา plan ที่มองเห็นได้ของ assignment นี้
			const ap = await fetchOkJson(
				`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/plans`
			);
			if (!ap.data?.id) {
				// ยังไม่มี plan ที่ evaluatee เห็นได้ (หรือยังไม่ confirm)
				setPlanId(null);
				setTree([]);
				setScores({});
				setScoresVisible(false);
				setEvaluateeName("");
				setLoading(false);
				return;
			}

			const pid = ap.data.id as string;
			setPlanId(pid);

			// 2) โหลด tree + rubric จาก plan
			const plan = await fetchOkJson(`/api/plans/${encodeURIComponent(pid)}`);
			setTree(plan.data.tree ?? []);
			setEvaluateeName(plan.data.evaluatee?.fullNameTh ?? "");

			// 3) โหลด result (คะแนน) — API จะคุมการมองเห็นเอง
			const result = await fetchOkJson(
				`/api/evaluationAssignments/${encodeURIComponent(assignmentId)}/result`
			);
			const vis = !!result.data?.scoresVisible;
			setScoresVisible(vis);

			// 4) map คะแนนลง scores (key = nodeId)
			const items = result.data?.items ?? [];
			const scoreMap: Record<string, EvalScoreState> = {};

			for (const it of items) {
				if (!it?.id) continue;

				// ถ้า scoresVisible=false API จะส่ง submission=null มาอยู่แล้ว → scoreMap ว่าง
				if (!it.submission) continue;

				const payload = it.submission.payload;
				if (payload && typeof payload === "object") {
					scoreMap[it.id] = {
					score:
						payload.score ??
						it.submission.finalScore ??
						it.submission.calculatedScore ??
						"",
					checkedIds: payload.checkedIds ?? [],
					};
				}
				else {
					// fallback ถ้า payload ไม่ใช่ object
					scoreMap[it.id] = {
					score:
						it.submission.finalScore ?? it.submission.calculatedScore ?? "",
					checkedIds: [],
					};
				}
			}

			setScores(scoreMap);
		} catch (e: any) {
			console.error(e);
			setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
		} finally {
			setLoading(false);
		}
		})();
	}, [assignmentId, router]);

	const preview = useMemo(() => {
		if (!tree.length)
		return {
			overallPercent: null as number | null,
			itemByNode: {},
			groupByNode: {},
		};
		const computed = computeSummary(tree, scoresVisible ? scores : {});
		return {
			overallPercent: Number(computed.overallPercent.toFixed(2)),
			itemByNode: computed.itemByNode,
			groupByNode: computed.groupByNode,
		};
	}, [tree, scores, scoresVisible]);

	if (loading) return <div className="px-20 py-7.5">Loading...</div>;
	if (error) return <div className="px-20 py-7.5 text-myApp-red">{error}</div>;

	if (!planId) {
		return (
		<div className="px-20 py-7.5">
			<div className="text-title font-medium text-myApp-blueDark">
				สรุปผลการประเมิน
			</div>
			<div className="mt-3 rounded-xl border p-4 text-sm text-gray-700">
				ยังไม่มีข้อมูลผลการประเมินสำหรับรายการนี้
			</div>
		</div>
		);
	}

	return (
		<div className="px-20 py-7.5 h-[calc(100vh-56px)] flex flex-col">
		<div className="flex items-center mb-2.5 gap-6">
			<p className="text-title font-medium text-myApp-blueDark">
			สรุปผลการประเมิน ({evaluateeName})
			</p>

			<div className="flex ml-auto gap-2 items-center">
			<p className="text-title font-semibold text-myApp-blueDark">
				คะแนนรวม
			</p>
			<p className="text-title font-semibold text-myApp-blueDark">
				{scoresVisible
				? preview.overallPercent === null
					? "-"
					: `${preview.overallPercent}%`
				: "-"}
			</p>
			</div>
		</div>

		{!scoresVisible && (
			<div className="mb-3 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
				ตอนนี้ยังไม่เปิดช่วง “สรุปผล” จึงยังไม่สามารถดูคะแนนได้
			</div>
		)}

		<div className="flex items-center mb-3 gap-2.5">
			<Button
				variant={showAllDetails ? "outline" : "primary"}
				primaryColor="blueDark"
				onClick={() => setShowAllDetails((prev) => !prev)}
			>
				{showAllDetails ? "ซ่อนเกณฑ์คะแนน" : "แสดงเกณฑ์คะแนน"}
			</Button>

			<div className="ml-auto">
			<Button
				variant="primary"
				primaryColor="blueDark"
				onClick={() =>
				router.push(
					`/${encodeURIComponent(cycleId)}/evaluatee/summaryKpi`
				)
				}
			>
				กลับ
			</Button>
			</div>
		</div>

		<div className="flex-1 overflow-y-auto">
			<TwoLevelKpiTableForEvaluateKpi
				mode="view"
				readOnlyDetails={true}
				showAllDetails={showAllDetails}
				tree={tree}
				scores={scoresVisible ? scores : {}}
				itemByNode={scoresVisible ? preview.itemByNode : {}}
				groupByNode={scoresVisible ? preview.groupByNode : {}}
				onChangeScores={scoresVisible ? setScores : () => {}}
			/>
		</div>
		</div>
	);
}
