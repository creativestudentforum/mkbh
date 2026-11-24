"use client";

import Badge from "@/components/atoms/Badge";
import DashboardShell from "@/components/organisms/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { Batch, BatchStats } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarRange,
  Camera,
  GraduationCap,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";

type BatchWithStats = Batch & BatchStats;

export default function BatchesPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["batches"],
    queryFn: async () => {
      const [batchesResponse, statsResponse] = await Promise.all([
        supabase.from("batches").select("*").order("year", { ascending: false }),
        supabase.from("batch_stats").select("*"),
      ]);

      if (batchesResponse.error) throw new Error(batchesResponse.error.message);
      if (statsResponse.error) throw new Error(statsResponse.error.message);

      const statsMap = new Map<string, { members: number; photos: number }>();
      ((statsResponse.data || []) as BatchStats[]).forEach((item) => {
        statsMap.set(item.year, {
          members: item.members || 0,
          photos: item.photos || 0,
        });
      });

      const batches = (batchesResponse.data || []) as Batch[];

      return batches.map((batch) => {
        const stat = statsMap.get(batch.year);
        return {
          ...batch,
          members: stat?.members || 0,
          photos: stat?.photos || 0,
        };
      });
    },
  });

  const activeBatches = data?.filter((batch) => batch.members > 0 || (batch.photos || 0) > 0) || [];
  const emptyBatches = data?.filter((batch) => batch.members === 0 && (batch.photos || 0) === 0) || [];

  return (
    <DashboardShell title="Batches">
      <div className="max-w-6xl mx-auto space-y-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
              SSC Batches Archive
            </h2>
            <CalendarRange className="w-5 h-5 text-[#c89542]" />
          </div>
          <p className="text-sm text-[#86868b]">
            Explore alumni cohorts by SSC graduation year, view member rosters, and browse batch photo galleries.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[380px] bg-[#13151b] animate-pulse rounded-[28px] border border-white/[0.08]"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-[28px] bg-[#13151b] border border-white/[0.08] text-center">
            <p className="text-xs text-red-400">Could not load batches.</p>
          </div>
        ) : data && data.length > 0 ? (
          <div className="space-y-8">
            <BatchGrid
              title="Active Cohorts"
              batches={activeBatches}
              currentUserId={user?.id}
            />
            {emptyBatches.length > 0 && (
              <BatchGrid
                title="Unregistered Cohorts"
                batches={emptyBatches}
                currentUserId={user?.id}
                muted
              />
            )}
          </div>
        ) : (
          <div className="p-12 rounded-[28px] bg-[#13151b] border border-white/[0.08] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-[#9ca3af]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-[#f3f4f6] mb-1">No batches found</p>
            <p className="text-xs text-[#86868b]">Batches will appear here once seeded or created.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function BatchGrid({
  title,
  batches,
  currentUserId,
  muted = false,
}: {
  title: string;
  batches: BatchWithStats[];
  currentUserId?: string;
  muted?: boolean;
}) {
  if (batches.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-lg font-semibold tracking-tight ${muted ? "text-[#86868b]" : "text-[#f3f4f6]"}`}>
          {title}
        </h3>
        <Badge variant={muted ? "default" : "info"}>
          {batches.length} batch{batches.length === 1 ? "" : "es"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {batches.map((batch) => {
          const isUserCoordinator = Boolean(
            currentUserId && batch.coordinator_id === currentUserId
          );
          const photoCount = batch.photos || 0;

          return (
            <Link
              key={batch.year}
              href={`/batches/${encodeURIComponent(batch.year)}`}
              className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-[28px]"
            >
              <div
                className={`rounded-[28px] p-6 sm:p-7 h-[390px] flex flex-col justify-between select-none bg-[#13151b] border transition-all duration-300 ease-out shadow-sm hover:shadow-xl ${
                  isUserCoordinator
                    ? "border-[#22785c]/60 bg-[#141b18]/70 hover:bg-[#17221d]"
                    : "border-white/[0.08] hover:border-white/20 hover:bg-[#161922]"
                } ${muted ? "opacity-60" : ""}`}
              >
                {/* Top Section */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#86868b] tracking-tight uppercase">
                      SSC Academic Cohort
                    </span>
                    {isUserCoordinator && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#34d399] bg-[#22785c]/20 border border-[#22785c]/40 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" />
                        Coordinator
                      </span>
                    )}
                  </div>

                  <h4 className="text-[26px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.15] group-hover:text-white transition-colors">
                    Batch of {batch.year}
                  </h4>

                  <p className="mt-2 text-[13px] text-[#86868b] leading-relaxed line-clamp-2">
                    {batch.description || `${batch.members} registered alumni members connected in this batch network.`}
                  </p>
                </div>

                {/* Middle Artwork: Apple-Style Cohort Seal Graphic */}
                <div className="my-auto py-2 flex items-center justify-center">
                  <div className="w-full h-28 rounded-2xl bg-gradient-to-tr from-white/[0.02] via-[#1a1d26] to-white/[0.05] border border-white/[0.06] flex items-center justify-center relative overflow-hidden group-hover:border-white/15 transition-all">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-[#c89542] shadow-inner group-hover:scale-105 transition-transform">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono tracking-widest text-[#9ca3af] uppercase">
                        CLASS OF {batch.year}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Area */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#86868b]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#6b7280]" />
                      {batch.members} alumni
                    </span>
                    {photoCount > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#c89542]">
                          <Camera className="w-3 h-3" />
                          {photoCount}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Apple Floating Plus Icon */}
                  <div
                    aria-label={`Explore Batch of ${batch.year}`}
                    className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm"
                  >
                    <Plus className="w-4 h-4 text-white/90" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
