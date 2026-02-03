"use client";

type Gates = { DEFINE: boolean; EVALUATE: boolean; SUMMARY: boolean };
type GateKey = keyof Gates;

const DEFAULT_GATES: Gates = { DEFINE: false, EVALUATE: false, SUMMARY: false };

export default function CycleGatesCards({
  value,
  onChange,
  disabled,
}: {
  value?: Gates;
  onChange: (next: Gates) => void;
  disabled?: boolean;
}) {
	const v = value ?? DEFAULT_GATES;

	const toggle = (k: GateKey) => {
		const next: Gates = { ...v, [k]: !v[k] };

		// policy: ถ้าเปิด SUMMARY ให้ปิด DEFINE/EVALUATE (optional)
		if (k === "SUMMARY" && next.SUMMARY) {
			next.DEFINE = false;
			next.EVALUATE = false;
		}

		onChange(next);
	};

	const Card = ({ k, title, desc }: { k: GateKey; title: string; desc: string }) => (
		<button
			type="button"
			onClick={() => toggle(k)}
			disabled={disabled}
			className={`rounded-xl border-2 p-3 text-left ${
				v[k] ? "border-myApp-blueDark bg-myApp-blueDark" : "bg-myApp-white border-myApp-blueDark"
			} ${disabled ? "cursor-not-allowed" : "hover:bg-gray-50"}`}
		>
			<div className={`text-body-changed font-semibold ${v[k] ? "text-myApp-cream" : "text-myApp-blueDark"}`}>{title}</div>
			<div className={`text-smallButton font-medium ${v[k] ? "text-myApp-cream" : "text-myApp-blueDark"}`}>{desc}</div>
		</button>
	);

	return (
		<div className="relative w-full max-w-md">
			<h2 className="text-smallTitle font-medium text-myApp-blue mb-1">
				สถานะการทำงานของระบบ* (เลือกได้มากกว่า 1 สถานะ)
			</h2>
			<div className="grid gap-3 md:grid-cols-3">
				<Card k="DEFINE" title="DEFINE" desc="เปิดให้กำหนด/แก้ตัวชี้วัด" />
				<Card k="EVALUATE" title="EVALUATE" desc="เปิดให้ประเมินตัวชี้วัด" />
				<Card k="SUMMARY" title="SUMMARY" desc="เปิดเผยผลคะแนน + สรุปผล" />
			</div>
		</div>
		
	);
}