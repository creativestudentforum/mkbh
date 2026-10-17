"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Batch, BatchStats, Profile } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Edit3, ImageIcon, Plus, Save, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type BatchRow = Batch & BatchStats;

export default function AdminBatchesPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRow | null>(null);
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [groupPhotoUrl, setGroupPhotoUrl] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-batches"],
    queryFn: async () => {
      const [batchesResponse, statsResponse, alumniResponse] = await Promise.all([
        supabase.from("batches").select("*").order("year", { ascending: false }),
        supabase.from("batch_stats").select("*"),
        supabase
          .from("profiles")
          .select("id, full_name, batch, avatar_url, email, role, user_type, status, department, created_at, updated_at")
          .eq("status", "approved")
          .eq("user_type", "alumni")
          .order("full_name")
          .limit(300),
      ]);

      if (batchesResponse.error) throw new Error(batchesResponse.error.message);
      if (statsResponse.error) throw new Error(statsResponse.error.message);
      if (alumniResponse.error) throw new Error(alumniResponse.error.message);

      const stats = new Map(((statsResponse.data || []) as BatchStats[]).map((item) => [item.year, item.members]));
      const batches = ((batchesResponse.data || []) as Batch[]).map((batch) => ({
        ...batch,
        members: stats.get(batch.year) || 0,
      }));

      return {
        batches,
        alumni: (alumniResponse.data || []) as Profile[],
      };
    },
  });

  const openCreate = () => {
    setEditingBatch(null);
    setYear("");
    setDescription("");
    setGroupPhotoUrl("");
    setCoordinatorId("");
    setShowModal(true);
  };

  const openEdit = (batch: BatchRow) => {
    setEditingBatch(batch);
    setYear(batch.year);
    setDescription(batch.description || "");
    setGroupPhotoUrl(batch.group_photo_url || "");
    setCoordinatorId(batch.coordinator_id || "");
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedYear = year.trim();
    if (!normalizedYear) return;

    setSaving(true);
    const payload = {
      year: normalizedYear,
      description: description.trim(),
      group_photo_url: groupPhotoUrl.trim() || null,
      coordinator_id: coordinatorId || null,
    };

    const { error } = editingBatch
      ? await supabase.from("batches").update(payload).eq("year", editingBatch.year)
      : await supabase.from("batches").insert([payload]);

    if (error) {
      alert("Error saving batch: " + error.message);
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-batches"] }),
        queryClient.invalidateQueries({ queryKey: ["batches"] }),
      ]);
      setShowModal(false);
    }
    setSaving(false);
  };

  const batches = data?.batches || [];
  const alumni = data?.alumni || [];

  return (
    <DashboardShell title="Manage Batches">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Manage Batches</h2>
              <CalendarRange className="w-5 h-5 text-[#FF6363]" />
            </div>
            <p className="text-[#777] text-[14px]">Set coordinators, descriptions, and group photo URLs.</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Batch</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-24 rounded-xl" />)}
          </div>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 slide-up stagger-2">
            {batches.map((batch) => {
              const coordinator = alumni.find((member) => member.id === batch.coordinator_id);
              return (
                <Card key={batch.year} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[20px] font-bold text-[#fafafa]">Batch {batch.year}</h3>
                        <Badge variant={batch.members > 0 ? "info" : "default"}>{batch.members} member{batch.members === 1 ? "" : "s"}</Badge>
                      </div>
                      <p className="text-[12px] text-[#777] line-clamp-2">{batch.description || "No description added."}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(batch)}><Edit3 className="w-4 h-4" />Edit</Button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.06)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-[#777]">
                    <div className="flex items-center gap-2"><Users className="w-4 h-4 text-[#555]" />{coordinator?.full_name || "No coordinator"}</div>
                    <div className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-[#555]" />{batch.group_photo_url ? "Photo URL set" : "No photo URL"}</div>
                  </div>

                  <Link href={`/batches/${encodeURIComponent(batch.year)}`} className="inline-flex mt-4 text-[12px] text-[#FF6363] hover:text-[#FF4F4F] transition-colors">
                    View batch page
                  </Link>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-[13px] text-[#666] mb-4">No batches found.</p>
            <Button onClick={openCreate}><Plus className="w-4 h-4" />Add First Batch</Button>
          </Card>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingBatch ? "Edit Batch" : "Add Batch"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Batch Year" value={year} onChange={(event) => setYear(event.target.value)} required disabled={!!editingBatch} placeholder="2012" />

          <div className="space-y-2">
            <label htmlFor="coordinator" className="block text-[13px] font-medium text-[#a0a0a0]">Coordinator</label>
            <select id="coordinator" value={coordinatorId} onChange={(event) => setCoordinatorId(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all hover:border-[rgba(255,255,255,0.14)]">
              <option value="">No coordinator</option>
              {alumni.map((member) => <option key={member.id} value={member.id}>{member.full_name} {member.batch ? `(${member.batch})` : ""}</option>)}
            </select>
          </div>

          <Input label="Group Photo URL" type="url" value={groupPhotoUrl} onChange={(event) => setGroupPhotoUrl(event.target.value)} placeholder="https://..." />

          <div className="space-y-2">
            <label htmlFor="description" className="block text-[13px] font-medium text-[#a0a0a0]">Description</label>
            <textarea id="description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" placeholder="Short note about this batch..." />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={saving}><Save className="w-4 h-4" />Save Batch</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
