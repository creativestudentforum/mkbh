"use client";

import { cn } from "@/lib/utils";
import {
  Megaphone,
  CalendarDays,
  Droplets,
  DollarSign,
  Flower2,
  UserPlus,
  Pin,
  Plus,
} from "lucide-react";
import Link from "next/link";
import React from "react";

export type NotificationType =
  | "announcement"
  | "event"
  | "blood"
  | "fund"
  | "memorial"
  | "member";

export type NotificationAccent =
  | "teal"
  | "blue"
  | "purple"
  | "amber"
  | "red"
  | "green";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  label: string;
  title: string;
  summary: string;
  date: string;
  href?: string;
  accent: NotificationAccent;
  rawContent?: string;
  authorName?: string;
  isPinned?: boolean;
}

interface NotificationCardProps {
  item: NotificationItem;
  onClick?: (item: NotificationItem) => void;
  isFeatured?: boolean;
}

export function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "event":
      return CalendarDays;
    case "blood":
      return Droplets;
    case "fund":
      return DollarSign;
    case "memorial":
      return Flower2;
    case "member":
      return UserPlus;
    case "announcement":
    default:
      return Megaphone;
  }
}

/**
 * Renders an Apple-inspired minimal product/graphic illustration
 * at the bottom of the card, mirroring Apple Store feature cards.
 */
function NotificationArtwork({ type }: { type: NotificationType }) {
  switch (type) {
    case "fund":
      // Apple Card inspired metallic luxury card graphic
      return (
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="w-48 h-28 rounded-2xl bg-gradient-to-tr from-[#2a2d36] via-[#1a1c22] to-[#3a3e4c] p-3 shadow-xl border border-white/15 transform -rotate-3 transition-transform duration-300 group-hover:rotate-0 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <DollarSign className="w-4 h-4 text-[#e5b869]" />
              <span className="text-[9px] font-mono tracking-widest text-white/50 uppercase">ALUMNI FUND</span>
            </div>
            <div className="space-y-1">
              <div className="w-10 h-2 rounded bg-[#e5b869]/30" />
              <p className="text-[10px] font-mono text-white/70 tracking-wider">•••• 2026</p>
            </div>
          </div>
        </div>
      );
    case "event":
      // Apple Calendar / Ticket pass graphic
      return (
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="w-44 h-28 rounded-2xl bg-gradient-to-b from-[#1b2234] to-[#121622] p-3.5 shadow-xl border border-blue-500/20 transform rotate-2 transition-transform duration-300 group-hover:rotate-0 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">REUNION</span>
              <CalendarDays className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-2xl font-bold font-serif text-white">SAVE</span>
              <span className="text-[11px] text-[#9ca3af]">THE DATE</span>
            </div>
          </div>
        </div>
      );
    case "blood":
      // Apple Health style clean droplet emblem
      return (
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="w-36 h-28 rounded-2xl bg-gradient-to-br from-red-950/40 via-[#181214] to-red-900/20 p-3 shadow-xl border border-red-500/20 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
            <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <Droplets className="w-5 h-5 fill-red-500/30" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-red-300">URGENT DONOR</span>
          </div>
        </div>
      );
    case "memorial":
      // Eternal peace tribute graphic
      return (
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="w-40 h-28 rounded-2xl bg-gradient-to-tr from-purple-950/30 via-[#15131c] to-purple-900/20 p-3 shadow-xl border border-purple-500/20 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
            <div className="w-10 h-10 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <Flower2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-serif italic text-purple-200">In Loving Memory</span>
          </div>
        </div>
      );
    case "member":
      // Welcome alumni network badge
      return (
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="w-40 h-28 rounded-2xl bg-gradient-to-tr from-emerald-950/30 via-[#121815] to-emerald-900/20 p-3 shadow-xl border border-emerald-500/20 flex flex-col items-center justify-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">COMMUNITY</span>
          </div>
        </div>
      );
    case "announcement":
    default:
      // Official notice acoustic broadcast graphic (like card 3 in Apple image)
      return (
        <div className="relative w-full h-32 flex items-center justify-center">
          <div className="w-44 h-28 rounded-2xl bg-gradient-to-br from-teal-950/30 via-[#13171b] to-[#181d24] p-3 shadow-xl border border-white/10 flex flex-col items-center justify-center gap-2 transition-transform duration-300 group-hover:scale-105">
            <div className="flex items-center gap-1.5 text-teal-400">
              <div className="w-1 h-3 bg-teal-400/50 rounded-full animate-pulse" />
              <div className="w-1 h-6 bg-teal-400/80 rounded-full" />
              <div className="w-9 h-9 rounded-full bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
                <Megaphone className="w-4 h-4" />
              </div>
              <div className="w-1 h-6 bg-teal-400/80 rounded-full" />
              <div className="w-1 h-3 bg-teal-400/50 rounded-full animate-pulse" />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">BULLETIN</span>
          </div>
        </div>
      );
  }
}

export default function NotificationCard({
  item,
  onClick,
  isFeatured = false,
}: NotificationCardProps) {
  const Icon = getNotificationIcon(item.type);

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(item);
    }
  };

  const cardContent = (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.(item);
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between text-left select-none",
        "w-[300px] sm:w-[340px] md:w-[360px] h-[410px] sm:h-[430px]",
        "rounded-[28px] p-6 sm:p-7 flex-shrink-0 snap-start cursor-pointer",
        "bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922]",
        "transition-all duration-300 ease-out shadow-sm hover:shadow-xl",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        item.isPinned && "border-[#c89542]/35 bg-[#171714]/80"
      )}
    >
      {/* Top Section: Eyebrow + Title + Description */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.isPinned ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#c89542]/20 text-[#e5b869] border border-[#c89542]/30">
                <Pin className="w-2.5 h-2.5 fill-current" />
                PINNED
              </span>
            ) : (
              <span className="text-xs font-semibold text-[#86868b] tracking-tight uppercase flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-[#9ca3af]" />
                {item.label}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#6b7280]">
            {item.date}
          </span>
        </div>

        <h3 className="text-[21px] sm:text-[23px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.2] mt-1.5 line-clamp-2 group-hover:text-white transition-colors">
          {item.title}
        </h3>

        <p className="mt-2 text-[13px] text-[#86868b] leading-relaxed line-clamp-3">
          {item.summary}
        </p>
      </div>

      {/* Middle/Bottom Area: Minimal Apple-Style Graphic */}
      <div className="my-auto py-2">
        <NotificationArtwork type={item.type} />
      </div>

      {/* Footer Area: Meta info + Apple floating plus icon */}
      <div className="pt-2 flex items-center justify-between">
        <span className="text-[11px] text-[#6b7280] truncate max-w-[200px]">
          {item.authorName ? `By ${item.authorName}` : "Alumni Committee"}
        </span>

        {/* Apple Iconic Floating Plus Button */}
        <div
          aria-label="View details"
          className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm"
        >
          <Plus className="w-4 h-4 text-white/90" />
        </div>
      </div>
    </div>
  );

  if (item.href && !onClick) {
    return (
      <Link href={item.href} className="outline-none block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export function NotificationCardSkeleton() {
  return (
    <div className="w-[300px] sm:w-[340px] md:w-[360px] h-[410px] sm:h-[430px] rounded-[28px] p-6 sm:p-7 flex-shrink-0 snap-start bg-[#13151b] border border-white/[0.08] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-white/10 rounded-full" />
          <div className="h-3 w-16 bg-white/5 rounded" />
        </div>
        <div className="space-y-2.5 mt-3">
          <div className="h-6 w-4/5 bg-white/10 rounded-md" />
          <div className="h-4 w-full bg-white/5 rounded" />
          <div className="h-4 w-2/3 bg-white/5 rounded" />
        </div>
      </div>
      <div className="h-28 w-full bg-white/[0.03] rounded-2xl flex items-center justify-center" />
      <div className="pt-2 flex items-center justify-between">
        <div className="h-3 w-24 bg-white/5 rounded" />
        <div className="w-9 h-9 rounded-full bg-white/10" />
      </div>
    </div>
  );
}
