"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown } from "react-icons/fi";

type Option = { value: string; label: string };

type Props = {
  value: string | null;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
};

export default function DropDown({
  value,
  onChange,
  options,
  placeholder = "เลือก",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    return options.find((o) => o.value === value)?.label ?? "";
  }, [options, value]);

  // close when click outside
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div ref={rootRef} className={`relative w-70 max-w-full ${className}`}>
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`
          w-full
          h-9
          rounded-2xl
          border-2 border-myApp-blueDark
          bg-myApp-white
          px-6
          text-center
          text-body font-medium
          ${selectedLabel ? "text-myApp-blueDark" : "text-myApp-shadow"}
          flex items-center justify-center
          relative
        `}
      >
        <span className="truncate">{selectedLabel || placeholder}</span>
        <FiChevronDown className="absolute right-4 text-myApp-blueDark text-xl" />
      </button>

      {/* menu */}
      {open && (
        <div
          className="
            absolute left-0 right-0 mt-1
            rounded-2xl
            border-2 border-myApp-blueDark
            bg-myApp-white
            overflow-hidden
            shadow-sm
            z-50
          "
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`
                  w-full px-6 py-2 text-center
                  text-body font-medium
                  ${active ? "bg-myApp-shadow/50 text-myApp-blueDark" : "text-myApp-blueDark"}
                  hover:bg-myApp-shadow/50
                  transition
                `}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}