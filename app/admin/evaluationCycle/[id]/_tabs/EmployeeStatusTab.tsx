"use client";
import { FiUser } from "react-icons/fi";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/Table";

type EmployeeRow = {
	id: string;
	name: string;
	defineStatus: string;
	evaluateStatus: string;
	summaryStatus: string;
};

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

function StatusBadge({ value, map }: { value: string; map: Record<string, string> }) {
	return <span className={`font-medium ${map[value] ?? "text-myApp-blueDark"}`}>{value}</span>;
}

type Props = {
	employees: readonly EmployeeRow[];
};

export default function EmployeeStatusTab({ employees }: Props) {
	return (
		<>
		<div className="flex flex-1 gap-3">
			<p className="text-title font-medium text-myApp-blueDark">พนักงานทั้งหมด (100)</p>
			<div className="flex gap-3 pt-2">
			<p className="text-smallTitle font-medium text-myApp-blueDark">กำหนดตัวชี้วัดสมบูรณ์ 20/100</p>
			<p className="text-smallTitle font-medium text-myApp-blueDark">ประเมินตัวชี้วัดสมบูรณ์ 20/100</p>
			<p className="text-smallTitle font-medium text-myApp-blueDark">สรุปผลตัวชี้วัดสมบูรณ์ 20/100</p>
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
}