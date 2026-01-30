"use client";

import { useEffect } from "react";

type SuccessModalProps = {
  open: boolean;
  title?: string;
  message: string;
  duration?: number; // ms
  onClose: () => void;
};

export default function SuccessModal({
  open,
  title,
  message,
  duration = 3000,
  onClose,
}: SuccessModalProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-myApp-black/30" />

      {/* dialog */}
      <div className="relative mx-auto w-87 max-w-[90vw] rounded-2xl bg-myApp-white shadow-lg p-8 text-center">
        {title && (
          <h3 className="text-nav font-medium text-myApp-blueDark mb-2">
            {title}
          </h3>
        )}

        <p className="text-nav font-medium text-myApp-blueDark">
          {message}
        </p>
      </div>
    </div>
  );
}