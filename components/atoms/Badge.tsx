import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export default function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants = {
    default: "bg-[rgba(255,255,255,0.06)] text-[#a0a0a0] border border-[rgba(255,255,255,0.06)]",
    success: "bg-[rgba(52,211,153,0.1)] text-[#34D399] border border-[rgba(52,211,153,0.15)]",
    warning: "bg-[rgba(251,191,36,0.1)] text-[#FBBF24] border border-[rgba(251,191,36,0.15)]",
    danger: "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.15)]",
    info: "bg-[rgba(255,99,99,0.1)] text-[#FF6363] border border-[rgba(255,99,99,0.15)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
