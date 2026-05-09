"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import { createClient } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";
import {
  CalendarDays, MapPin, Clock, Sparkles,
} from "lucide-react";

export default function EventsPage() {
  const supabase = createClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, profiles(full_name, avatar_url)")
        .eq("is_active", true)
        .order("event_date", { ascending: true });
      return data as Event[];
    },
  });

  const now = new Date();

  const upcomingEvents = events?.filter(
    (e) => new Date(e.event_date) >= now
  ) || [];

  const pastEvents = events?.filter(
    (e) => new Date(e.event_date) < now
  ) || [];

  return (
    <DashboardShell title="Events">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Events</h2>
            <Sparkles className="w-5 h-5 text-[#FBBF24]" />
          </div>
          <p className="text-[#777] text-[14px]">Stay updated with alumni gatherings and reunions</p>
        </div>

        {/* Upcoming Events */}
        <div className="slide-up stagger-2">
          <h3 className="text-[15px] font-semibold text-[#fafafa] mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" />
            Upcoming Events
          </h3>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="skeleton h-48 rounded-xl" />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} isUpcoming />
              ))}
            </div>
          ) : (
            <Card className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                <CalendarDays className="w-7 h-7 text-[#444]" />
              </div>
              <p className="text-[13px] text-[#555]">No upcoming events scheduled</p>
            </Card>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="slide-up stagger-3">
            <h3 className="text-[15px] font-semibold text-[#777] mb-4">Past Events</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function EventCard({ event, isUpcoming = false }: { event: Event; isUpcoming?: boolean }) {
  const eventDate = new Date(event.event_date);
  const month = eventDate.toLocaleString("default", { month: "short" }).toUpperCase();
  const day = eventDate.getDate();

  return (
    <Card className={`p-0 overflow-hidden group ${!isUpcoming ? "opacity-60" : ""}`} hover={isUpcoming}>
      <div className="flex">
        {/* Date column */}
        <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-5 ${isUpcoming ? "bg-[rgba(255,99,99,0.06)]" : "bg-[rgba(255,255,255,0.02)]"}`}>
          <span className={`text-[10px] font-bold tracking-wider uppercase ${isUpcoming ? "text-[#FF6363]" : "text-[#555]"}`}>{month}</span>
          <span className={`text-[28px] font-bold leading-none mt-1 ${isUpcoming ? "text-[#fafafa]" : "text-[#666]"}`}>{day}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-[14px] font-semibold text-[#fafafa] leading-tight truncate">{event.title}</h4>
            {isUpcoming && <Badge variant="success">Upcoming</Badge>}
          </div>

          {event.description && (
            <p className="text-[12px] text-[#777] leading-relaxed line-clamp-2 mb-3">{event.description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap">
            {event.event_time && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#666]">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{event.event_time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#666]">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
