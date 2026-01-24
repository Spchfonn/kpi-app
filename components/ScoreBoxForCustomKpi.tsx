"use client";
import React from "react";

export type CustomLevel = {
	score: number;
	desc: string | "";
};

type Props = {
  mode: "view" | "edit";
  title?: string;
  levels: CustomLevel[];
  onChangeLevels?: (next: CustomLevel[]) => void;
};

export default function ScoreBoxForCustomKpi({
  mode,
  title = "เกณฑ์คะแนน",
  levels,
  onChangeLevels,
}: Props) {
  const getValue = (lvl: 1 | 2 | 3 | 4 | 5) =>
	levels.find((x) => Number(x.score) === lvl)?.desc ?? "";
  
  const setValue = (lvl: 1 | 2 | 3 | 4 | 5, v: string) => {
	if (!onChangeLevels) return;
  
	const next: CustomLevel[] = ([1, 2, 3, 4, 5] as const).map((s) => {
	  const old = levels.find((x) => Number(x.score) === s);
	  return {
		score: s,
		desc: s === lvl ? v : (old?.desc ?? ""),
	  };
	});
  
	onChangeLevels(next);
  };

  return (
	<div className="inline-block">
	  <div className="text-smallTitle font-medium text-myApp-blueDark">
		{title}
	  </div>

	  <div className="grid grid-cols-[24px_2px_500px]">
		{/* line */}
		<div className="col-start-2 row-start-1 row-span-5 w-0.5 bg-myApp-blue rounded-full" />

		{([1, 2, 3, 4, 5] as const).map((lvl) => (
			<React.Fragment key={lvl}>
			{/* levels */}
			<div className="col-start-1 h-5.5 flex items-center justify-center text-myApp-blueDark text-smallTitle font-medium">
				{lvl}
			</div>

			{/* input number */}
			<div className="col-start-3 h-5.5 flex items-center ml-2">
				<input
				  inputMode="text"
				  value={getValue(lvl)}
				  disabled={mode !== "edit"}
				  onChange={(e) => setValue(lvl, e.target.value)}
				  className="w-full bg-transparent outline-none text-myApp-blueDark text-smallTitle font-medium border-b-2 border-myApp-shadow"
				/>
			</div>
			</React.Fragment>
		))}
		</div>
	</div>
  );
}