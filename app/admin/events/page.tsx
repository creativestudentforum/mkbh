"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Modal from "@/components/atoms/Modal";
import Input from "@/components/atoms/Input";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/lib/types";
import {
  CalendarDays, MapPin, Clock, Plus, Trash2,
  Edit3, ToggleLeft, ToggleRight, Sparkles,
} from "lucide-react";
import { useState } from "react";

export default function AdminEventsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("*, profiles(full_name, avatar_url)")
        .order("event_date", { ascending: false });
      return data as Event[];
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setEditingEvent(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (event: Event) => {
    setEditingEvent(event);
    setTitle(event.title);
    setDescription(event.description || "");
    setEventDate(event.event_date || "");
    setEventTime(event.event_time || "");
    setLocation(event.location || "");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);

    const payload = {
      title,
      description,
      event_date: eventDate,
      event_time: eventTime,
      location,
    };

    if (editingEvent) {
      const { error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", editingEvent.id);
      if (error) {
        alert("Error: " + error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-events"] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        setShowModal(false);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("events")
        .insert([{ ...payload, created_by: profile.id }]);
      if (error) {
        alert("Error: " + error.message);
      } else {
        queryClient.invalidateQueries({ queryKey: ["admin-events"] });
        queryClient.invalidateQueries({ queryKey: ["events"] });
        setShowModal(false);
        resetForm();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  };

  const handleToggleActive = async (event: Event) => {
    const { error } = await supabase
      .from("events")
      .update({ is_active: !event.is_active })
      .eq("id", event.id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["admin-events"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    }
  };

  return (
    <DashboardShell title="Manage Events">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Manage Events</h2>
              <Sparkles className="w-5 h-5 text-[#FBBF24]" />
            </div>
            <p className="text-[#777] text-[14px]">Create and manage alumni events</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Create Event
          </Button>
        </div>

        {/* Events list */}
        <div className="space-y-3 slide-up stagger-2">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-28 rounded-xl" />
              ))}
            </div>
          ) : events && events.length > 0 ? (
            events.map((event) => {
              const eventDate = new Date(event.event_date);
              const isPast = eventDate < new Date();

              return (
                <Card key={event.id} className={`p-0 overflow-hidden ${!event.is_active ? "opacity-50" : ""}`}>
                  <div className="flex">
                    {/* Date column */}
                    <div className={`w-20 flex-shrink-0 flex flex-col items-center justify-center py-5 ${isPast ? "bg-[rgba(255,255,255,0.02)]" : "bg-[rgba(255,99,99,0.06)]"}`}>
                      <span className={`text-[10px] font-bold tracking-wider uppercase ${isPast ? "text-[#555]" : "text-[#FF6363]"}`}>
                        {eventDate.toLocaleString("default", { month: "short" }).toUpperCase()}
                      </span>
                      <span className={`text-[28px] font-bold leading-none mt-1 ${isPast ? "text-[#666]" : "text-[#fafafa]"}`}>
                        {eventDate.getDate()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="text-[14px] font-semibold text-[#fafafa] truncate">{event.title}</h4>
                            {!event.is_active && <Badge variant="warning">Hidden</Badge>}
                            {isPast && event.is_active && <Badge variant="default">Past</Badge>}
                            {!isPast && event.is_active && <Badge variant="success">Active</Badge>}
                          </div>
                          {event.description && (
                            <p className="text-[12px] text-[#777] line-clamp-1 mb-2">{event.description}</p>
                          )}
                          <div className="flex items-center gap-4 flex-wrap">
                            {event.event_time && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#666]">
                                <Clock className="w-3 h-3" />
                                <span>{event.event_time}</span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center gap-1.5 text-[11px] text-[#666]">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            <span className="text-[11px] text-[#444]">Created {formatDate(event.created_at)}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleToggleActive(event)}
                            className="p-1.5 rounded-lg transition-colors text-[#555] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#a0a0a0]"
                            title={event.is_active ? "Hide event" : "Show event"}
                          >
                            {event.is_active ? <ToggleRight className="w-4 h-4 text-[#34D399]" /> : <ToggleLeft className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEditModal(event)}
                            className="p-1.5 rounded-lg text-[#555] hover:text-[#FF6363] hover:bg-[rgba(255,99,99,0.06)] transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-1.5 rounded-lg text-[#555] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                <CalendarDays className="w-7 h-7 text-[#444]" />
              </div>
              <p className="text-[13px] text-[#555] mb-3">No events created yet</p>
              <Button variant="ghost" size="sm" onClick={openCreateModal}>
                <Plus className="w-4 h-4" />
                Create First Event
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingEvent ? "Edit Event" : "Create Event"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="event-title"
            label="Event Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="Annual Alumni Reunion"
          />

          <div className="space-y-2">
            <label htmlFor="event-description" className="block text-[13px] font-medium text-[#a0a0a0]">
              Description
            </label>
            <textarea
              id="event-description"
              rows={3}
              className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]"
              placeholder="Describe the event..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="event-date"
              label="Event Date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
            <Input
              id="event-time"
              label="Event Time"
              type="text"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              placeholder="6:00 PM"
            />
          </div>

          <Input
            id="event-location"
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="College Auditorium"
            icon={<MapPin className="w-4 h-4" />}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <CalendarDays className="w-4 h-4" />
              {editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
