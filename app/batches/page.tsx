"use client";

import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Batch, BatchStats } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarRange, GraduationCap, Users } from "lucide-react";
import Link from "next/link";

export default function BatchesPage() {
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

      const stats = new Map(((statsResponse.data || []) as BatchStats[]).map((item) => [item.year, item.members]));
      const batches = (batchesResponse.data || []) as Batch[];

      return batches.map((batch) => ({
        ...batch,
        members: stats.get(batch.year) || 0,
      }));
    },
  });

  const activeBatches = data?.filter((batch) => batch.members > 0) || [];
  const emptyBatches = data?.filter((batch) => batch.members === 0) || [];

  return (
    <DashboardShell title="Batches">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Batches</h2>
            <CalendarRange className="w-5 h-5 text-[#FF6363]" />
          </div>
          <p className="text-[#777] text-[14px]">Browse alumni by SSC batch year.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, index) => <div key={index} className="skeleton h-32 rounded-xl" />)}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-[13px] text-[#EF4444]">Could not load batches. Make sure the batch migration has been run.</p>
          </Card>
        ) : data && data.length > 0 ? (
          <div className="space-y-8">
            <BatchGrid title="Active Batches" batches={activeBatches} />
            {emptyBatches.length > 0 && <BatchGrid title="No Members Yet" batches={emptyBatches} muted />}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
              <GraduationCap className="w-7 h-7 text-[#444]" />
            </div>
            <p className="text-[13px] text-[#666] mb-1">No batches found</p>
            <p className="text-[11px] text-[#444]">Run the batch migration to seed batch years.</p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}

function BatchGrid({
  title,
  batches,
  muted = false,
}: {
  title: string;
  batches: Array<Batch & BatchStats>;
  muted?: boolean;
}) {
  if (batches.length === 0) return null;

  return (
    <section className="space-y-4 slide-up stagger-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className={`text-[15px] font-semibold ${muted ? "text-[#777]" : "text-[#fafafa]"}`}>{title}</h3>
        <Badge variant={muted ? "default" : "info"}>{batches.length} batch{batches.length === 1 ? "" : "es"}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {batches.map((batch) => (
          <Link key={batch.year} href={`/batches/${encodeURIComponent(batch.year)}`}>
            <Card hover className={`p-5 ${muted ? "opacity-65" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1">Batch</p>
                  <h4 className="text-[24px] font-bold text-[#fafafa] leading-tight">{batch.year}</h4>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[rgba(255,99,99,0.08)] flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-[#FF6363]" />
                </div>
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <span className="flex items-center gap-1.5 text-[13px] text-[#888]"><Users className="w-4 h-4 text-[#555]" />{batch.members} member{batch.members === 1 ? "" : "s"}</span>
                <ArrowRight className="w-4 h-4 text-[#555]" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
