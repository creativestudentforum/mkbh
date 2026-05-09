"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import StatsCard from "@/components/molecules/StatsCard";
import Card from "@/components/atoms/Card";
import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import Input from "@/components/atoms/Input";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDate } from "@/lib/utils";
import {
  Users, GraduationCap, Building2, MapPin, Megaphone, Pin,
  Plus, Trash2, Clock, ArrowRight, Sparkles, CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Announcement } from "@/lib/types";

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === "admin";
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const [alumniCount, teacherCount, pendingCount] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("teachers").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return { alumni: alumniCount.count || 0, teachers: teacherCount.count || 0, pending: pendingCount.count || 0 };
    },
  });

  const { data: recentAlumni } = useQuery({
    queryKey: ["recent-alumni"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(6);
      return data;
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => {
      const { data } = await supabase.from("announcements").select("*, profiles(full_name, avatar_url)").order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(5);
      return data as Announcement[];
    },
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("announcements").insert([{ title: announcementTitle, content: announcementContent, author_id: profile.id }]);
    if (error) { alert("Error: " + error.message); } else {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      setShowAnnouncementModal(false); setAnnouncementTitle(""); setAnnouncementContent("");
    }
    setSaving(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (!error) { queryClient.invalidateQueries({ queryKey: ["announcements"] }); }
  };

  const handleTogglePin = async (announcement: Announcement) => {
    const { error } = await supabase.from("announcements").update({ is_pinned: !announcement.is_pinned }).eq("id", announcement.id);
    if (!error) { queryClient.invalidateQueries({ queryKey: ["announcements"] }); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">{greeting}, {profile?.full_name?.split(" ")[0]}!</h2>
                <Sparkles className="w-5 h-5 text-[#FBBF24]" />
              </div>
              <p className="text-[#777] text-[14px]">Here&apos;s what&apos;s happening in your alumni network today.</p>
            </div>
            {isAdmin && stats?.pending && stats.pending > 0 ? (
              <Link href="/admin/users"><Button variant="secondary" size="sm"><Clock className="w-4 h-4 text-[#FBBF24]" />{stats.pending} pending approval{stats.pending > 1 ? "s" : ""}</Button></Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 slide-up stagger-2">
          <StatsCard title="Total Alumni" value={stats?.alumni || 0} icon={Users} color="indigo" />
          <StatsCard title="Faculty Members" value={stats?.teachers || 0} icon={GraduationCap} color="emerald" />
          <StatsCard title="Departments" value="8+" icon={Building2} color="amber" />
          <StatsCard title="Batches" value="15+" icon={MapPin} color="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 slide-up stagger-3">
          <Card className="lg:col-span-2 p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Megaphone className="w-[18px] h-[18px] text-[#FF6363]" />
                <h3 className="text-[15px] font-semibold text-[#fafafa]">Announcements</h3>
              </div>
              {isAdmin && (<Button variant="ghost" size="sm" onClick={() => setShowAnnouncementModal(true)}><Plus className="w-4 h-4" />New</Button>)}
            </div>
            {announcements && announcements.length > 0 ? (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.08)] transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="text-[13px] font-semibold text-[#fafafa]">{a.title}</h4>
                          {a.is_pinned && (<Badge variant="info"><Pin className="w-3 h-3 mr-1" />Pinned</Badge>)}
                        </div>
                        <p className="text-[13px] text-[#888] leading-relaxed line-clamp-2">{a.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {a.profiles && (<span className="text-[11px] text-[#666]">By {a.profiles.full_name}</span>)}
                          <span className="text-[11px] text-[#444]">•</span>
                          <span className="text-[11px] text-[#666]">{formatDate(a.created_at)}</span>
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => handleTogglePin(a)} className={`p-1.5 rounded-lg transition-colors ${a.is_pinned ? "text-[#FF6363] hover:bg-[rgba(255,99,99,0.08)]" : "text-[#555] hover:bg-[rgba(255,255,255,0.04)]"}`} title={a.is_pinned ? "Unpin" : "Pin"}><Pin className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteAnnouncement(a.id)} className="p-1.5 rounded-lg text-[#555] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#555]">
                <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3"><Megaphone className="w-7 h-7 text-[#444]" /></div>
                <p className="text-[13px] mb-3">No announcements yet</p>
                {isAdmin && (<Button variant="ghost" size="sm" onClick={() => setShowAnnouncementModal(true)}><Plus className="w-4 h-4" />Create First Announcement</Button>)}
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-semibold text-[#fafafa]">New Members</h3>
              <Link href="/directory" className="text-[11px] text-[#FF6363] hover:text-[#FF4F4F] flex items-center gap-1 transition-colors font-medium">View all <ArrowRight className="w-3 h-3" /></Link>
            </div>
            <div className="space-y-1">
              {recentAlumni?.map((al) => (
                <div key={al.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors -mx-1">
                  <Avatar src={al.avatar_url} name={al.full_name} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#e5e5e5] truncate">{al.full_name}</p>
                    <p className="text-[11px] text-[#666] truncate">{al.job_title || "Alumni"}{al.current_company && ` @ ${al.current_company}`}</p>
                  </div>
                  {al.batch && (<span className="text-[10px] text-[#555] bg-[rgba(255,255,255,0.04)] px-2 py-0.5 rounded-md flex-shrink-0 font-medium">{al.batch}</span>)}
                </div>
              ))}
              {!recentAlumni?.length && (<p className="text-[13px] text-[#555] text-center py-4">No alumni yet</p>)}
            </div>
          </Card>
        </div>

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 slide-up stagger-4">
            <Link href="/admin/users"><Card hover className="p-5 flex items-center gap-4 group"><div className="p-2.5 rounded-lg bg-[rgba(251,191,36,0.08)] group-hover:bg-[rgba(251,191,36,0.12)] transition-colors"><Users className="w-5 h-5 text-[#FBBF24]" /></div><div><h4 className="text-[13px] font-semibold text-[#fafafa]">Manage Users</h4><p className="text-[11px] text-[#666]">Approve & manage accounts</p></div><ArrowRight className="w-4 h-4 text-[#333] ml-auto group-hover:text-[#777] transition-colors" /></Card></Link>
            <Link href="/admin/teachers"><Card hover className="p-5 flex items-center gap-4 group"><div className="p-2.5 rounded-lg bg-[rgba(52,211,153,0.08)] group-hover:bg-[rgba(52,211,153,0.12)] transition-colors"><GraduationCap className="w-5 h-5 text-[#34D399]" /></div><div><h4 className="text-[13px] font-semibold text-[#fafafa]">Manage Teachers</h4><p className="text-[11px] text-[#666]">Add & edit faculty</p></div><ArrowRight className="w-4 h-4 text-[#333] ml-auto group-hover:text-[#777] transition-colors" /></Card></Link>
            <Link href="/directory"><Card hover className="p-5 flex items-center gap-4 group"><div className="p-2.5 rounded-lg bg-[rgba(255,99,99,0.08)] group-hover:bg-[rgba(255,99,99,0.12)] transition-colors"><Building2 className="w-5 h-5 text-[#FF6363]" /></div><div><h4 className="text-[13px] font-semibold text-[#fafafa]">Alumni Directory</h4><p className="text-[11px] text-[#666]">Browse all alumni</p></div><ArrowRight className="w-4 h-4 text-[#333] ml-auto group-hover:text-[#777] transition-colors" /></Card></Link>
            <Link href="/admin/events"><Card hover className="p-5 flex items-center gap-4 group"><div className="p-2.5 rounded-lg bg-[rgba(139,92,246,0.08)] group-hover:bg-[rgba(139,92,246,0.12)] transition-colors"><CalendarDays className="w-5 h-5 text-[#8B5CF6]" /></div><div><h4 className="text-[13px] font-semibold text-[#fafafa]">Manage Events</h4><p className="text-[11px] text-[#666]">Create & manage events</p></div><ArrowRight className="w-4 h-4 text-[#333] ml-auto group-hover:text-[#777] transition-colors" /></Card></Link>
          </div>
        )}
      </div>

      <Modal isOpen={showAnnouncementModal} onClose={() => setShowAnnouncementModal(false)} title="Create Announcement">
        <form onSubmit={handleCreateAnnouncement} className="space-y-4">
          <Input id="announcement-title" label="Title" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} required placeholder="Announcement title..." />
          <div className="space-y-2">
            <label htmlFor="announcement-content" className="block text-[13px] font-medium text-[#a0a0a0]">Content</label>
            <textarea id="announcement-content" rows={4} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" placeholder="Write your announcement here..." value={announcementContent} onChange={(e) => setAnnouncementContent(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}><Megaphone className="w-4 h-4" />Publish</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
