"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import SearchBar from "@/components/molecules/SearchBar";
import Modal from "@/components/atoms/Modal";
import { createClient } from "@/lib/supabase";
import type { AlumniRosterEntry, Profile } from "@/lib/types";
import { updateUserStatus } from "./actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@/lib/hooks";
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX, Mail, Phone, GraduationCap, Briefcase, MapPin, Eye, Download, Star } from "lucide-react";
import { formatDate, sanitizeSearchQuery } from "@/lib/utils";
import Link from "next/link";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [achievement, setAchievement] = useState("");
  const [featuredSaving, setFeaturedSaving] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, batch, department, student_id, status, role, bio, profession, company, city, country, is_featured, achievement, rejection_reason, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (statusFilter !== "all") { query = query.eq("status", statusFilter); }
      const sanitizedSearch = sanitizeSearchQuery(debouncedSearch);
      if (sanitizedSearch) { query = query.or(`full_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%,batch.ilike.%${sanitizedSearch}%`); }
      const { data } = await query;
      return data as Profile[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-user-stats"],
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      return { pending: pending.count || 0, approved: approved.count || 0, rejected: rejected.count || 0, total: (pending.count || 0) + (approved.count || 0) + (rejected.count || 0) };
    },
  });

  const { data: rosterMatches } = useQuery({
    queryKey: ["admin-roster-matches", users?.map((user) => user.id).join(",")],
    enabled: Boolean(users?.length),
    queryFn: async () => {
      const pendingUsers = (users || []).filter((user) => user.status === "pending");
      if (pendingUsers.length === 0) return new Map<string, AlumniRosterEntry>();

      const emails = pendingUsers.map((user) => user.email?.trim().toLowerCase()).filter(Boolean);
      const phones = pendingUsers.map((user) => user.phone?.trim()).filter(Boolean);
      const clauses = [
        emails.length > 0 ? `email.in.(${emails.map((email) => `"${email}"`).join(",")})` : "",
        phones.length > 0 ? `phone.in.(${phones.map((phone) => `"${phone}"`).join(",")})` : "",
      ].filter(Boolean).join(",");

      if (!clauses) return new Map<string, AlumniRosterEntry>();

      const { data } = await supabase.from("alumni_roster").select("*").or(clauses);
      const rows = (data || []) as AlumniRosterEntry[];
      const matches = new Map<string, AlumniRosterEntry>();

      pendingUsers.forEach((user) => {
        const match = rows.find((row) =>
          (row.email && user.email && row.email.toLowerCase() === user.email.toLowerCase()) ||
          (row.phone && user.phone && row.phone === user.phone)
        );
        if (match) matches.set(user.id, match);
      });

      return matches;
    },
  });

  const updateStatus = async (userId: string, status: "approved" | "rejected") => {
    const rejectionReason = status === "rejected"
      ? window.prompt("Optional rejection reason. This will be emailed to the applicant.") || ""
      : "";

    setActionLoading(userId);
    try {
      await updateUserStatus(userId, status, rejectionReason);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-roster-matches"] });
      if (selectedUser?.id === userId) { setSelectedUser(null); }
    } catch (error) {
      alert("Error updating user: " + (error instanceof Error ? error.message : "Unknown error"));
    }
    setActionLoading(null);
  };

  const openUser = (user: Profile) => {
    setSelectedUser(user);
    setAchievement(user.achievement || "");
  };

  const saveFeatured = async () => {
    if (!selectedUser) return;
    setFeaturedSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_featured: !selectedUser.is_featured, achievement: achievement.trim() })
      .eq("id", selectedUser.id);

    if (error) {
      alert("Error updating featured status: " + error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      await queryClient.invalidateQueries({ queryKey: ["featured-alumni"] });
      setSelectedUser({ ...selectedUser, is_featured: !selectedUser.is_featured, achievement: achievement.trim() });
    }
    setFeaturedSaving(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return <Badge variant="success">Approved</Badge>;
      case "rejected": return <Badge variant="danger">Rejected</Badge>;
      case "pending": return <Badge variant="warning">Pending</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const statCards = [
    { label: "Total Users", value: stats?.total || 0, icon: Users, color: "text-[#FF6363]", bg: "bg-[rgba(255,99,99,0.08)]" },
    { label: "Pending", value: stats?.pending || 0, icon: Clock, color: "text-[#FBBF24]", bg: "bg-[rgba(251,191,36,0.08)]" },
    { label: "Approved", value: stats?.approved || 0, icon: UserCheck, color: "text-[#34D399]", bg: "bg-[rgba(52,211,153,0.08)]" },
    { label: "Rejected", value: stats?.rejected || 0, icon: UserX, color: "text-[#EF4444]", bg: "bg-[rgba(239,68,68,0.08)]" },
  ];

  const filterButtons: { label: string; value: StatusFilter; count?: number }[] = [
    { label: "Pending", value: "pending", count: stats?.pending },
    { label: "Approved", value: "approved", count: stats?.approved },
    { label: "Rejected", value: "rejected", count: stats?.rejected },
    { label: "All", value: "all", count: stats?.total },
  ];

  return (
    <DashboardShell title="User Management">
      <div className="space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">User Management</h2>
              <p className="text-[#777] text-[14px]">Approve, reject, and manage alumni accounts</p>
            </div>
            <Link href="/admin/users/export" target="_blank">
              <Button variant="secondary"><Download className="w-4 h-4" />Export CSV</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 slide-up stagger-2">
          {statCards.map((stat) => (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${stat.bg}`}><stat.icon className={`w-5 h-5 ${stat.color}`} /></div>
                <div className="min-w-0"><p className="text-2xl font-bold text-[#fafafa]">{stat.value}</p><p className="text-[11px] text-[#666] truncate">{stat.label}</p></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 slide-up stagger-3">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {filterButtons.map((btn) => (
              <button key={btn.value} onClick={() => setStatusFilter(btn.value)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all duration-200 ${statusFilter === btn.value ? "bg-[rgba(255,99,99,0.1)] text-[#FF6363] border border-[rgba(255,99,99,0.2)]" : "bg-[rgba(255,255,255,0.03)] text-[#777] border border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[#a0a0a0]"}`}>
                {btn.label}
                {btn.count !== undefined && (<span className={`text-[11px] px-1.5 py-0.5 rounded-md ${statusFilter === btn.value ? "bg-[rgba(255,99,99,0.15)]" : "bg-[rgba(255,255,255,0.06)]"}`}>{btn.count}</span>)}
              </button>
            ))}
          </div>
          <div className="sm:ml-auto w-full sm:w-64"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search users..." /></div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-2 border-[#FF6363] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3 slide-up stagger-4">
            {users?.map((user) => (
              <Card key={user.id} className="p-4 sm:p-5 hover:border-[rgba(255,255,255,0.12)] transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar src={user.avatar_url} name={user.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[13px] font-semibold text-[#fafafa] truncate">{user.full_name}</h3>
                        {getStatusBadge(user.status)}
                        {user.role === "admin" && <Badge variant="info">Admin</Badge>}
                        {user.is_featured && <Badge variant="warning"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                        {rosterMatches?.has(user.id) && <Badge variant="success">Roster match</Badge>}
                      </div>
                      <p className="text-[11px] text-[#666] truncate mt-0.5">{user.email}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {user.batch && (<span className="text-[11px] text-[#555] flex items-center gap-1"><GraduationCap className="w-3 h-3" />Batch {user.batch}</span>)}
                        {user.department && (<span className="text-[11px] text-[#555]">{user.department}</span>)}
                        <span className="text-[11px] text-[#444]">{formatDate(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openUser(user)}><Eye className="w-4 h-4" /><span className="sm:hidden lg:inline">View</span></Button>
                    {user.status !== "approved" && (<Button variant="primary" size="sm" isLoading={actionLoading === user.id} onClick={() => updateStatus(user.id, "approved")}><CheckCircle className="w-4 h-4" /><span className="sm:hidden lg:inline">Approve</span></Button>)}
                    {user.status !== "rejected" && (<Button variant="danger" size="sm" isLoading={actionLoading === user.id} onClick={() => updateStatus(user.id, "rejected")}><XCircle className="w-4 h-4" /><span className="sm:hidden lg:inline">Reject</span></Button>)}
                  </div>
                </div>
              </Card>
            ))}
            {users?.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-[#444]" /></div>
                <p className="text-[#666] text-[13px]">No {statusFilter !== "all" ? statusFilter : ""} users found</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details" size="lg">
        {selectedUser && (
          <div className="space-y-6">
            {rosterMatches?.get(selectedUser.id) && (
              <div className="rounded-xl bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.16)] p-4">
                <p className="text-[13px] font-semibold text-[#34D399] mb-1">Roster match found</p>
                <p className="text-[12px] text-[#a0a0a0]">
                  {rosterMatches.get(selectedUser.id)?.full_name} · Batch {rosterMatches.get(selectedUser.id)?.batch}
                  {rosterMatches.get(selectedUser.id)?.department && ` · ${rosterMatches.get(selectedUser.id)?.department}`}
                </p>
              </div>
            )}
            <div className="flex items-start gap-4">
              <Avatar src={selectedUser.avatar_url} name={selectedUser.full_name} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1"><h3 className="text-[18px] font-bold text-[#fafafa]">{selectedUser.full_name}</h3>{getStatusBadge(selectedUser.status)}</div>
                <p className="text-[#777] text-[13px]">{selectedUser.email}</p>
                {selectedUser.bio && (<p className="mt-2 text-[#a0a0a0] text-[13px] leading-relaxed">{selectedUser.bio}</p>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Contact</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Mail className="w-4 h-4 text-[#555]" /><span className="truncate">{selectedUser.email}</span></div>
                  {selectedUser.phone && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Phone className="w-4 h-4 text-[#555]" />{selectedUser.phone}</div>)}
                  {(selectedUser.city || selectedUser.country) && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><MapPin className="w-4 h-4 text-[#555]" />{[selectedUser.city, selectedUser.country].filter(Boolean).join(", ")}</div>)}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Academic</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><GraduationCap className="w-4 h-4 text-[#555]" />Batch {selectedUser.batch || "N/A"}</div>
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Briefcase className="w-4 h-4 text-[#555]" />{selectedUser.department || "N/A"}</div>
                  {selectedUser.student_id && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><span className="text-[#555] text-[11px]">ID:</span>{selectedUser.student_id}</div>)}
                </div>
              </div>
            </div>
            {(selectedUser.profession || selectedUser.company) && (
              <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Professional</h4>
                <p className="text-[13px] text-[#a0a0a0]">{selectedUser.profession}{selectedUser.company && ` at ${selectedUser.company}`}</p>
              </div>
            )}
            <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Featured Alumni</h4>
                {selectedUser.is_featured && <Badge variant="warning"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
              </div>
              <div className="space-y-2">
                <label htmlFor="achievement" className="block text-[13px] font-medium text-[#a0a0a0]">Achievement</label>
                <textarea id="achievement" rows={3} value={achievement} onChange={(event) => setAchievement(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]" placeholder="Notable achievement to show on dashboard..." />
              </div>
              <Button variant="secondary" isLoading={featuredSaving} onClick={saveFeatured}>
                <Star className="w-4 h-4" />
                {selectedUser.is_featured ? "Remove Featured" : "Mark Featured"}
              </Button>
            </div>
            {selectedUser.status === "rejected" && selectedUser.rejection_reason && (
              <div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Rejection Reason</h4>
                <p className="text-[13px] text-[#a0a0a0]">{selectedUser.rejection_reason}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              {selectedUser.status !== "approved" && (<Button className="flex-1" isLoading={actionLoading === selectedUser.id} onClick={() => updateStatus(selectedUser.id, "approved")}><CheckCircle className="w-4 h-4" />Approve User</Button>)}
              {selectedUser.status !== "rejected" && (<Button variant="danger" className="flex-1" isLoading={actionLoading === selectedUser.id} onClick={() => updateStatus(selectedUser.id, "rejected")}><XCircle className="w-4 h-4" />Reject User</Button>)}
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
