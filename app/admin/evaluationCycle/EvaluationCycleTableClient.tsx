"use client";
import Button from "@/components/Button";
import { Table, THead, Th, Td, Tr, TBody } from "@/components/Table";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Cycle = {
  id: number;
  name: string;
  startDate: string | Date;
  endDate: string | Date;
  status: "DEFINE" | "EVALUATE" | "SUMMARY";
};

function formatTHDate(d: string | Date) {
  const dt = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(dt);
}

const statusLabel: Record<Cycle["status"], string> = {
    DEFINE: "กำหนดตัวชี้วัด",
    EVALUATE: "ประเมินผล",
    SUMMARY: "สรุปผล",
};

const statusPillClass: Record<Cycle["status"], string> = {
    DEFINE: "bg-myApp-blueLight text-myApp-cream",
    EVALUATE: "bg-myApp-pink text-myApp-cream",
    SUMMARY: "bg-myApp-yellow text-myApp-cream",
};

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
          {cycles.map((c) => (
            <Tr
              key={c.id}
              className="cursor-pointer hover:bg-myApp-shadow/30 transition"
              onClick={() => router.push(`/admin/evaluationCycle/${c.id}`)}
            >
              <Td>{c.name}</Td>
              <Td className="text-center">{formatTHDate(c.startDate)}</Td>
              <Td className="text-center">{formatTHDate(c.endDate)}</Td>
                <Td className="text-center">
                    <span
                        className={[
                        "inline-flex items-center justify-center",
                        "px-3 py-1 rounded-full border",
                        "text-bofy font-medium whitespace-nowrap",
                        statusPillClass[c.status],
                        ].join(" ")}
                    >
                        {statusLabel[c.status]}
                    </span>
                </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </>
  );
}