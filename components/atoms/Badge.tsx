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
    default: "bg-white/[0.05] text-[#9ca3af] border border-white/10",
    success: "bg-[#1a634b]/20 text-[#34d399] border border-[#22785c]/35",
    warning: "bg-[#c89542]/15 text-[#e5b869] border border-[#c89542]/30",
    danger: "bg-red-500/15 text-red-300 border border-red-500/30",
    info: "bg-white/[0.08] text-[#f3f4f6] border border-white/15",
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
