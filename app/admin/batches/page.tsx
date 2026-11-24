"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Batch, BatchStats, Profile } from "@/lib/types";
import { uploadImage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange,
  Camera,
  Check,
  Edit3,
  ImageIcon,
  Plus,
  Save,
  Search,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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
  const [coordinatorSearch, setCoordinatorSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

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
          .order("full_name")
          .limit(1000),
      ]);

      if (batchesResponse.error) throw new Error(batchesResponse.error.message);
      if (statsResponse.error) throw new Error(statsResponse.error.message);
      if (alumniResponse.error) throw new Error(alumniResponse.error.message);

      const statsMap = new Map<string, { members: number; photos: number }>();
      ((statsResponse.data || []) as BatchStats[]).forEach((item) => {
        statsMap.set(item.year, {
          members: item.members || 0,
          photos: item.photos || 0,
        });
      });

      const batches = ((batchesResponse.data || []) as Batch[]).map((batch) => {
        const stat = statsMap.get(batch.year);
        return {
          ...batch,
          members: stat?.members || 0,
          photos: stat?.photos || 0,
        };
      });

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
    setCoordinatorSearch("");
    setShowModal(true);
  };

  const openEdit = (batch: BatchRow) => {
    setEditingBatch(batch);
    setYear(batch.year);
    setDescription(batch.description || "");
    setGroupPhotoUrl(batch.group_photo_url || "");
    setCoordinatorId(batch.coordinator_id || "");
    setCoordinatorSearch("");
    setShowModal(true);
  };

  const handleGroupPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const targetYear = year.trim() || editingBatch?.year || "batch-covers";
      const uploadedUrl = await uploadImage(file, {
        folder: `alumni-hub/batches/${targetYear}`,
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
      });
      setGroupPhotoUrl(uploadedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      alert("Cover upload error: " + msg);
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
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
        queryClient.invalidateQueries({ queryKey: ["batch", normalizedYear] }),
      ]);
      setShowModal(false);
    }
    setSaving(false);
  };

  const batches = data?.batches || [];
  const alumni = data?.alumni || [];

  // Categorize alumni for coordinator selection: same batch first, then others
  const filteredAlumni = useMemo(() => {
    const currentYear = (year || editingBatch?.year || "").trim();
    const query = coordinatorSearch.toLowerCase().trim();

    return alumni
      .filter((m) => {
        if (!query) return true;
        return (
          m.full_name?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.batch?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        // Prioritize same batch
        const aSameBatch = a.batch === currentYear;
        const bSameBatch = b.batch === currentYear;
        if (aSameBatch && !bSameBatch) return -1;
        if (!aSameBatch && bSameBatch) return 1;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });
  }, [alumni, year, editingBatch?.year, coordinatorSearch]);

  const selectedCoordinator = useMemo(
    () => alumni.find((m) => m.id === coordinatorId),
    [alumni, coordinatorId]
  );

  return (
    <DashboardShell title="Manage Batches">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">
                Manage Batches
              </h2>
              <CalendarRange className="w-5 h-5 text-accent" />
            </div>
            <p className="text-muted text-[14px]">
              Set coordinators, descriptions, group covers, and manage batch galleries.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            Add Batch
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-28 bg-surface animate-pulse rounded-xl border border-border"
              />
            ))}
          </div>
        ) : batches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batches.map((batch) => {
              const coordinator = alumni.find((member) => member.id === batch.coordinator_id);
              const photoCount = batch.photos || 0;

              return (
                <Card key={batch.year} className="p-5 bg-surface border-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-lg font-serif font-bold text-foreground">
                            Batch {batch.year}
                          </h3>
                          <Badge variant={batch.members > 0 ? "info" : "default"}>
                            {batch.members} member{batch.members === 1 ? "" : "s"}
                          </Badge>
                          {photoCount > 0 ? (
                            <Badge variant="success">
                              <Camera className="w-3 h-3 mr-1 inline" />
                              {photoCount} photo{photoCount === 1 ? "" : "s"}
                            </Badge>
                          ) : (
                            <Badge variant="default">0 photos</Badge>
                          )}
                        </div>
                        <p className="text-[12px] text-muted line-clamp-2">
                          {batch.description || "No description added yet."}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(batch)}>
                        <Edit3 className="w-4 h-4" />
                        Edit
                      </Button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border space-y-2.5 text-[12px]">
                      {/* Coordinator Status */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          {coordinator ? (
                            <>
                              <Avatar
                                src={coordinator.avatar_url}
                                name={coordinator.full_name}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {coordinator.full_name}
                                </p>
                                <p className="text-[11px] text-muted truncate">
                                  Coordinator {coordinator.batch ? `(Batch ${coordinator.batch})` : ""}
                                </p>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-400">
                              <Users className="w-4 h-4" />
                              <span>No coordinator assigned</span>
                            </div>
                          )}
                        </div>
                        {!coordinator && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEdit(batch)}
                            className="text-xs h-7 px-2"
                          >
                            Assign
                          </Button>
                        )}
                      </div>

                      {/* Group Photo Status */}
                      <div className="flex items-center gap-2 text-muted">
                        <ImageIcon className="w-4 h-4 text-muted shrink-0" />
                        <span className="truncate">
                          {batch.group_photo_url ? "Cover photo configured" : "No group cover photo"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                    <Link
                      href={`/batches/${encodeURIComponent(batch.year)}`}
                      className="text-brand hover:underline font-medium inline-flex items-center gap-1"
                    >
                      View Batch & Gallery →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center bg-surface border-border">
            <p className="text-[13px] text-muted mb-4">No batches found.</p>
            <Button onClick={openCreate}>
              <Plus className="w-4 h-4" />
              Add First Batch
            </Button>
          </Card>
        )}
      </div>

      {/* Edit / Add Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingBatch ? `Edit Batch ${editingBatch.year}` : "Add New Batch"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Batch Year"
            value={year}
            onChange={(event) => setYear(event.target.value)}
            required
            disabled={!!editingBatch}
            placeholder="e.g. 2012"
          />

          {/* Coordinator Selection Section */}
          <div className="space-y-2.5 rounded-lg border border-border p-3.5 bg-black/20">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[13px] font-medium text-foreground">
                  Batch Coordinator
                </label>
                <p className="text-[11px] text-muted">
                  The designated coordinator can upload and curate photographs and edit this batch&apos;s details.
                </p>
              </div>
              {coordinatorId && (
                <button
                  type="button"
                  onClick={() => setCoordinatorId("")}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>

            {selectedCoordinator ? (
              <div className="flex items-center gap-3 p-2.5 rounded-md bg-brand/10 border border-brand/30">
                <Avatar
                  src={selectedCoordinator.avatar_url}
                  name={selectedCoordinator.full_name}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {selectedCoordinator.full_name}
                    </p>
                    <Badge variant="success">Selected</Badge>
                  </div>
                  <p className="text-xs text-muted truncate">
                    {selectedCoordinator.email} {selectedCoordinator.batch ? `· Batch ${selectedCoordinator.batch}` : ""}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-400/90 italic">
                No coordinator selected. Anyone with Admin access can also manage the batch.
              </p>
            )}

            {/* Quick search input */}
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={coordinatorSearch}
                onChange={(e) => setCoordinatorSearch(e.target.value)}
                placeholder="Search alumni by name, email, or batch..."
                className="w-full rounded-md bg-[#0e1015] border border-border text-foreground pl-8.5 pr-3 py-1.5 text-xs focus:outline-none focus:border-brand"
              />
            </div>

            {/* Alumni list with highlight for batch members */}
            <div className="max-h-48 overflow-y-auto space-y-1 rounded border border-border/60 p-1.5 bg-[#0e1015]">
              <div
                onClick={() => setCoordinatorId("")}
                className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                  !coordinatorId ? "bg-white/10 text-white" : "text-muted hover:bg-white/5"
                }`}
              >
                <span>No Coordinator</span>
                {!coordinatorId && <Check className="w-3.5 h-3.5 text-brand" />}
              </div>

              {filteredAlumni.length === 0 ? (
                <p className="text-xs text-muted p-2 text-center">No alumni match search</p>
              ) : (
                filteredAlumni.map((member) => {
                  const isSelected = coordinatorId === member.id;
                  const isCurrentBatch = member.batch === (year || editingBatch?.year);
                  return (
                    <div
                      key={member.id}
                      onClick={() => setCoordinatorId(member.id)}
                      className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-brand/20 border border-brand/40 text-white"
                          : "text-foreground hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar src={member.avatar_url} name={member.full_name} size="sm" />
                        <span className="truncate font-medium">{member.full_name}</span>
                        {member.batch && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded ${
                              isCurrentBatch
                                ? "bg-accent/20 text-accent font-semibold"
                                : "text-muted bg-white/5"
                            }`}
                          >
                            Batch {member.batch}
                          </span>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Group Photo Section */}
          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground">
              Group Cover Photo
            </label>
            <div className="flex gap-2">
              <Input
                value={groupPhotoUrl}
                onChange={(event) => setGroupPhotoUrl(event.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-border rounded-md text-xs font-medium text-foreground cursor-pointer transition-colors shrink-0">
                <Upload className="w-3.5 h-3.5" />
                {uploadingCover ? "Uploading..." : "Upload"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGroupPhotoFile}
                  disabled={uploadingCover}
                  className="hidden"
                />
              </label>
            </div>
            {groupPhotoUrl && (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-border mt-2 bg-black/40">
                <Image
                  src={groupPhotoUrl}
                  alt="Batch preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setGroupPhotoUrl("")}
                  className="absolute top-2 right-2 p-1 bg-black/70 hover:bg-black rounded-full text-white text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-[13px] font-medium text-foreground">
              Batch Description / Note
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-md bg-[#0e1015] border border-border text-foreground placeholder-muted px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-brand"
              placeholder="A brief history, notable facts, or greeting for this cohort..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <Save className="w-4 h-4" />
              Save Batch
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
