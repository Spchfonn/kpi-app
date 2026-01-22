"use client";
import EvaluationCycleMenuBar, { TabKey } from "@/components/admin/EvaluationCycleMenuBar";
import { type EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import Button from "@/components/Button";
import { type StatusKey } from "@/components/SystemStatusCards";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EditMode, EvalCycleForm } from "./types";
import BasicTab from "./_tabs/BasicInfoTab";
import EvaluationAssignmentTab from "./_tabs/EvaluationAssignmentTab";
import EmployeeStatusTab from "./_tabs/EmployeeStatusTab";
import KpiStructureTab from "./_tabs/KpiStructureTab";
import DashboardTab from "./_tabs/DashboardTab";

function apiStatusToKey(s: "DEFINE" | "EVALUATE" | "SUMMARY"): StatusKey {
	if (s === "DEFINE") return "define";
	if (s === "EVALUATE") return "evaluate";
	return "summary";
}

export default function Page() {

	const { id } = useParams<{ id: string }>();
	const [tab, setTab] = useState<TabKey>("basic");

	const [editModeByTab, setEditModeByTab] = useState<Record<TabKey, EditMode>>({
		basic: "view",
		evaluationAssignment: "view",
		employeeStatus: "view",
		kpiStructure: "view",
		dashboard: "view",
	});
	const mode = editModeByTab[tab] ?? "view";

	const [data, setData] = useState<EvalCycleForm>({
		name: `ปีการประเมิน 2568 รอบที่ 1`,
		startDate: "",
		endDate: "",
		systemStatus: "define" as StatusKey,
	});
  
	// draft for edit
	const [draft, setDraft] = useState<EvalCycleForm>(data);

	const startEdit = () => {
		setEditModeByTab((prev) => ({ ...prev, [tab]: "edit" }));
		if (tab === "basic") setDraft(data);
	};
	  
	const cancelEdit = () => {
		setEditModeByTab((prev) => ({ ...prev, [tab]: "view" }));
		if (tab === "basic") setDraft(data);
	};

	const saveEdit = async () => {
		if (tab === "basic") {
			const res = await fetch(`/api/evaluationCycles/${id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: draft.name,
					startDate: draft.startDate,
					endDate: draft.endDate,
					status: draft.systemStatus.toUpperCase(),
				}),
			});
		
			const json = await res.json().catch(() => null);
			if (!res.ok) {
				console.error("PATCH failed", json);
				return;
			}
		
			setData(draft);
		}
		setEditModeByTab((prev) => ({ ...prev, [tab]: "view" }));
	};

	const canEditTab: Partial<Record<TabKey, boolean>> = {
		basic: true,
		evaluationAssignment: true,
		employeeStatus: false,
		kpiStructure: true,
		dashboard: false,
	};
	const canEdit = !!canEditTab[tab];

	// TODO: get data from database
	const employees = [
		{
		  id: "e1",
		  name: "นางสาวรักงาน สู้ชีวิต",
		  defineStatus: "ยังไม่กำหนด",
		  evaluateStatus: "ยังไม่ประเมิน",
		  summaryStatus: "ยังไม่สรุป",
		},
		{
		  id: "e2",
		  name: "นางสาวรักงาน สู้ชีวิต",
		  defineStatus: "รอการอนุมัติ",
		  evaluateStatus: "ยังไม่ประเมิน",
		  summaryStatus: "ยังไม่สรุป",
		},
		{
			id: "e3",
			name: "นางสาวรักงาน สู้ชีวิต",
			defineStatus: "สมบูรณ์",
			evaluateStatus: "รอการอนุมัติ",
			summaryStatus: "ยังไม่สรุป",
		  },
	] as const;

	const groupsMock: EvaluationGroup[] = [
		{
			evaluator: {
				id:"u01",
				employeeNo: "01",
				name: "นายสุขใจ สมฤดี",
				position: "Software Engineer",
				level: "ระดับ 3",
			},
			evaluatees: [
				{ id:"u02", employeeNo: "02", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u03", employeeNo: "03", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u04", employeeNo: "04", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u05", employeeNo: "05", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
			],
		},
		{
			evaluator: {
				id:"u06",
				employeeNo: "06",
				name: "นายสุขใจ สมฤดี",
				position: "Software Engineer",
				level: "ระดับ 3",
			},
			evaluatees: [
				{ id:"u07", employeeNo: "07", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u08", employeeNo: "08", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u09", employeeNo: "09", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u10", employeeNo: "10", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
			],
		},
		{
			evaluator: {
				id:"u11",
				employeeNo: "11",
				name: "นายสุขใจ สมฤดี",
				position: "Software Engineer",
				level: "ระดับ 3",
			},
			evaluatees: [
				{ id:"u12", employeeNo: "12", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u13", employeeNo: "13", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u14", employeeNo: "14", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
				{ id:"u15", employeeNo: "15", name: "นายสุขใจ สมฤดี", position: "Software Engineer", level: "ระดับ 3" },
			],
		},
	];

	useEffect(() => {
		if (!id) return;
	  
		(async () => {
			const res = await fetch(`/api/evaluationCycles/${id}`, { cache: "no-store" });
			const json = await res.json();
			if (!res.ok) {
				console.error(json);
				return;
			}
		
			const c = json.data;
		
			const next: EvalCycleForm = {
				name: c.name ?? "",
				startDate: c.startDateYmd ?? "",
				endDate: c.endDateYmd ?? "",
				systemStatus: apiStatusToKey(c.status),
			};
		
			setData(next);
			setDraft(next);
		})();
	}, [id]);

	const renderTab = () => {
		switch (tab) {
			case "basic":
			  return <BasicTab draft={draft} setDraft={setDraft} mode={mode} />;
			case "evaluationAssignment":
			  return <EvaluationAssignmentTab mode={mode} groups={groupsMock as EvaluationGroup[]} />;
			case "employeeStatus":
			  return <EmployeeStatusTab employees={employees} />;
			case "kpiStructure":
			  return <KpiStructureTab />;
			case "dashboard":
			  return <DashboardTab />;
			default:
			  return null;
		}
	};

	return (
	<>
		<div className='px-20 py-7.5'>
			<div className="flex flex-col gap-2 mb-4">
				<p className='text-title font-medium text-myApp-blueDark'>รอบการประเมิน ปีการประเมิน 2568 รอบที่ 1</p>
				
				<div className="flex flex-1">
					<EvaluationCycleMenuBar active={tab} onChange={setTab}/>
					<div className="ml-auto flex gap-2">
					{canEdit && ( mode === "view" ? (
						<Button variant="primary" primaryColor="orange" onClick={startEdit}>
							แก้ไข
						</Button>
					) : (
						<>
							<Button primaryColor="red" onClick={cancelEdit}>
								ยกเลิก
							</Button>
							<Button variant="primary" onClick={saveEdit}>
								บันทึก
							</Button>
						</>
					)
					)}
					</div>
				</div>
			</div>

			{/* content */}
			<div>
				{renderTab()}
			</div>
			
		</div>
	</>
	);
}
