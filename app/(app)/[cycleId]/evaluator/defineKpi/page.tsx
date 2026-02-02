"use client";
import DefinedStatus from '@/components/DefinedStatus';
import EvaluateeCardForDefineKpi from '@/components/EvaluateeCardForDefineKpi'
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

type LoginUser = {
	employeeId: string;
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

type GateState = { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };

type PlanConfirmStatus = "DRAFT" | "REQUESTED" | "CONFIRMED" | "REJECTED" | "CANCELLED";

type Item = {
	assignmentId: string;
	currentPlanId: string | null;
	weightPercent: string;
	confirmStatus?: PlanConfirmStatus;	
	evaluatee: {
		id: string;
		fullName: string;
		title: string;
		organization: string;
	};
};

export default function Page({ params }: { params: { id: string } })  {

	const router = useRouter();
	const [items, setItems] = useState<Item[]>([]);
	const [loading, setLoading] = useState(true);
	const [gates, setGates] = useState<GateState | null>(null);

	useEffect(() => {
		(async () => {
			const u = getLoginUser();
			if (!u?.employeeId || !u?.cycle?.id) {
				router.push("/sign-in");
				return;
			}

			setLoading(true);

			// 1) gates
			const gatesRes = await fetch(`/api/evaluationCycles/${encodeURIComponent(u.cycle.id)}/gates`, { cache: "no-store" });
			const gatesJson = await gatesRes.json();
			if (gatesJson.ok) setGates(gatesJson.gates);

			// 2) list evaluatees for define
			const res = await fetch(
				`/api/evaluationAssignments/evaluatees?cyclePublicId=${encodeURIComponent(u.cycle.id)}&evaluatorId=${encodeURIComponent(u.employeeId)}`,
				{ cache: "no-store" }
			);
			const j = await res.json();
			if (j.ok) setItems(j.data.items);

			setLoading(false);
		})();
	}, [router]);

	const defineOpen = gates?.DEFINE ?? false;

	return (
	<>
		<div className='px-20 py-7.5'>
			<div className='flex items-center mb-3'>
				<p className='text-title font-medium text-myApp-blueDark'>ผู้รับการประเมิน ({loading ? "-" : items.length})</p>
				<div className='ml-auto flex'>
					<DefinedStatus/>
				</div>
			</div>

			{!defineOpen && (
				<div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
					ตอนนี้ยังไม่เปิดช่วง “กำหนดตัวชี้วัด” คุณสามารถดูรายการได้ แต่จะไม่สามารถแก้/ส่งตัวชี้วัดได้
				</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{items.map((x) => (
					<EvaluateeCardForDefineKpi
						key={x.evaluatee.id}
						id={x.evaluatee.id}
						name={x.evaluatee.fullName}
						title={x.evaluatee.title}
						status={x.confirmStatus}
					/>
				))}
			</div>
		</div>
	</>
  )
}
