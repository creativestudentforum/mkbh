"use client";

import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export type QuickActionAccent =
  | "teal"
  | "blue"
  | "violet"
  | "rose"
  | "amber"
  | "purple"
  | "emerald"
  | "sky"
  | "fuchsia";

interface QuickActionCardProps {
  href: string;
  label: string;
  subtitle: string;
  icon: React.ElementType;
  accent?: QuickActionAccent;
  className?: string;
}

export default function QuickActionCard({
  href,
  label,
  subtitle,
  icon: Icon,
  className,
}: QuickActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col justify-between text-left",
        "rounded-xl p-4 sm:p-4.5",
        "bg-[#13151b] hover:bg-[#181b23]",
        "border border-white/10 hover:border-white/20",
        "transition-colors duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22785c]",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#d1d5db] group-hover:text-white transition-colors">
          <Icon className="w-4 h-4" />
        </div>
        <ChevronRight className="w-4 h-4 text-[#6b7280] group-hover:text-white transition-colors" />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#f3f4f6] tracking-tight group-hover:text-white transition-colors">
          {label}
        </h3>
        <p className="text-xs text-[#9ca3af] line-clamp-1 mt-0.5">
          {subtitle}
        </p>
      </div>
    </Link>
  );
}
