"use client";
import React, { useEffect, useState } from "react";
import { FiPlusCircle, FiTrash2 } from "react-icons/fi";

export type WorkHistoryItem = {
	title: string;
	startDate: string;
	endDate: string;
};

type Mode = "view" | "edit";

type Props = {
	items: WorkHistoryItem[];
	mode?: Mode;
  	onChangeItems?: (items: WorkHistoryItem[]) => void;

	// optional labels
	heading?: string;
	col1?: string;
	col2?: string;
	col3?: string;
};

export default function EmploymentHistoryTable({
	items,
	mode = "view",
  	onChangeItems,
	heading = "ประวัติการทำงาน",
	col1 = "ตำแหน่ง / ระดับ",
	col2 = "วันที่เริ่มต้น",
	col3 = "วันที่สิ้นสุด",
}: Props) {

	const isEdit = mode === "edit";

	const [rows, setRows] = useState<WorkHistoryItem[]>(items);

	useEffect(() => setRows(items), [items]);

	const updateRows = (next: WorkHistoryItem[]) => {
		setRows(next);
		onChangeItems?.(next);
	};

	const handleAdd = () => {
		updateRows([
			{
				title: "",
				startDate: "",
				endDate: "",
			},
			...rows,
		]);
	};

	const handleRemove = (index: number) => {
		updateRows(rows.filter((_, i) => i !== index));
	};

	const handleChange = (index: number, key: keyof WorkHistoryItem, value: string) => {
		const next = rows.map((r, i) => (i === index ? { ...r, [key]: value } : r));
		updateRows(next);
	};

	return (
		<section className="w-full">
			<div className="flex flex-col gap-1">
				{/* Title */}
				<div className="flex items-center justify-between">
					<h2 className="text-smallTitle font-medium text-myApp-blue">{heading}</h2>
					{isEdit && (
						<button
						type="button"
						onClick={handleAdd}
						className="text-myApp-blue text-smallButton font-medium hover:opacity-90"
						>
							<FiPlusCircle className="text-lg" />
						</button>
					)}
				</div>

				{/* Header row */}
				<div className="grid grid-cols-22 text-myApp-blue text-smallButton font-medium px-3">
					<div className="col-span-12 text-left">{col1}</div>
					<div className="col-span-5 text-left">{col2}</div>
					<div className="col-span-5 text-left">{col3}</div>
				</div>

				{/* Divider line under header */}
				<div className="h-px bg-myApp-blue rounded-full mb-0.5" />

				{/* Rows */}
				<div className="space-y-2">
					{rows.map((it, idx) => (
						<div key={`${idx}`} className="bg-white rounded-lg shadow-sm px-3 py-2">
							<div className="grid grid-cols-23 items-center gap-2">
								{isEdit ? (
								<>
									{/* title */}
									<input
										className="col-span-12 w-full rounded-md text-body text-myApp-blueDark font-medium"
										value={it.title}
										onChange={(e) => handleChange(idx, "title", e.target.value)}
									/>
									{/* start */}
									<input
										type="date"
										className="col-span-5 w-full rounded-md text-body text-myApp-blueDark font-medium"
										value={it.startDate}
										onChange={(e) => handleChange(idx, "startDate", e.target.value)}
									/>
									{/* end */}
									<div className="col-span-5 flex items-center gap-2">
										<input
											type="date"
											className="w-full rounded-md text-body text-myApp-blueDark font-medium"
											value={it.endDate}
											onChange={(e) => handleChange(idx, "endDate", e.target.value)}
										/>
									</div>
									<div className="col-span-1 flex items-center">
										<button
											type="button"
											onClick={() => handleRemove(idx)}
											className="shrink-0 text-myApp-grey text-sm hover:opacity-80"
											aria-label="ลบแถว"
											title="ลบ"
										>
											<FiTrash2 className="text-sm" />
										</button>
									</div>
								</>
								) : (
								<>
									<div className="col-span-12 text-myApp-blueDark text-body font-medium text-left">
										{it.title}
									</div>
									<div className="col-span-5 text-myApp-blueDark text-body font-medium text-left">
										{it.startDate}
									</div>
									<div className="col-span-5 text-myApp-blueDark text-body font-medium text-left">
										{it.endDate}
									</div>
								</>
								)}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}