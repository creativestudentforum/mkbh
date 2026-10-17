import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97]";

    const variants = {
      primary:
        "bg-[#FF6363] text-white hover:bg-[#FF4F4F] focus-visible:ring-[#FF6363] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(255,99,99,0.15)] hover:shadow-[0_2px_8px_rgba(255,99,99,0.3),0_0_0_1px_rgba(255,99,99,0.2)]",
      secondary:
        "bg-[#1a1a1a] text-[#e5e5e5] hover:bg-[#222222] focus-visible:ring-[#444] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.14)]",
      ghost:
        "text-[#a0a0a0] hover:text-white hover:bg-[rgba(255,255,255,0.06)] focus-visible:ring-[#444]",
      danger:
        "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus-visible:ring-[#DC2626] shadow-[0_1px_2px_rgba(0,0,0,0.3),0_0_0_1px_rgba(220,38,38,0.15)]",
    };

    const sizes = {
      sm: "text-[13px] px-3 py-1.5 gap-1.5",
      md: "text-[13px] px-4 py-2 gap-2",
      lg: "text-sm px-5 py-2.5 gap-2.5",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
