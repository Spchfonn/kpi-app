"use client";
import React from "react";

type Props = {
  title?: string;
  values: Record<1 | 2 | 3 | 4 | 5, number | "">;
  onChange: (next: Props["values"]) => void;
};

export default function ScoreBoxForQuantitativeKpi({
  title = "เกณฑ์คะแนน",
  values,
  onChange,
}: Props) {
  const setValue = (level: 1 | 2 | 3 | 4 | 5, v: string) => {
    const num = v === "" ? "" : Number(v);
    onChange({ ...values, [level]: num });
  };

  return (
    <div className="inline-block">
      <div className="text-smallTitle font-medium text-myApp-blue">
        {title}
      </div>

      <div className="grid grid-cols-[24px_2px_60px]">
        {/* line */}
        <div className="col-start-2 row-start-1 row-span-5 w-0.5 bg-myApp-blue rounded-full" />

        {([1, 2, 3, 4, 5] as const).map((lvl) => (
            <React.Fragment key={lvl}>
            {/* levels */}
            <div className="col-start-1 h-5.5 flex items-center justify-center text-myApp-blue text-smallTitle font-medium">
                {lvl}
            </div>

            {/* input number */}
            <div className="col-start-3 h-5.5 flex items-center ml-2">
                <input
                  inputMode="decimal"
                  value={values[lvl] ?? ""}
                  onChange={(e) => setValue(lvl, e.target.value)}
                  className="w-full bg-transparent outline-none text-right text-myApp-blue text-smallTitle font-medium border-b-2 border-myApp-shadow"
                />
            </div>
            </React.Fragment>
        ))}
        </div>
    </div>
  );
}