"use client";
import EvaluationCycleMenuBar, { type TabKey } from "@/components/admin/EvaluationCycleMenuBar";
import EvaluationPairsTable, { type EvaluationGroup } from "@/components/admin/EvaluationPairsTable";
import Button from "@/components/Button";
import DropDown from "@/components/DropDown";
import Input from "@/components/InputField";
import SystemStatusCards, { type StatusKey } from "@/components/SystemStatusCards";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/Table";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FiTrash2, FiUser } from "react-icons/fi";

function apiStatusToKey(s: "DEFINE" | "EVALUATE" | "SUMMARY"): StatusKey {
	if (s === "DEFINE") return "define";
	if (s === "EVALUATE") return "evaluate";
	return "summary";
}

export default function Page() {

	const { id } = useParams<{ id: string }>();
	const [tab, setTab] = useState<TabKey>("basic");
	const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
	const [selectedGroup, setSelectedGroup] = useState<EvaluationGroup | null>(null);

	type EditMode = "view" | "edit";
	const [editModeByTab, setEditModeByTab] = useState<Record<TabKey, EditMode>>({
		basic: "view",
		peer: "view",
		employeeStatus: "view",
		kpiStructure: "view",
		dashboard: "view",
	});
	const mode = editModeByTab[tab] ?? "view";
	const disabled = mode === "view";

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
		setEditModeByTab((prev) => ({ ...prev, [tab]: "edit" }));
		if (tab === "basic") setDraft(data);
	};
	  
	const cancelEdit = () => {
		setEditModeByTab((prev) => ({ ...prev, [tab]: "view" }));
		if (tab === "basic") setDraft(data);
		if (tab === "peer") setDetailEvaluatees(selectedGroup?.evaluatees ?? []);
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
				return; // ไม่ปิด edit mode ถ้าบันทึกไม่สำเร็จ
			}
		
			setData(draft);
		}

		if (tab === "peer") {
			// TODO: call API save pairs using detailEvaluatees / selectedGroup
			// ตัวอย่าง: await updatePairs({ evaluatorId, evaluatees: detailEvaluatees })
		}
	  
		setEditModeByTab((prev) => ({ ...prev, [tab]: "view" }));
	  };

	const canEditTab: Partial<Record<TabKey, boolean>> = {
		basic: true,
		peer: true,
		employeeStatus: false,
		kpiStructure: true,
		dashboard: false,
	};
	const canEdit = !!canEditTab[tab];

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

	const groupOptions = [
		{ value: "evaluator", label: "ผู้ประเมิน" },
		{ value: "evaluatee", label: "ผู้รับการประเมิน" },
	  ] as const;
	  
	type GroupBy = typeof groupOptions[number]["value"];
	  
	const [groupBy, setGroupBy] = useState<GroupBy>("evaluator");

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

	const [detailEvaluatees, setDetailEvaluatees] = useState(selectedGroup?.evaluatees ?? []);
	useEffect(() => {
		setDetailEvaluatees(selectedGroup?.evaluatees ?? []);
	}, [selectedGroup]);

	const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);

	const openDelete = (idx: number) => {
	setDeleteIdx(idx);
	setIsDeleteOpen(true);
	};

	const closeDelete = () => {
	setIsDeleteOpen(false);
	setDeleteIdx(null);
	};

	const confirmDelete = () => {
	if (deleteIdx === null) return;
	setDetailEvaluatees((prev) => prev.filter((_, i) => i !== deleteIdx));
	closeDelete();
	};

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
			return (
				<>
					<div className="flex items-center gap-2 mb-3 -mt-1">
						{!selectedGroup ? (
						<>
							<p className="text-body font-medium text-myApp-blueDark">จัดกลุ่มตาม</p>
							<div className="w-54">
							<DropDown
								value={groupBy}
								onChange={(v) => setGroupBy(v as GroupBy)}
								options={groupOptions as any}
							/>
							</div>
						</>
						) : (
						<>
							<div>
								<p className="flex text-nav font-medium text-myApp-blueDark gap-2">
									ผู้ประเมิน :{" "}
									<span>
										{selectedGroup.evaluator.employeeNo} {selectedGroup.evaluator.name}<br />
										{selectedGroup.evaluator.position} {selectedGroup.evaluator.level}
									</span>
								</p>
							</div>
						</>
						)}
					</div>

					{!selectedGroup ? (
						<EvaluationPairsTable
							groups={groupsMock}
							selectedIndex={selectedGroupIndex ?? undefined}
							onSelectGroup={(idx, group) => {
								setSelectedGroupIndex(idx);
								setSelectedGroup(group); // เข้า detail view
							}}
						/> ) : (
							<div>
								{/* Evaluatees list */}
								<div>
									<p className="text-nav font-medium text-myApp-blueDark">
										ผู้รับการประเมิน ({detailEvaluatees.length})
									</p>

									<Table>
										<THead>
											<Tr bg="blue" row="header">
												<Th className="w-[7%]"> </Th>
												<Th className="w-[12%]">หมายเลขพนักงาน</Th>
												<Th className="w-[40%]">ชื่อ</Th>
												<Th className="w-[22%]">ตำแหน่ง</Th>
												<Th className="w-[14%]">ระดับ</Th>
												<Th className="w-[5%]"> </Th>
											</Tr>
										</THead>
								
										<TBody>
											{detailEvaluatees.map((p, i) => (
											<Tr
												key={i}
												className="cursor-pointer hover:bg-myApp-shadow/30 transition"
											>
												<Td>
													<div className="w-8 h-8 rounded-full border-2 border-myApp-blueDark flex items-center justify-center">
														<FiUser className="text-myApp-blueDark text-lg" />
													</div>
												</Td>
												<Td className="text-center">{p.employeeNo}</Td>
												<Td>{p.name}</Td>
												<Td className="text-center">{p.position}</Td>
												<Td className="text-center">{p.level}</Td>
												<Td>
													<button
													type="button"
													disabled={mode === "view"}
													className={`flex items-center justify-center rounded-lg hover:bg-myApp-grey/30
													  ${mode === "view" ? "opacity-40 cursor-not-allowed" : ""}`}
													onClick={(e) => {
													  if (mode === "view") return;
													  e.stopPropagation();
													  openDelete(i);
													}}
													>
														<FiTrash2 className="text-lg text-myApp-grey" />
													</button>
												</Td>
											</Tr>
											))}
										</TBody>
									</Table>

								</div>
							</div>
						)}
				</>
			);
	  
		  case "employeeStatus":
			return (
				<>
					<div className="flex flex-1 gap-3">
						<p className='text-title font-medium text-myApp-blueDark'>พนักงานทั้งหมด (100)</p>
						<div className="flex gap-3 pt-2">
							<p className='text-smallTitle font-medium text-myApp-blueDark'>กำหนดตัวชี้วัดสมบูรณ์ 20/100</p>
							<p className='text-smallTitle font-medium text-myApp-blueDark'>ประเมินตัวชี้วัดสมบูรณ์ 20/100</p>
							<p className='text-smallTitle font-medium text-myApp-blueDark'>สรุปผลตัวชี้วัดสมบูรณ์ 20/100</p>
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
