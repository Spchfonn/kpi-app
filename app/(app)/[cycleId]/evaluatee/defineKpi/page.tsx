"use client";
import DefinedStatus from '@/components/DefinedStatus';
import EmployeeCardForDefineKpi from '@/components/EvaluateeCardForDefineKpi'
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

type Item = {
	assignmentId: string;
	currentPlanId: string | null;
	weightPercent: string;
	evaluator: {
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

	useEffect(() => {
		(async () => {
			const u = getLoginUser();
			console.log("--------- LOGIN USER ---------", getLoginUser());
			if (!u?.employeeId || !u?.cycle?.id) {
				router.push("/sign-in");
				return;
			}

			setLoading(true);
			const res = await fetch(
				`/api/evaluationAssignments/evaluators?cyclePublicId=${encodeURIComponent(u.cycle.id)}&evaluateeId=${encodeURIComponent(u.employeeId)}`,
				{ cache: "no-store" }
			);
			const j = await res.json();
			if (j.ok) setItems(j.data.items);
			setLoading(false);
		})();
	}, [router]);

	return (
	<>
		<div className='px-20 py-7.5'>
			<div className='flex items-center mb-3'>
				<p className='text-title font-medium text-myApp-blueDark'>ผู้ประเมิน ({loading ? "-" : items.length})</p>
				<div className='ml-auto flex'>
					<DefinedStatus/>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{items.map((x) => (
					<EmployeeCardForDefineKpi
						key={x.evaluator.id}
						id={x.evaluator.id}
						name={x.evaluator.fullName}
						title={x.evaluator.title}
					/>
				))}
			</div>
		</div>
	</>
  )
}
