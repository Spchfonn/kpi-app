"use client";
import Button from "@/components/Button";
import { Table, THead, Th, Td, Tr, TBody } from "@/components/Table";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CycleStatus = "DEFINE" | "EVALUATE" | "SUMMARY";

export type Cycle = {
	id?: number;
	publicId: string;
	name: string;
	startDate: string | Date;
	endDate: string | Date;
	status: CycleStatus;
	activities?: CycleStatus[];
};

function formatTHDate(d: string | Date) {
	const dt = typeof d === "string" ? new Date(d) : d;
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(dt);
}

const statusLabel: Record<Cycle["status"], string> = {
		DEFINE: "กำหนดตัวชี้วัด",
		EVALUATE: "ประเมินผลตัวชี้วัด",
		SUMMARY: "สรุปผลการประเมิน",
};

const statusPillClass: Record<Cycle["status"], string> = {
		DEFINE: "bg-myApp-blueLight text-myApp-cream",
		EVALUATE: "bg-myApp-pink text-myApp-cream",
		SUMMARY: "bg-myApp-yellow text-myApp-cream",
};

function uniq<T>(arr: T[]) {
	return [...new Set(arr)];
}

export default function EvaluationCycleTableClient({ cycles }: { cycles: Cycle[] }) {
	const router = useRouter();

	return (
		<>
			<div className="flex items-center mt-4 mb-1">
				<p className="text-title font-medium text-myApp-blueDark">รอบการประเมิน</p>
				<Link href="/admin/evaluationCycle/creating" className="ml-auto">
					<Button variant="primary">สร้าง</Button>
				</Link>
			</div>

			<Table>
				<THead>
					<Tr bg="blue" row="header">
						<Th className="w-[50%]">ชื่อรอบการประเมิน</Th>
						<Th className="w-[15%]">วันเริ่มต้น</Th>
						<Th className="w-[15%]">วันสิ้นสุด</Th>
						<Th className="w-[20%]">สถานะการทำงาน</Th>
					</Tr>
				</THead>

				<TBody>
					{cycles.map((c) => {

						const statuses: CycleStatus[] = c.activities && c.activities.length > 0 ? uniq(c.activities) : [c.status];
						return (
						<Tr
							key={c.id ?? c.publicId}
							className="cursor-pointer hover:bg-myApp-shadow/30 transition align-top"
							onClick={() => router.push(`/admin/evaluationCycle/${c.publicId}`)}
						>
							<Td>{c.name}</Td>
							<Td className="text-center">{formatTHDate(c.startDate)}</Td>
							<Td className="text-center">{formatTHDate(c.endDate)}</Td>
							<Td className="text-center">
								<div className="flex flex-wrap justify-center gap-2">
									{statuses.map((s) => (
									<span
										key={s}
										className={["inline-flex items-center justify-center",
													"px-3 py-1 rounded-full border",
													"text-body font-medium whitespace-nowrap",
										statusPillClass[s],].join(" ")}
									>
										{statusLabel[s]}
									</span>
									))}
								</div>
							</Td>
						</Tr>
						)
					})}
				</TBody>
			</Table>
		</>
	);
}