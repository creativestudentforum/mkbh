"use client";

import { cn } from "@/lib/utils";
import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-medium text-[#9ca3af]"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#6b7280] group-focus-within:text-[#9ca3af] transition-colors duration-150">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-lg bg-[#0e1015] border border-white/10 text-[#f3f4f6] placeholder-[#555d6e]",
              "px-3 py-2 text-sm transition-colors duration-150",
              "focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c]",
              "hover:border-white/20",
              Boolean(icon) && "pl-9",
              error && "border-red-500/60 focus:ring-red-500 focus:border-red-500",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
