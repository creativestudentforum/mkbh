"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
      return () => window.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full ${sizes[size]} bg-[#141414] border border-[rgba(255,255,255,0.06)] shadow-[0_24px_64px_rgba(0,0,0,0.5)]
          /* Mobile: bottom sheet style */
          rounded-t-xl sm:rounded-xl
          max-h-[90vh] sm:max-h-[85vh]
          animate-in slide-up sm:zoom-in-95 duration-200
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[rgba(255,255,255,0.06)] flex-shrink-0">
          {/* Mobile drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[rgba(255,255,255,0.1)] sm:hidden" />
          <h3 className="text-[15px] font-semibold text-[#fafafa] mt-1 sm:mt-0">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors -mr-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
