"use client";

import Card from "@/components/atoms/Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "indigo" | "emerald" | "amber" | "rose";
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs text-[#9ca3af] font-medium tracking-wide uppercase">{title}</p>
          <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs text-[#34d399] font-medium pt-0.5">{trend}</p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-white/[0.04] text-[#9ca3af] border border-white/[0.08] flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
