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
      <div className="space-y-2">
        {label && (
          <label
            htmlFor={id}
            className="block text-[13px] font-medium text-[#a0a0a0]"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#555] group-focus-within:text-[#888] transition-colors duration-200">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444]",
              "px-3.5 py-2.5 text-[13px] transition-all duration-200",
              "focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)]",
              "hover:border-[rgba(255,255,255,0.14)]",
              Boolean(icon) && "pl-10",
              error && "border-[#DC2626] focus:ring-[#DC2626] focus:border-[#DC2626]",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[13px] text-[#DC2626]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
