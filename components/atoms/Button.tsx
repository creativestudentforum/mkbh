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
      "inline-flex items-center justify-center font-medium transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0d11] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none";

    const variants = {
      primary:
        "bg-[#1a634b] text-white hover:bg-[#22785c] active:bg-[#15503c] border border-[#2a7a5e]/50 focus-visible:ring-[#2e9e7b]",
      secondary:
        "bg-[#181b22] text-[#f3f4f6] hover:bg-[#20242e] active:bg-[#15181f] border border-white/10 hover:border-white/20 focus-visible:ring-white/30",
      ghost:
        "text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.06] active:bg-white/[0.1] focus-visible:ring-white/20",
      danger:
        "bg-[#991b1b] text-white hover:bg-[#b91c1c] active:bg-[#7f1d1d] border border-red-500/30 focus-visible:ring-red-400",
    };

    const sizes = {
      sm: "text-xs px-2.5 py-1.5 rounded-md gap-1.5",
      md: "text-sm px-3.5 py-2 rounded-lg gap-2",
      lg: "text-sm px-4.5 py-2.5 rounded-lg gap-2.5 font-medium",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
