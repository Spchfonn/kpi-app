"use client";
import EvaluationCycleMenuBar, { type TabKey } from "@/components/admin/EvaluationCycleMenuBar";
import Button from "@/components/Button";
import Input from "@/components/InputField";
import SystemStatusCards, { type StatusKey } from "@/components/SystemStatusCards";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/Table";
import { useParams } from "next/navigation";
import { useState } from "react";
import { FiUser } from "react-icons/fi";

export default function Page() {

	const { id } = useParams<{ id: string }>();

	// โหมดหน้า
	const [mode, setMode] = useState<"view" | "edit">("view");

	type EvalCycleForm = {
		name: string;
		startDate: string;
		endDate: string;
		systemStatus: StatusKey;
	};

	// ข้อมูลจริง (เหมือนมาจาก DB)
	const [data, setData] = useState<EvalCycleForm>({
	  name: `ปีการประเมิน 2568 รอบที่ 1`,
	  startDate: "",
	  endDate: "",
	  systemStatus: "define" as StatusKey,
	});
  
	// draft สำหรับแก้ไข
	const [draft, setDraft] = useState<EvalCycleForm>(data);
  
	const startEdit = () => {
	  setDraft(data);
	  setMode("edit");
	};
  
	const cancelEdit = () => {
	  setDraft(data);
	  setMode("view");
	};
  
	const saveEdit = () => {
	  setData(draft);
	  setMode("view");
	  // TODO: call API save (ใช้ id)
	};
  
	const disabled = mode === "view";

	const [tab, setTab] = useState<TabKey>("basic");

	const defineStatusClass: Record<string, string> = {
		"ยังไม่กำหนด": "text-myApp-red",
		"รอการอนุมัติ": "text-myApp-orange",
		"สมบูรณ์": "text-myApp-green",
	};

	const evaluateStatusClass: Record<string, string> = {
		"ยังไม่ประเมิน": "text-myApp-red",
		"รอการอนุมัติ": "text-myApp-orange",
		"สมบูรณ์": "text-myApp-green",
	};

	const summaryStatusClass: Record<string, string> = {
		"ยังไม่สรุป": "text-myApp-red",
		"รอการอนุมัติ": "text-myApp-orange",
		"สมบูรณ์": "text-myApp-green",
	};
	  
	function StatusBadge({
		value,
		map,
	  }: {
		value: string;
		map: Record<string, string>;
	  }) {
		return <span className={`font-medium ${map[value] ?? "text-myApp-blueDark"}`}>{value}</span>;
	}

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

	const renderTab = () => {
		switch (tab) {
		  case "basic":
			return (
			  <div className="flex flex-col gap-4">
				<Input
				  label="ชื่อรอบการประเมิน"
				  value={draft.name}
				  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
				  disabled={disabled}
				/>
	  
				<Input
				  label="วันเริ่มต้น"
				  type="date"
				  value={draft.startDate}
				  onChange={(e) => setDraft({ ...draft, startDate: e.target.value })}
				  className={draft.startDate ? "" : "date-empty"}
				  disabled={disabled}
				/>
	  
				<Input
				  label="วันสิ้นสุด"
				  type="date"
				  value={draft.endDate}
				  onChange={(e) => setDraft({ ...draft, endDate: e.target.value })}
				  className={draft.endDate ? "" : "date-empty"}
				  disabled={disabled}
				/>
	  
				<SystemStatusCards
				  active={draft.systemStatus}
				  onChange={(k) => setDraft({ ...draft, systemStatus: k })}
				  disabled={mode === "view"}
				/>
			  </div>
			);
	  
		  case "peer":
			return <div className="text-body text-myApp-blueDark">ข้อมูลคู่ประเมิน (TODO)</div>;
	  
		  case "employeeStatus":
			return (
				<>
					<div className="flex flex-1 gap-3">
						<p className='text-title font-medium text-myApp-blueDark'>พนักงานทั้งหมด (100)</p>
						<div className="flex gap-3 pt-2">
							<p className='text-smallTitle font-medium text-myApp-blueDark'>กำหนดตัวชี้วัดสมบูรณ์ 20/100</p>
							<p className='text-smallTitle font-medium text-myApp-blueDark'>กำหนดตัวชี้วัดสมบูรณ์ 20/100</p>
							<p className='text-smallTitle font-medium text-myApp-blueDark'>กำหนดตัวชี้วัดสมบูรณ์ 20/100</p>
						</div>
					</div>
					<Table>
						<THead>
							<Tr bg="blue" row="header">
								<Th className="w-[49%]">รายชื่อพนักงาน</Th>
								<Th className="w-[17%]">สถานะการกำหนดตัวชี้วัด</Th>
								<Th className="w-[17%]">สถานะการประเมินตัวชี้วัด</Th>
								<Th className="w-[17%]">สถานะการสรุปผลตัวชี้วัด</Th>
							</Tr>
						</THead>
						<TBody>
						{employees.map((row) => (
							<Tr key={row.id}>
							<Td>
								<div className="flex items-center gap-3">
								<div className="w-8 h-8 text-lg rounded-full border-2 border-myApp-blueDark text-myApp-blueDark flex items-center justify-center">
									<FiUser />
								</div>
								{row.name}
								</div>
							</Td>

							<Td className="text-center">
								<StatusBadge value={row.defineStatus} map={defineStatusClass} />
							</Td>

							<Td className="text-center">
								<StatusBadge value={row.evaluateStatus} map={evaluateStatusClass} />
							</Td>

							<Td className="text-center">
								<StatusBadge value={row.summaryStatus} map={summaryStatusClass} />
							</Td>
							</Tr>
						))}
						</TBody>
					</Table>
				</>
			);
	  
		  case "kpiStructure":
			return <div className="text-body text-myApp-blueDark">โครงสร้างตัวชี้วัด (TODO)</div>;
	  
		  case "dashboard":
			return <div className="text-body text-myApp-blueDark">Dashboard (TODO)</div>;
	  
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
					<EvaluationCycleMenuBar active={tab} onChange={setTab} />
					<div className="ml-auto flex gap-2">
					{mode === "view" ? (
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
					)}
					</div>
				</div>
			</div>

			{/* content */}
			<div className="mt-2">
				{renderTab()}
			</div>
			
		</div>
	</>
	);
}
