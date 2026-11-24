"use client";

import Button from "@/components/atoms/Button";
import { rsvp } from "@/app/events/actions";
import type { EventRsvp, EventRsvpCounts, RsvpStatus } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
  { status: "going", label: "Going" },
  { status: "maybe", label: "Maybe" },
  { status: "not_going", label: "Can't go" },
];

export default function RsvpButton({
  eventId,
  counts,
  currentRsvp,
}: {
  eventId: string;
  counts?: EventRsvpCounts | null;
  currentRsvp?: EventRsvp | null;
}) {
  const queryClient = useQueryClient();
  const [guests, setGuests] = useState(currentRsvp?.guests || 0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const going = counts?.going || 0;
  const guestCount = counts?.guests || 0;

  const submitRsvp = (status: RsvpStatus) => {
    setError(null);
    startTransition(async () => {
      try {
        await rsvp(eventId, status, guests);
        await queryClient.invalidateQueries({ queryKey: ["events"] });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save RSVP");
      }
    });
  };

  return (
    <div className="mt-4 space-y-3 border-t border-[rgba(255,255,255,0.06)] pt-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[11px] text-[#777]">
          <span className="text-[#fafafa] font-semibold">{going}</span> going
          {guestCount > 0 && <span> + {guestCount} guest{guestCount > 1 ? "s" : ""}</span>}
        </p>
        <label className="flex items-center gap-2 text-[11px] text-[#777]">
          Guests
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="bg-[#0e1015] border border-white/10 rounded-md text-[#f3f4f6] px-2 py-0.5 text-xs focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c]"
            disabled={isPending}
          >
            {[0, 1, 2, 3, 4, 5].map((count) => <option key={count} value={count}>{count}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {RSVP_OPTIONS.map((option) => {
          const active = currentRsvp?.status === option.status;
          return (
            <Button
              key={option.status}
              type="button"
              size="sm"
              variant={active ? "primary" : "secondary"}
              isLoading={isPending && active}
              disabled={isPending}
              onClick={() => submitRsvp(option.status)}
              className="px-2"
            >
              {option.label}
            </Button>
          );
        })}
      </div>
      {error && <p className="text-[11px] text-[#EF4444]">{error}</p>}
    </div>
  );
}
