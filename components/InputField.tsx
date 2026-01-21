"use client";
import React, { useMemo, useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  showPasswordToggle?: boolean;
};

export default function Input({
  label,
  error,
  helperText,
  showPasswordToggle = false,
  type = "text",
  className = "",
  value,
  onChange,
  readOnly,
  ...props
}: InputProps) {
  const safeValue = value ?? "";

  const isPassword = type === "password";
  const [showPw, setShowPw] = useState(false);

  const inputType = useMemo(() => {
	if (!isPassword) return type;
	return showPw ? "text" : "password";
  }, [isPassword, showPw, type]);

  const allowToggle = isPassword && showPasswordToggle && !readOnly;

  return (
	<div className="flex flex-col gap-1">
		{/* Label */}
		{label && (
			<label className="text-smallTitle font-medium text-myApp-blue">
				{label}
			</label>
		)}

		{/* Input */}
		<div className="relative w-full max-w-md">
			<input
				value={safeValue}
				onChange={readOnly ? undefined : onChange}
				readOnly={readOnly}
				type={inputType}
				className={`
					px-4 py-2 rounded-lg
					w-full max-w-md
					shadow-sm text-body font-medium
					bg-myApp-white
					text-myApp-blueDark
					placeholder:text-myApp-shadow
					focus:outline-none focus:ring-2
					${allowToggle ? "pr-12" : ""}
					${
					error
						? "border-myApp-red focus:ring-myApp-red/40"
						: "border-myApp-shadow focus:ring-myApp-blue/40"
					}
					${readOnly ? "cursor-not-allowed" : ""}
					${className}
				`}
				{...props}
			/>

			{allowToggle && (
				<button
					type="button"
					onClick={() => setShowPw((p) => !p)}
					className="absolute right-3 top-1/2 -translate-y-1/2 text-myApp-blue hover:opacity-80"
					aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
					tabIndex={-1}
				>
					{showPw ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
				</button>
			)}
		</div>

	  {/* Helper / Error */}
	  {error ? (
		<p className="text-xs text-myApp-red">{error}</p>
	  ) : (
		helperText && (
		  <p className="text-xs text-myApp-blueDark/70">{helperText}</p>
		)
	  )}
	</div>
  );
}