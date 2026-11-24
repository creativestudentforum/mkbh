"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("skeleton", className)} />;
}

/**
 * A skeleton placeholder for a profile card
 */
export function ProfileCardSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-[28px] p-6 sm:p-7 h-[420px] flex flex-col justify-between">
      <div>
        <Skeleton className="h-3 w-28 rounded-full mb-3" />
        <Skeleton className="h-6 w-3/4 rounded-md mb-2" />
        <Skeleton className="h-4 w-1/2 rounded mb-1" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  );
}

/**
 * A skeleton placeholder for a stats card
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * A skeleton for user management rows 
 */
export function UserRowSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-xl p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-3 w-3/5" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton for teacher cards
 */
export function TeacherCardSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-10 w-full mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}

/**
 * A skeleton for album cards
 */
export function AlbumCardSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-xl overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-12 rounded-md" />
        </div>
        <Skeleton className="h-3 w-4/5" />
        <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton for event cards
 */
export function EventCardSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-xl overflow-hidden flex">
      <div className="w-16 bg-white/[0.02] flex flex-col items-center justify-center py-4 space-y-1.5 flex-shrink-0">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-6 w-7" />
      </div>
      <div className="flex-1 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton for batch cards
 */
export function BatchCardSkeleton() {
  return (
    <div className="bg-[#13151b] border border-white/[0.08] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="w-9 h-9 rounded-lg" />
      </div>
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between items-center">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-4" />
      </div>
    </div>
  );
}
