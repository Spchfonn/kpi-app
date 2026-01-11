import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export default function Input({
  label,
  error,
  helperText,
  className = "",
  value,
  ...props
}: InputProps) {
  const safeValue = value ?? "";

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      {label && (
        <label className="text-smallTitle font-medium text-myApp-blue">
          {label}
        </label>
      )}

      {/* Input */}
      <input
        className={`
          px-4 py-2 rounded-lg
          w-full max-w-md
          shadow-sm text-body font-medium
          bg-myApp-white
          text-myApp-blueDark
          placeholder:text-myApp-shadow
          focus:outline-none focus:ring-2
          ${
            error
              ? "border-myApp-red focus:ring-myApp-red/40"
              : "border-myApp-shadow focus:ring-myApp-blue/40"
          }
          ${className}
        `}
        {...props}
      />

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