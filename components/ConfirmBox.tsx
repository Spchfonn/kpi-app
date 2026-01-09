"use client";

import React, { useEffect } from "react";
import Button from "@/components/Button";

type ConfirmBoxProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmBox({
  open,
  title,
  message,
  confirmText = "ตกลง",
  cancelText = "ยกเลิก",
  onConfirm,
  onCancel,
}: ConfirmBoxProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* overlay */}
      <button
        type="button"
        className="absolute inset-0 bg-myApp-black/30"
        onClick={onCancel}
        aria-label="Close modal"
      />

      {/* dialog */}
      <div className="relative items-center mx-auto w-87 max-w-[90vw] rounded-2xl bg-myApp-white shadow-lg p-8">
        {title && (
          <h3 className="text-nav font-medium text-myApp-blueDark mb-2">
            {title}
          </h3>
        )}

        <p className="text-nav font-medium text-myApp-blueDark text-center mb-6">
          {message}
        </p>

        <div className="flex justify-center gap-4">
          <Button variant="outline" primaryColor="red" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}