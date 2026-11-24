"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import NotificationCarousel from "@/components/organisms/NotificationCarousel";
import QuickActions from "@/components/organisms/QuickActions";
import type {
  NotificationAccent,
  NotificationItem,
  NotificationType,
} from "@/components/molecules/NotificationCard";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/client";
import { createClient } from "@/lib/supabase";
import type { Announcement } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Megaphone } from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState } from "react";

function mapAnnouncementToNotification(
  a: Announcement,
  index: number
): NotificationItem {
  const text = `${a.title} ${a.content}`.toLowerCase();

  let type: NotificationType = "announcement";
  let accent: NotificationAccent = "teal";
  let label = a.is_pinned ? "PINNED" : "NOTICE";

  if (text.includes("blood") || text.includes("রক্ত") || text.includes("donor")) {
    type = "blood";
    accent = "red";
    label = a.is_pinned ? "PINNED • BLOOD" : "BLOOD REQUEST";
  } else if (
    text.includes("event") ||
    text.includes("reunion") ||
    text.includes("gathering") ||
    text.includes("ইভেন্ট") ||
    text.includes("মিলনমেলা")
  ) {
    type = "event";
    accent = "blue";
    label = a.is_pinned ? "PINNED • EVENT" : "EVENT";
  } else if (
    text.includes("fund") ||
    text.includes("donation") ||
    text.includes("donate") ||
    text.includes("তহবিল") ||
    text.includes("অনুদান")
  ) {
    type = "fund";
    accent = "amber";
    label = a.is_pinned ? "PINNED • FUND" : "FUND";
  } else if (
    text.includes("memorial") ||
    text.includes("in memory") ||
    text.includes("demise") ||
    text.includes("মৃত্যু") ||
    text.includes("স্মরণ") ||
    text.includes("ইন্তেকাল")
  ) {
    type = "memorial";
    accent = "purple";
    label = a.is_pinned ? "PINNED • MEMORIAL" : "MEMORIAL";
  } else if (
    text.includes("welcome") ||
    text.includes("new member") ||
    (text.includes("alumni") && text.includes("joined")) ||
    text.includes("নতুন সদস্য")
  ) {
    type = "member";
    accent = "green";
    label = a.is_pinned ? "PINNED • MEMBER" : "NEW MEMBER";
  } else {
    const varietyPalette: NotificationAccent[] = [
      "teal",
      "blue",
      "purple",
      "amber",
      "green",
    ];
    accent = a.is_pinned ? "teal" : varietyPalette[index % varietyPalette.length];
    label = a.is_pinned ? "PINNED" : index === 0 ? "NEW" : "NOTICE";
  }

  // Summary: auto-generate by stripping the long body to a short one-liner (first ~80 chars)
  const cleanContent = a.content.replace(/\s+/g, " ").trim();
  let summary = cleanContent;
  if (cleanContent.length > 85) {
    summary = cleanContent.slice(0, 80).trim() + "…";
  }

  return {
    id: a.id,
    type,
    label,
    title: a.title,
    summary,
    date: formatDate(a.created_at),
    accent,
    rawContent: a.content,
    authorName: a.profiles?.full_name,
    isPinned: a.is_pinned,
  };
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { profile } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === "admin";

  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [saving, setSaving] = useState(false);

  // Pending profiles count for admin badge in greeting
  const { data: pendingCount } = useQuery({
    queryKey: ["admin-pending-count"],
    queryFn: async () => {
      if (!isAdmin) return 0;
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return count || 0;
    },
    enabled: !!isAdmin,
  });

  // Announcements query (used for notification cards)
  const { data: rawAnnouncements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*, profiles(full_name, avatar_url)")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      return (data || []) as Announcement[];
    },
  });

  // Map raw announcements to notifications
  const notificationItems = useMemo(() => {
    if (!rawAnnouncements) return [];
    return rawAnnouncements.map((announcement, index) =>
      mapAnnouncementToNotification(announcement, index)
    );
  }, [rawAnnouncements]);

  // Admin announcement handlers
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("announcements").insert([
      {
        title: announcementTitle,
        content: announcementContent,
        author_id: profile.id,
      },
    ]);
    if (error) {
      alert("Error: " + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setShowAnnouncementModal(false);
      setAnnouncementTitle("");
      setAnnouncementContent("");
    }
    setSaving(false);
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_pinned: !currentPinned })
      .eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
    }
  };

  // Time-based greeting (morning / afternoon / evening)
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("dashboard.goodMorning")
      : hour < 18
      ? t("dashboard.goodAfternoon")
      : t("dashboard.goodEvening");

  const displayName = profile?.full_name?.split(" ")[0] || "Member";

  return (
    <DashboardShell title={t("dashboard.title")}>
      <div className="space-y-8 max-w-7xl mx-auto pb-8">
        {/* 1. Greeting Header */}
        <header>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
                {greeting}, {displayName}
              </h1>
              <p className="text-sm text-[#9ca3af] mt-1">
                {t("dashboard.subtitle")}
              </p>
            </div>

            {isAdmin && pendingCount && pendingCount > 0 ? (
              <Link href="/admin/users">
                <Button variant="secondary" size="sm">
                  <Clock className="w-3.5 h-3.5 text-[#e5b869] mr-1.5" />
                  <span>
                    {pendingCount} pending approval{pendingCount > 1 ? "s" : ""}
                  </span>
                </Button>
              </Link>
            ) : null}
          </div>
        </header>

        {/* 2. Notification Cards Carousel */}
        <div>
          <NotificationCarousel
            items={notificationItems}
            isLoading={isLoadingAnnouncements}
            isAdmin={isAdmin}
            onNewAnnouncement={() => setShowAnnouncementModal(true)}
            onTogglePin={handleTogglePin}
            onDelete={handleDeleteAnnouncement}
          />
        </div>

        {/* 3. Quick Actions Section */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Admin Create Announcement Modal */}
      {isAdmin && (
        <Modal
          isOpen={showAnnouncementModal}
          onClose={() => setShowAnnouncementModal(false)}
          title={t("dashboard.createAnnouncement")}
        >
          <form onSubmit={handleCreateAnnouncement} className="space-y-4">
            <Input
              id="announcement-title"
              label="Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              required
              placeholder="Announcement title..."
            />
            <div className="space-y-1.5">
              <label
                htmlFor="announcement-content"
                className="block text-xs font-medium text-[#9ca3af]"
              >
                Content
              </label>
              <textarea
                id="announcement-content"
                rows={4}
                className="w-full rounded-lg bg-[#0e1015] border border-white/10 text-[#f3f4f6] placeholder-[#555d6e] px-3.5 py-2 text-sm focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c] hover:border-white/20 transition-colors"
                placeholder="Write your announcement or notice here..."
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowAnnouncementModal(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" isLoading={saving}>
                <Megaphone className="w-4 h-4 mr-1.5" />
                Publish Notice
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardShell>
  );
}
