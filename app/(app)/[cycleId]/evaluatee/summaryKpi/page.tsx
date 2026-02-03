"use client";
import Button from '@/components/Button';
import EvaluateeCardForSummaryKpi from '@/components/EvaluateeCardForSummaryKpi';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react'

type LoginUser = {
	employeeId: string;
	cycle: { id: string; name: string };
};

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";

function getLoginUser(): LoginUser | null {
	try {
	   const raw = localStorage.getItem("user");
	   if (!raw) return null;
	   return JSON.parse(raw);
	} catch {
	   return null;
	}
}

type Item = {
	assignmentId: string;
	currentPlanId: string | null;
	weightPercent: string;
	confirmStatus?: PlanConfirmStatus;
	evaluator: {
	   id: string;
	   fullName: string;
	   title: string;
	   organization: string;
	};
};

type GateState = { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };

type AckState = {
	acknowledged: boolean;
	acknowledgedAt: string | null;
	note: string | null;
};

async function safeOkJson(url: string, init?: RequestInit) {
	const res = await fetch(url, {
		cache: "no-store",
		credentials: "include",
		...(init || {}),
	});
  
	const text = await res.text();
	let j: any = null;
	try {
	  	j = text ? JSON.parse(text) : null;
	} catch {
	  	j = null;
	}
	if (!res.ok || !j?.ok) throw new Error(j?.message ?? `request failed (${res.status})`);
	return j;
}

function formatBangkokAD(dtIso: string) {
	const d = new Date(dtIso);
	const ymd = new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Bangkok",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).format(d);
	const hm = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Asia/Bangkok",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(d);
	return `${ymd} ${hm}`;
}

export default function Page() {
	const router = useRouter();
	const { cycleId } = useParams<{ cycleId: string }>();

	const [items, setItems] = useState<Item[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [gates, setGates] = useState<GateState | null>(null);
	const [ack, setAck] = useState<AckState | null>(null);

	const [ackOpen, setAckOpen] = useState(false);
	const [ackNote, setAckNote] = useState("");
	const [ackSaving, setAckSaving] = useState(false);

	const summaryOpen = gates?.SUMMARY ?? false;

	// load list + gates + ack
	const reloadAll = async () => {
		setLoading(true);
		setError("");
	
		const u = getLoginUser();
		if (!u?.employeeId || !u?.cycle?.id) {
			router.push("/sign-in");
			return;
		}
	
		try {
			// 1) evaluators list
			const list = await safeOkJson(
				`/api/evaluationAssignments/evaluators?cyclePublicId=${encodeURIComponent(u.cycle.id)}&evaluateeId=${encodeURIComponent(u.employeeId)}`
			);
			setItems(list.data.items ?? []);
		
			// 2) gates
			const g = await safeOkJson(`/api/evaluationCycles/${encodeURIComponent(u.cycle.id)}/gates`);
			setGates(g.gates as GateState);
		
			// 3) acknowledgement
			try {
				const a = await safeOkJson(`/api/evaluationCycles/${encodeURIComponent(u.cycle.id)}/acknowledge`);
				setAck(a.data as AckState);
			} catch (e) {
				console.warn("acknowledge fetch skipped:", e);
				setAck(null);
			}
		} catch (e: any) {
			console.error(e);
			setError(e?.message ?? "โหลดข้อมูลไม่สำเร็จ");
			setItems([]);
		} finally {
		  	setLoading(false);
		}
	};
	
	useEffect(() => {
		reloadAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router]);

	const headerCount = loading ? "-" : String(items.length);

	const ackLabel = useMemo(() => {
		if (!ack) return null;
		if (!ack.acknowledged) return { text: "ยังไม่รับรองผล", className: "text-myApp-orange" };
		return {
			text: ack.acknowledgedAt ? `รับรองผลแล้ว (${formatBangkokAD(ack.acknowledgedAt)})` : "รับรองผลแล้ว",
			className: "text-myApp-green",
		};
	}, [ack]);

	const canAck = summaryOpen && (!ack || !ack.acknowledged);

	const onAck = async () => {
		const u = getLoginUser();
		if (!u?.cycle?.id) return;
	
		setAckSaving(true);
		setError("");
		try {
			await safeOkJson(`/api/evaluationCycles/${encodeURIComponent(u.cycle.id)}/acknowledge`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ note: ackNote.trim() || null }),
			});
			setAckOpen(false);
			setAckNote("");
			await reloadAll();
		} catch (e: any) {
		  	setError(e?.message ?? "รับรองผลไม่สำเร็จ");
		} finally {
		  	setAckSaving(false);
		}
	};

   	return (
	  <>
	  <div className='px-20 py-7.5'>
		 <div className='flex items-center mb-3'>
			<p className='text-title font-medium text-myApp-blueDark'>ผู้ประเมิน ({headerCount})</p>

			<div className="ml-auto flex items-center gap-3">
				{ackLabel && (
					<div className={`text-sm font-semibold ${ackLabel.className}`}>
					{ackLabel.text}
					</div>
				)}

				{canAck && (
				<Button
					variant="primary"
					primaryColor="green"
					onClick={() => setAckOpen(true)}
					disabled={ackSaving}
				>
					รับรองผลการประเมิน
				</Button>
				)}

				<Button
					variant="primary"
					primaryColor="blueDark"
					onClick={() => router.push(`/${encodeURIComponent(cycleId)}/evaluatee`)}
				>
					กลับ
				</Button>
			</div>
		</div>

		{!loading && gates && !summaryOpen && (
			<div className="mb-3 p-3 rounded-xl border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
				ตอนนี้ยังไม่เปิดช่วง “สรุปผล” คุณยังไม่สามารถดูคะแนนได้
			</div>
		)}

		{error && (
			<div className="mb-3 p-3 rounded-xl border border-myApp-red bg-myApp-white text-myApp-red text-sm">
				{error}
			</div>
		)}

		{!loading && !error && items.length === 0 && (
			<div className="mt-3 rounded-xl border p-4 text-sm text-gray-700">
				ยังไม่มีข้อมูลผู้ประเมินในรอบนี้
			</div>
		)}

		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		 	{items.map((x) => {

				const clickable = summaryOpen;

				return (
					<div
						key={x.assignmentId}
						className={clickable ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}
						onClick={() => {
							if (!clickable) return;
							const u = getLoginUser();
							if (!u?.cycle?.id) return;
							router.push(
							  `/${encodeURIComponent(u.cycle.id)}/evaluatee/summaryKpi/${encodeURIComponent(x.assignmentId)}`
							);
						}}
					>
						<EvaluateeCardForSummaryKpi
							assignmentId={x.assignmentId}
							name={x.evaluator.fullName}
							title={x.evaluator.title}
							acknowledged={!!ack?.acknowledged}
						/>
					</div>
				);
			})}
		 </div>
	  	</div>

		{ackOpen && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
				<div className="text-lg font-semibold text-myApp-blueDark">รับรองผลการประเมิน</div>
				<p className="mt-1 text-sm text-gray-600">
				ถ้าต้องการ สามารถใส่หมายเหตุประกอบการรับรองผลได้
				</p>

				<textarea
				className="mt-3 w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-myApp-blue"
				rows={4}
				value={ackNote}
				onChange={(e) => setAckNote(e.target.value)}
				placeholder="หมายเหตุ (ไม่บังคับ)"
				/>

				<div className="mt-4 flex justify-end gap-2">
				<Button
					variant="primary"
					primaryColor="red"
					onClick={() => setAckOpen(false)}
					disabled={ackSaving}
				>
					ยกเลิก
				</Button>
				<Button
					variant="primary"
					primaryColor="green"
					onClick={onAck}
					disabled={ackSaving}
				>
					{ackSaving ? "กำลังรับรอง..." : "ยืนยันรับรองผล"}
				</Button>
				</div>
			</div>
			</div>
		)}
	</>
  );
}