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
  color = "indigo",
}: StatsCardProps) {
  const iconBg = {
    indigo: "bg-[rgba(255,99,99,0.1)] text-[#FF6363]",
    emerald: "bg-[rgba(52,211,153,0.1)] text-[#34D399]",
    amber: "bg-[rgba(251,191,36,0.1)] text-[#FBBF24]",
    rose: "bg-[rgba(251,113,133,0.1)] text-[#FB7185]",
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-[13px] text-[#666] font-medium">{title}</p>
          <p className="text-2xl font-bold text-[#fafafa] tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs text-[#34D399] font-medium">{trend}</p>
          )}
        </div>
        <div
          className={cn(
            "p-2.5 rounded-lg",
            iconBg[color]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
