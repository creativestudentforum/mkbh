"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { RsvpStatus } from "@/lib/types";
import { revalidatePath } from "next/cache";

const RSVP_STATUSES: RsvpStatus[] = ["going", "maybe", "not_going"];

export async function rsvp(eventId: string, status: RsvpStatus, guests: number) {
  if (!RSVP_STATUSES.includes(status)) {
    throw new Error("Invalid RSVP status");
  }

  const normalizedGuests = Number.isFinite(guests) ? Math.min(Math.max(guests, 0), 5) : 0;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabase.from("event_rsvps").upsert(
    {
      event_id: eventId,
      user_id: user.id,
      status,
      guests: status === "going" ? normalizedGuests : 0,
    },
    { onConflict: "event_id,user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/events");
  revalidatePath(`/admin/events/${eventId}/rsvps`);
}
