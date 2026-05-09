"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import SearchBar from "@/components/molecules/SearchBar";
import Modal from "@/components/atoms/Modal";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle, XCircle, Clock, Users, UserCheck, UserX, Mail, Phone, GraduationCap, Briefcase, MapPin, Filter, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", searchQuery, statusFilter],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (statusFilter !== "all") { query = query.eq("status", statusFilter); }
      if (searchQuery) { query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,batch.ilike.%${searchQuery}%`); }
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

  const updateStatus = async (userId: string, status: "approved" | "rejected") => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ status }).eq("id", userId);
    if (error) { alert("Error updating user: " + error.message); }
    else { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); queryClient.invalidateQueries({ queryKey: ["admin-user-stats"] }); if (selectedUser?.id === userId) { setSelectedUser(null); } }
    setActionLoading(null);
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
          <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">User Management</h2>
          <p className="text-[#777] text-[14px]">Approve, reject, and manage alumni accounts</p>
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
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}><Eye className="w-4 h-4" /><span className="sm:hidden lg:inline">View</span></Button>
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
                  {selectedUser.location && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><MapPin className="w-4 h-4 text-[#555]" />{selectedUser.location}</div>)}
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
            {(selectedUser.job_title || selectedUser.current_company) && (
              <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Professional</h4>
                <p className="text-[13px] text-[#a0a0a0]">{selectedUser.job_title}{selectedUser.current_company && ` at ${selectedUser.current_company}`}</p>
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
