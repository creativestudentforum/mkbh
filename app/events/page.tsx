"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Badge from "@/components/atoms/Badge";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/client";
import { useQuery } from "@tanstack/react-query";
import type { Event, EventRsvp, EventRsvpCounts } from "@/lib/types";
import RsvpButton from "./rsvp-button";
import { CalendarDays, MapPin, Clock } from "lucide-react";

export default function EventsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const supabase = createClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, profiles(full_name, avatar_url)")
        .eq("is_active", true)
        .order("event_date", { ascending: true });
      const events = (data || []) as Event[];
      const eventIds = events.map((event) => event.id);

      if (eventIds.length === 0 || !user) return events;

      const [countsResponse, rsvpResponse] = await Promise.all([
        supabase.from("event_rsvp_counts").select("*").in("event_id", eventIds),
        supabase.from("event_rsvps").select("*").in("event_id", eventIds).eq("user_id", user.id),
      ]);
      const counts = (countsResponse.data || []) as EventRsvpCounts[];
      const rsvps = (rsvpResponse.data || []) as EventRsvp[];

      return events.map((event) => ({
        ...event,
        event_rsvp_counts: counts.find((count) => count.event_id === event.id) || null,
        event_rsvps: rsvps.filter((item) => item.event_id === event.id),
      }));
    },
  });

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingEvents = events?.filter(
    (e) => new Date(e.event_date) >= now
  ) || [];

  const pastEvents = events?.filter(
    (e) => new Date(e.event_date) < now
  ) || [];

  return (
    <DashboardShell title={t("events.title")}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight mb-1">
            {t("events.title")}
          </h2>
          <p className="text-sm text-[#9ca3af]">{t("events.subtitle")}</p>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#34d399]" />
            <h3 className="font-serif text-lg font-semibold text-[#f3f4f6]">
              {t("events.upcoming")}
            </h3>
          </div>

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
              <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-[#9ca3af]">
                <CalendarDays className="w-6 h-6" />
              </div>
              <p className="text-sm text-[#9ca3af]">{t("events.noUpcoming")}</p>
            </Card>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <h3 className="font-serif text-lg font-semibold text-[#9ca3af]">
              {t("events.past")}
            </h3>
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
    <Card className={`p-0 overflow-hidden ${!isUpcoming ? "opacity-60" : ""}`} hover={isUpcoming}>
      <div className="flex">
        {/* Date column */}
        <div
          className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-5 ${
            isUpcoming
              ? "bg-[#1a634b]/15 border-r border-[#22785c]/30 text-[#34d399]"
              : "bg-white/[0.02] border-r border-white/[0.06] text-[#6b7280]"
          }`}
        >
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase">
            {month}
          </span>
          <span className="font-serif text-2xl font-bold leading-none mt-1 text-[#f3f4f6]">
            {day}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h4 className="font-serif text-base font-semibold text-[#f3f4f6] leading-tight truncate">
              {event.title}
            </h4>
            {isUpcoming && <Badge variant="success">Upcoming</Badge>}
          </div>

          {event.description && (
            <p className="text-xs text-[#9ca3af] leading-relaxed line-clamp-2 mb-3">
              {event.description}
            </p>
          )}

          <div className="flex items-center gap-3.5 flex-wrap text-xs text-[#9ca3af]">
            {event.event_time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#6b7280]" />
                <span>{event.event_time}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#6b7280]" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>

          {isUpcoming && (
            <RsvpButton
              eventId={event.id}
              counts={Array.isArray(event.event_rsvp_counts) ? event.event_rsvp_counts[0] : event.event_rsvp_counts}
              currentRsvp={event.event_rsvps?.[0] || null}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
