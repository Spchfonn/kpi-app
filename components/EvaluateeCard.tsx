"use client";
import Link from "next/link";
import React from "react";
import { FiFileText, FiUser } from "react-icons/fi";

type StripColor = "red" | "green" | "yellow";

const stripBg: Record<StripColor, string> = {
  red: "bg-myApp-red",
  green: "bg-myApp-green",
  yellow: "bg-myApp-yellow",
};

type Props = {
  name: string;
  title: string;
  stripColor?: StripColor;
};

function PillButton({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) {
    return (
      <Link
        href={href}
        className={`
          inline-flex items-center
          px-2 py-1 rounded-full border
          text-smallButton font-medium
          transition
          bg-myApp-white text-myApp-blueDark border-myApp-blueDark
          hover:bg-myApp-blueDark hover:text-myApp-cream
        `}>
        {children}
      </Link>
    );
  }

export default function EvaluateeCard({
  name,
  title,
  stripColor = "red",
}: Props) {
  return (
    <div className="relative w-full max-w-90 max-h-33">

      {/* card */}
      <div className="bg-myApp-white rounded-2xl shadow-sm px-10 py-4 flex gap-8 items-start">
        {/* left red strip */}
        <div className={`absolute left-0 top-0 h-full w-5 rounded-l-2xl ${stripBg[stripColor]}`} />

        <div>
            <div className="flex flex-1 gap-4">
                {/* avatar */}
                <div className="shrink-0">
                <div className="w-15 h-15 rounded-full border-3 border-myApp-blueDark flex items-center justify-center text-myApp-blueDark">
                    <FiUser className="text-4xl" />
                </div>
                </div>

                {/* info */}
                <div className="flex-1">
                    <div className="text-button font-semibold text-myApp-blueDark">{name}</div>
                    <div className="text-smallTitle font-medium text-myApp-blueDark/80 mt-1">{title}</div>

                    <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-smallTitle font-medium text-myApp-blueDark hover:underline">
                        เอกสารข้อตกลง <FiFileText className="text-sm" />
                    </button>

                </div>
            </div>

            {/* tabs */}
            <div className="mt-3 flex flex-wrap gap-3">
                <PillButton href="/user/dashboard">
                    Dashboard
                </PillButton>

                <PillButton href="/user/kpi">
                    กำหนดตัวชี้วัด
                </PillButton>

                <PillButton href="/user/dashboard">
                    สั่งให้กำหนดตัวชี้วัด
                </PillButton>
            </div>
        </div>
      </div>
    </div>
  );
}