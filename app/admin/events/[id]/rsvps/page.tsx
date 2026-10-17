"use client";

import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Event, EventRsvp } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

function csvValue(value: string | number | null | undefined) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AdminEventRsvpsPage() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-event-rsvps", eventId],
    queryFn: async () => {
      const [eventResponse, rsvpResponse] = await Promise.all([
        supabase.from("events").select("*").eq("id", eventId).single(),
        supabase
          .from("event_rsvps")
          .select("*, profiles(full_name, batch, phone)")
          .eq("event_id", eventId)
          .order("created_at", { ascending: false }),
      ]);

      if (eventResponse.error) throw new Error(eventResponse.error.message);
      if (rsvpResponse.error) throw new Error(rsvpResponse.error.message);

      return {
        event: eventResponse.data as Event,
        rsvps: (rsvpResponse.data || []) as EventRsvp[],
      };
    },
  });

  const rsvps = data?.rsvps || [];
  const going = rsvps.filter((item) => item.status === "going");
  const totalHeadcount = going.reduce((total, item) => total + 1 + item.guests, 0);

  const exportCsv = () => {
    const rows = [
      ["Name", "Batch", "Phone", "Status", "Guests", "Headcount", "Submitted At"],
      ...rsvps.map((item) => [
        item.profiles?.full_name || "",
        item.profiles?.batch || "",
        item.profiles?.phone || "",
        item.status,
        item.guests,
        item.status === "going" ? item.guests + 1 : 0,
        item.created_at,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data?.event?.title || "event"}-rsvps.csv`.replaceAll(" ", "-").toLowerCase();
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardShell title="Event RSVPs">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div>
            <Link href="/admin/events" className="inline-flex items-center gap-2 text-[12px] text-[#777] hover:text-[#FF6363] transition-colors mb-3">
              <ArrowLeft className="w-4 h-4" /> Back to events
            </Link>
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">{data?.event?.title || "Event RSVPs"}</h2>
            <p className="text-[#777] text-[14px]">RSVP list, guest count, and CSV export.</p>
          </div>
          <Button onClick={exportCsv} disabled={!rsvps.length} variant="secondary">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 slide-up stagger-2">
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider font-semibold mb-2">Going</p><p className="text-[28px] font-bold text-[#fafafa]">{going.length}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider font-semibold mb-2">Total Headcount</p><p className="text-[28px] font-bold text-[#fafafa]">{totalHeadcount}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider font-semibold mb-2">All Responses</p><p className="text-[28px] font-bold text-[#fafafa]">{rsvps.length}</p></Card>
        </div>

        <Card className="p-0 overflow-hidden slide-up stagger-3">
          {isLoading ? (
            <div className="p-6 space-y-3">{[...Array(5)].map((_, index) => <div key={index} className="skeleton h-12 rounded-lg" />)}</div>
          ) : rsvps.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.06)]">
                  <tr className="text-[11px] text-[#555] uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Batch</th>
                    <th className="px-4 py-3 font-semibold">Phone</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Guests</th>
                    <th className="px-4 py-3 font-semibold">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {rsvps.map((item) => (
                    <tr key={item.id} className="text-[13px] text-[#a0a0a0]">
                      <td className="px-4 py-3 text-[#fafafa] font-medium">{item.profiles?.full_name || "Unknown"}</td>
                      <td className="px-4 py-3">{item.profiles?.batch || "N/A"}</td>
                      <td className="px-4 py-3">{item.profiles?.phone || "N/A"}</td>
                      <td className="px-4 py-3"><Badge variant={item.status === "going" ? "success" : item.status === "maybe" ? "warning" : "default"}>{item.status.replace("_", " ")}</Badge></td>
                      <td className="px-4 py-3">{item.guests}</td>
                      <td className="px-4 py-3">{formatDate(item.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                <Users className="w-7 h-7 text-[#444]" />
              </div>
              <p className="text-[13px] text-[#555]">No RSVPs yet</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
