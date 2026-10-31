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
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      <div className="flex items-start gap-4">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

/**
 * A skeleton placeholder for a stats card
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="w-12 h-12 rounded-xl" />
      </div>
    </div>
  );
}

/**
 * A skeleton for user management rows 
 */
export function UserRowSkeleton() {
  return (
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5">
      <div className="flex items-center gap-4">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
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
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 animate-card-in">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-12 w-full mb-3" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-md" />
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    </div>
  );
}

/**
 * A skeleton for album cards
 */
export function AlbumCardSkeleton() {
  return (
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden animate-card-in">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <Skeleton className="h-4 w-4/5" />
        <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] flex justify-between items-center">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-4" />
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
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl overflow-hidden flex animate-card-in">
      <div className="w-20 bg-[rgba(255,255,255,0.02)] flex flex-col items-center justify-center py-5 space-y-2 flex-shrink-0">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-7 w-8" />
      </div>
      <div className="flex-1 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-16 rounded-md" />
        </div>
        <Skeleton className="h-3 w-full" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
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
    <div className="bg-[#141414] border border-[rgba(255,255,255,0.06)] rounded-xl p-5 animate-card-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-20" />
        </div>
        <Skeleton className="w-11 h-11 rounded-xl" />
      </div>
      <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)] flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
