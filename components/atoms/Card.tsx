"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className,
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl",
        hover &&
          "hover:border-[rgba(255,255,255,0.12)] hover:bg-[#181818] transition-all duration-300 cursor-pointer hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
