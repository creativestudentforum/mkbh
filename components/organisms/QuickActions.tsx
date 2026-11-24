"use client";

import QuickActionCard, {
  type QuickActionAccent,
} from "@/components/molecules/QuickActionCard";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  Users,
  Layers,
  CalendarDays,
  Droplets,
  DollarSign,
  Flower2,
  Images,
  CreditCard,
  UserCircle,
} from "lucide-react";
import React from "react";

interface QuickActionConfig {
  href: string;
  icon: React.ElementType;
  accent: QuickActionAccent;
  labelKey:
    | "quickAction.directory"
    | "quickAction.batches"
    | "quickAction.events"
    | "quickAction.blood"
    | "quickAction.fund"
    | "quickAction.memorial"
    | "quickAction.gallery"
    | "quickAction.idCard"
    | "quickAction.profile";
  subKey:
    | "quickAction.directorySub"
    | "quickAction.batchesSub"
    | "quickAction.eventsSub"
    | "quickAction.bloodSub"
    | "quickAction.fundSub"
    | "quickAction.memorialSub"
    | "quickAction.gallerySub"
    | "quickAction.idCardSub"
    | "quickAction.profileSub";
}

const QUICK_ACTIONS: QuickActionConfig[] = [
  {
    href: "/directory",
    icon: Users,
    accent: "teal",
    labelKey: "quickAction.directory",
    subKey: "quickAction.directorySub",
  },
  {
    href: "/batches",
    icon: Layers,
    accent: "blue",
    labelKey: "quickAction.batches",
    subKey: "quickAction.batchesSub",
  },
  {
    href: "/events",
    icon: CalendarDays,
    accent: "violet",
    labelKey: "quickAction.events",
    subKey: "quickAction.eventsSub",
  },
  {
    href: "/blood",
    icon: Droplets,
    accent: "rose",
    labelKey: "quickAction.blood",
    subKey: "quickAction.bloodSub",
  },
  {
    href: "/fund",
    icon: DollarSign,
    accent: "amber",
    labelKey: "quickAction.fund",
    subKey: "quickAction.fundSub",
  },
  {
    href: "/memorial",
    icon: Flower2,
    accent: "purple",
    labelKey: "quickAction.memorial",
    subKey: "quickAction.memorialSub",
  },
  {
    href: "/gallery",
    icon: Images,
    accent: "emerald",
    labelKey: "quickAction.gallery",
    subKey: "quickAction.gallerySub",
  },
  {
    href: "/id-card",
    icon: CreditCard,
    accent: "sky",
    labelKey: "quickAction.idCard",
    subKey: "quickAction.idCardSub",
  },
  {
    href: "/profile",
    icon: UserCircle,
    accent: "fuchsia",
    labelKey: "quickAction.profile",
    subKey: "quickAction.profileSub",
  },
];

interface QuickActionsProps {
  className?: string;
}

export default function QuickActions({ className }: QuickActionsProps) {
  const { t } = useI18n();

  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#f3f4f6]">
          {t("dashboard.quickActions")}
        </h2>
        <p className="text-xs text-[#9ca3af] mt-0.5">
          {t("dashboard.quickActionsSub")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard
            key={action.href}
            href={action.href}
            icon={action.icon}
            accent={action.accent}
            label={t(action.labelKey)}
            subtitle={t(action.subKey)}
          />
        ))}
      </div>
    </section>
  );
}
