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
import ConfirmBox from "@/components/ConfirmBox";

function apiStatusToKey(s: "DEFINE" | "EVALUATE" | "SUMMARY"): StatusKey {
	if (s === "DEFINE") return "define";
	if (s === "EVALUATE") return "evaluate";
	return "summary";
}

type EmployeeRow = {
	id: string;
	employeeNo: string;
	name: string;
	lastName: string;
	position: string;
	level: string;
	defineStatus: string;
	evaluateStatus: string;
	summaryStatus: string;
};
  
type EmployeeSummary = {
	total: number;
	defineDone: number;
	evaluateDone: number;
	summaryDone: number;
};

const statusMap = { define: "DEFINE", evaluate: "EVALUATE", summary: "SUMMARY" } as const;

const KPI_DEFINE_MODE_OPTIONS = [
	{
	  value: "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS",
	  label: "ผู้ประเมินกำหนดตัวชี้วัด -> ผู้รับการประเมินรับรอง",
	},
	{
	  value: "EVALUATEE_DEFINES_EVALUATOR_APPROVES",
	  label: "ผู้รับการประเมินกำหนดตัวชี้วัด -> ผู้ประเมินอนุมัติ",
	},
] as const;

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
		year: 2026,
		round: 1,
		startDate: "",
		endDate: "",
		systemStatus: "define" as StatusKey,
		kpiDefineMode: "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS",
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
					status: statusMap[draft.systemStatus],
					kpiDefineMode: draft.kpiDefineMode,
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
		evaluationAssignment: false,
		employeeStatus: false,
		kpiStructure: true,
		dashboard: false,
	};
	const canEdit = !!canEditTab[tab];

	const [deleting, setDeleting] = useState(false);
	const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
	const handleConfirmDelete = async () => {
		if (!id) return;
	  
		setDeleting(true);
		try {
			const res = await fetch(`/api/evaluationCycles/${id}`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			});
		
			const json = await res.json().catch(() => null);
		
			if (!res.ok) {
				if (res.status === 409) {
					alert(json?.message ?? "ไม่สามารถลบได้ เนื่องจากรอบนี้มีการกำหนดตัวชี้วัดแล้ว");
					return;
				}
		
				alert(json?.message ?? `ลบไม่สำเร็จ (${res.status})`);
				console.error("DELETE failed", json);
				return;
			}
		
			alert("ลบสำเร็จ");
			window.location.href = "/admin";
		} catch (e: any) {
			console.error(e);
			alert(e?.message ?? "ลบไม่สำเร็จ");
		} finally {
		  	setDeleting(false);
		}
	};
	const handleCancelDelete = () => setOpenConfirmDelete(false);

	const [employees, setEmployees] = useState<EmployeeRow[]>([]);
	const [empSummary, setEmpSummary] = useState<EmployeeSummary>({
		total: 0,
		defineDone: 0,
		evaluateDone: 0,
		summaryDone: 0,
	});

	useEffect(() => {
		if (!id) return;
		(async () => {
			const [cycleRes, empRes] = await Promise.all([
				fetch(`/api/evaluationCycles/${id}`, { cache: "no-store" }),
				fetch(`/api/evaluationCycles/${id}/employeeStatuses`, { cache: "no-store" }),
			]);
		
			const cycleJson = await cycleRes.json();
			if (cycleRes.ok) {
				const c = cycleJson.data;
				const next: EvalCycleForm = {
					name: c.name ?? "",
					year: c.year ?? "",
					round: c.round ?? "",
					startDate: c.startDateYmd ?? "",
					endDate: c.endDateYmd ?? "",
					systemStatus: apiStatusToKey(c.status),
					kpiDefineMode: c.kpiDefineMode ?? "EVALUATOR_DEFINES_EVALUATEE_CONFIRMS",
				};
				setData(next);
				setDraft(next);
			} 
			else console.error(cycleJson);
		
			const empJson = await empRes.json();
			if (empRes.ok) {
				setEmployees(empJson.data ?? []);
				setEmpSummary(empJson.summary ?? { total: 0, defineDone: 0, evaluateDone: 0, summaryDone: 0 });
			}
			else console.error(empJson);
		})();
	}, [id]);

	const [groups, setGroups] = useState<EvaluationGroup[]>([]);
	const groupOptions = [
		{ value: "evaluator", label: "ผู้ประเมิน" },
		{ value: "evaluatee", label: "ผู้รับการประเมิน" },
	] as const;
	  
	type GroupBy = typeof groupOptions[number]["value"];
	const [groupBy, setGroupBy] = useState<GroupBy>("evaluator");

	useEffect(() => {
		if (!id) return;
		if (tab !== "evaluationAssignment") return;
	  
		(async () => {
			const res = await fetch(
				`/api/evaluationCycles/${id}/evaluationAssignments?groupBy=${groupBy}`,
				{ cache: "no-store" }
			);
			const json = await res.json();
			if (!res.ok) return console.error(json);
		
			setGroups(json.data);
		})();
	}, [id, tab, groupBy]);

	const fetchGroups = async () => {
		if (!id) return;
		const res = await fetch(
			`/api/evaluationCycles/${id}/evaluationAssignments?groupBy=${groupBy}`,
			{ cache: "no-store" }
		);
		const json = await res.json();
		if (!res.ok) {
			console.error(json);
			return;
		}
		setGroups(json.data);
	};
	  
	useEffect(() => {
		if (!id) return;
		if (tab !== "evaluationAssignment") return;
		fetchGroups();
	}, [id, tab, groupBy]);

	const renderTab = () => {
		switch (tab) {
			case "basic":
			  return (
						<BasicTab
							draft={draft}
							setDraft={setDraft}
							mode={mode}
							filterValue={draft.kpiDefineMode ?? null}
							filterOptions={KPI_DEFINE_MODE_OPTIONS as any}
							onFilterChange={(v) =>
								setDraft((prev) => ({ ...prev, kpiDefineMode: v }))
							}
						/>
					);
			case "evaluationAssignment":
			  return <EvaluationAssignmentTab
						groups={groups}
						groupBy={groupBy}
						onChangeGroupBy={setGroupBy}
						reloadGroups={fetchGroups} />;
			case "employeeStatus":
			  return <EmployeeStatusTab employees={employees} summary={empSummary} />;
			case "kpiStructure":
			  return <KpiStructureTab />;
			case "dashboard":
			  return <DashboardTab />;
			default:
			  return null;
		}
	};

	const titleName = mode === "edit" ? draft.name : data.name;

	return (
	<>
		<div className='px-20 py-7.5'>
			<div className="flex flex-col gap-2 mb-4">
				<p className='text-title font-medium text-myApp-blueDark'>รอบการประเมิน {titleName || "-"}</p>
				
				<div className="flex flex-1">
					<EvaluationCycleMenuBar active={tab} onChange={setTab}/>
					<div className="ml-auto flex gap-2">
					{canEdit && ( mode === "view" ? (
						<>
							{tab === "basic" && (
							<Button variant="primary" primaryColor="red" onClick={() => setOpenConfirmDelete(true)} disabled={deleting}>
								{deleting ? "กำลังลบ..." : "ลบ"}
							</Button>
							)}
							<Button variant="primary" primaryColor="orange" onClick={startEdit}>
								แก้ไข
							</Button>
						</>
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

			<ConfirmBox
				open={openConfirmDelete}
				message="ต้องการลบรอบการประเมินนี้ใช่หรือไม่?"
				cancelText="ยกเลิก"
				confirmText="ตกลง"
				onCancel={handleCancelDelete}
				onConfirm={handleConfirmDelete}
			/>
			
		</div>
	</>
	);
}
