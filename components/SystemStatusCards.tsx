"use client";
import React, { useState } from "react";
import { FiEdit3 } from "react-icons/fi";

export type StatusKey = "define" | "evaluate" | "summary";

type StatusItem = {
  key: StatusKey;
  title: string;
  color: "blue" | "pink" | "yellow";
  icon: React.ReactNode;
};

const ITEMS: StatusItem[] = [
  { key: "define", title: "กำหนดตัวชี้วัด", color: "blue", icon: <FiEdit3 /> },
  { key: "evaluate", title: "ประเมินตัวชี้วัด", color: "pink", icon: <FiEdit3 /> },
  { key: "summary", title: "สรุปผลตัวชี้วัด", color: "yellow", icon: <FiEdit3 /> },
];

const COLOR = {
  blue: {
	text: "text-myApp-blue",
	bg: "bg-myApp-blueLight",
	activeBg: "bg-myApp-blueLight",
  },
  pink: {
	text: "text-myApp-pink",
	bg: "bg-myApp-pinkLight",
	activeBg: "bg-myApp-pinkLight",
  },
  yellow: {
	text: "text-myApp-yellow",
	bg: "bg-myApp-yellow",
	activeBg: "bg-myApp-yellow",
  },
} as const;


export default function SystemStatusCards({
	active,
  	onChange,
  	disabled = false,
}: {
  	active: StatusKey;
  	onChange: (k: StatusKey) => void;
  	disabled?: boolean;
}) {

  	return (
	<section>
	  <h2 className="text-smallTitle font-medium text-myApp-blue mb-1">
		สถานะการทำงานของระบบ
	  </h2>

	  <div className="flex gap-10 w-full max-w-md">
		{ITEMS.map((it) => {
		  const isActive = it.key === active;
		  const c = COLOR[it.color];

		  return (
			<button
				key={it.key}
				type="button"
				disabled={disabled}
              	onClick={() => onChange(it.key)}
				className={`
					w-32 h-28
					rounded-2xl
					flex flex-col items-center justify-center gap-4
					shadow-sm
					${isActive ? c.activeBg : `bg-myApp-white`}
                	${disabled ? "cursor-not-allowed" : "hover:shadow-md"}
				`}
			>
			  <div
				className={`
				  text-4xl leading-none
				  ${isActive ? "text-myApp-cream" : c.text}
				`}
			  >
				{it.icon}
			  </div>

			  <p
				className={`
				  text-body font-medium
				  ${isActive ? "text-myApp-cream" : c.text}
				`}
			  >
				{it.title}
			  </p>
			</button>
		  );
		})}
	  </div>
	</section>
  );
}