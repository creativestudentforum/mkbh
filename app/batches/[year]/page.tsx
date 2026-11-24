"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import ProfileCard from "@/components/molecules/ProfileCard";
import BatchPhotoGallery from "@/components/organisms/BatchPhotoGallery";
import DashboardShell from "@/components/organisms/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { AlumniDirectoryProfile, Batch, BatchPhoto } from "@/lib/types";
import { formatDate, getOptimizedImageUrl, uploadImage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarRange,
  Camera,
  Edit3,
  ImageIcon,
  MapPin,
  Phone,
  Save,
  Shield,
  Sparkles,
  Upload,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";

export default function BatchDetailPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const { year: encodedYear } = use(params);
  const year = decodeURIComponent(encodedYear);
  const { profile, user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [selectedProfile, setSelectedProfile] = useState<AlumniDirectoryProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [groupPhotoUrl, setGroupPhotoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // 1. Fetch batch details and member roster
  const { data: batchData, isLoading: batchLoading, error: batchError } = useQuery({
    queryKey: ["batch", year],
    queryFn: async () => {
      const [batchResponse, membersResponse] = await Promise.all([
        supabase.from("batches").select("*").eq("year", year).maybeSingle(),
        supabase.from("alumni_directory").select("*").eq("batch", year).order("full_name"),
      ]);

      if (batchResponse.error) throw new Error(batchResponse.error.message);
      if (membersResponse.error) throw new Error(membersResponse.error.message);

      const batch = batchResponse.data as Batch | null;
      const members = (membersResponse.data || []) as AlumniDirectoryProfile[];

      // Fetch coordinator profile specifically from alumni_directory
      let coordinator: AlumniDirectoryProfile | null = null;
      if (batch?.coordinator_id) {
        coordinator = members.find((m) => m.id === batch.coordinator_id) || null;
        if (!coordinator) {
          const { data: coordData } = await supabase
            .from("alumni_directory")
            .select("*")
            .eq("id", batch.coordinator_id)
            .maybeSingle();
          coordinator = (coordData as AlumniDirectoryProfile | null) || null;
        }
      }

      return { batch, members, coordinator };
    },
  });

  // 2. Fetch batch photos
  const { data: photosData, isLoading: photosLoading } = useQuery({
    queryKey: ["batch-photos", year],
    queryFn: async () => {
      try {
        // Try view first
        const { data, error } = await supabase
          .from("batch_photos_view")
          .select("*")
          .eq("batch_year", year)
          .order("created_at", { ascending: false });

        if (error) {
          // Fallback to table directly if view is missing
          const direct = await supabase
            .from("batch_photos")
            .select("*")
            .eq("batch_year", year)
            .order("created_at", { ascending: false });

          if (direct.error) {
            console.warn("batch_photos query error:", direct.error.message);
            const isMissing = direct.error.code === "PGRST205" || direct.error.code === "42P01";
            return { photos: [] as BatchPhoto[], migrationPending: isMissing };
          }
          return { photos: (direct.data || []) as BatchPhoto[], migrationPending: false };
        }

        return { photos: (data || []) as BatchPhoto[], migrationPending: false };
      } catch (e) {
        console.warn("Photos fetch exception:", e);
        return { photos: [] as BatchPhoto[], migrationPending: false };
      }
    },
  });

  const batch = batchData?.batch || null;
  const members = batchData?.members || [];
  const coordinator = batchData?.coordinator || null;
  const photos = photosData?.photos || [];
  const migrationPending = photosData?.migrationPending || false;

  // Authorization: Is current user coordinator of this batch or an Admin?
  const isCoordinator = Boolean(
    batch?.coordinator_id && (batch.coordinator_id === user?.id || batch.coordinator_id === profile?.id)
  );
  const isAdmin = profile?.role === "admin";
  const canManage = isCoordinator || isAdmin;

  const startEditing = () => {
    setDescription(batch?.description || "");
    setGroupPhotoUrl(batch?.group_photo_url || "");
    setIsEditing(true);
  };

  const handleGroupPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const uploadedUrl = await uploadImage(file, {
        folder: `alumni-hub/batches/${year}`,
        maxSizeMB: 0.8,
        maxWidthOrHeight: 1920,
      });
      setGroupPhotoUrl(uploadedUrl);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      alert("Cover upload error: " + msg);
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const saveBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("batches")
      .update({
        description: description.trim(),
        group_photo_url: groupPhotoUrl.trim() || null,
      })
      .eq("year", year);

    if (error) {
      alert("Error saving batch: " + error.message);
    } else {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["batch", year] }),
        queryClient.invalidateQueries({ queryKey: ["batches"] }),
      ]);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleSetGroupPhoto = async (photoUrl: string) => {
    try {
      const { error } = await supabase
        .from("batches")
        .update({ group_photo_url: photoUrl })
        .eq("year", year);

      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["batch", year] }),
        queryClient.invalidateQueries({ queryKey: ["batches"] }),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not set group photo";
      alert(msg);
    }
  };

  return (
    <DashboardShell title={`Batch ${year}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/batches"
            className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to all batches
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
                  SSC Batch {year}
                </h2>
                <CalendarRange className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm text-muted">
                Member roster, batch coordinator, cohort memories, and photographs.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">
                {members.length} registered member{members.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant={photos.length > 0 ? "success" : "default"}>
                <Camera className="w-3 h-3 mr-1 inline" />
                {photos.length} photo{photos.length === 1 ? "" : "s"}
              </Badge>
              {canManage && !isEditing && (
                <Button variant="secondary" size="sm" onClick={startEditing}>
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Edit Batch Info
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Coordinator Banner */}
        {isCoordinator && (
          <div className="p-4 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center text-brand shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  You are the Batch Coordinator for Batch {year}
                </p>
                <p className="text-xs text-muted">
                  You can upload and curate memories, set cover photographs, and edit batch details.
                </p>
              </div>
            </div>
            {!isEditing && (
              <Button size="sm" onClick={startEditing}>
                <Edit3 className="w-3.5 h-3.5 mr-1" />
                Edit Batch Details
              </Button>
            )}
          </div>
        )}

        {batchLoading ? (
          <div className="space-y-4">
            <div className="h-44 bg-surface animate-pulse rounded-xl border border-border" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 bg-surface animate-pulse rounded-xl border border-border" />
              ))}
            </div>
          </div>
        ) : batchError ? (
          <Card className="p-8 text-center bg-surface border-border">
            <p className="text-xs text-red-400">Could not load batch details.</p>
          </Card>
        ) : (
          <>
            {/* Edit Batch Form */}
            {isEditing && (
              <Card className="p-5 sm:p-6 bg-surface border border-border shadow-lg">
                <div className="flex items-center justify-between mb-4 pb-3 border-t border-b border-border/60">
                  <h3 className="font-serif text-lg font-semibold text-foreground">
                    Edit Batch {year} Details
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="text-muted hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={saveBatch} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-foreground">
                      Batch Narrative & History
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add memorable memories, cohort motto, or notes about this batch..."
                      className="w-full rounded-lg bg-[#0e1015] border border-border text-sm text-foreground p-3 focus:outline-none focus:border-brand"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-foreground">
                      Group Cover Photo
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={groupPhotoUrl}
                        onChange={(e) => setGroupPhotoUrl(e.target.value)}
                        placeholder="https://... or upload below"
                        className="flex-1"
                      />
                      <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-border rounded-md text-xs font-medium text-foreground cursor-pointer transition-colors shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingCover ? "Uploading..." : "Upload Photo"}
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
                      <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border mt-2 bg-black/40">
                        <Image
                          src={groupPhotoUrl}
                          alt="Cover preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setGroupPhotoUrl("")}
                          className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black rounded-full text-white text-xs"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-border">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" type="submit" isLoading={saving}>
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Overview Grid: Cover / Description + Coordinator */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Batch History & Group Photo */}
              <Card className="lg:col-span-2 overflow-hidden bg-surface border-border flex flex-col justify-between">
                {batch?.group_photo_url ? (
                  <div className="relative h-56 sm:h-64 w-full bg-black/40">
                    <Image
                      src={getOptimizedImageUrl(batch.group_photo_url, { width: 1200 })}
                      alt={`Batch ${year} group photo`}
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                      <span className="text-xs font-semibold text-white/90 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-sm">
                        Batch {year} Group Photo
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center bg-black/20 text-center px-6 border-b border-border">
                    <ImageIcon className="w-8 h-8 text-muted mb-2" />
                    <p className="text-xs text-muted">No group cover photograph set yet.</p>
                    {canManage && (
                      <button
                        type="button"
                        onClick={startEditing}
                        className="text-xs text-brand hover:underline mt-1 font-medium inline-flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" /> Set group photo
                      </button>
                    )}
                  </div>
                )}

                <div className="p-5">
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                    Cohort History & Narrative
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {batch?.description || "No specific narrative or note has been recorded for this batch yet."}
                  </p>
                </div>
              </Card>

              {/* Coordinator Card */}
              <Card className="p-5 bg-surface border-border flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
                      Batch Coordinator
                    </h3>
                    {isCoordinator && <Badge variant="success">You</Badge>}
                  </div>

                  {coordinator ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={coordinator.avatar_url}
                          name={coordinator.full_name}
                          size="lg"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {coordinator.full_name}
                          </p>
                          <p className="text-xs text-brand font-medium truncate">
                            Batch {coordinator.batch || year} Coordinator
                          </p>
                          {coordinator.profession && (
                            <p className="text-[11px] text-muted truncate mt-0.5">
                              {coordinator.profession}
                              {coordinator.company ? ` at ${coordinator.company}` : ""}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-black/20 border border-border/80 text-xs text-muted space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>Appointed to manage photographs and cohort records.</span>
                        </div>
                        {coordinator.city && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>{[coordinator.city, coordinator.country].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                        {coordinator.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                            <a
                              href={`tel:${coordinator.phone}`}
                              className="text-brand hover:underline"
                            >
                              {coordinator.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 flex flex-col items-center text-center">
                      <Users className="w-8 h-8 text-muted mb-2" />
                      <p className="text-xs text-muted">
                        No batch coordinator currently designated.
                      </p>
                      {isAdmin && (
                        <Link
                          href="/admin/batches"
                          className="mt-3 text-xs text-brand hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Assign in Admin Panel →
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {coordinator && (
                  <div className="pt-3 border-t border-border mt-4 text-[11px] text-muted flex items-center justify-between">
                    <span>Batch Representative</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProfile(coordinator)}
                      className="text-brand hover:underline font-medium"
                    >
                      View Profile
                    </button>
                  </div>
                )}
              </Card>
            </div>

            {/* Batch Photo Gallery Section */}
            <section className="space-y-4 pt-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-accent" />
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground">
                    Batch Photograph Gallery
                  </h3>
                </div>
              </div>

              {photosLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-surface animate-pulse rounded-xl border border-border"
                    />
                  ))}
                </div>
              ) : (
                <BatchPhotoGallery
                  batchYear={year}
                  photos={photos}
                  canManage={canManage}
                  currentGroupPhotoUrl={batch?.group_photo_url}
                  onSetGroupPhoto={handleSetGroupPhoto}
                  migrationPending={migrationPending}
                />
              )}
            </section>

            {/* Registered Members Section */}
            <section className="space-y-4 pt-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-accent" />
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-foreground">
                    Registered Members
                  </h3>
                </div>
                <span className="text-xs text-muted">
                  {members.length} alumni in this cohort
                </span>
              </div>

              {members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => (
                    <ProfileCard
                      key={member.id}
                      profile={member}
                      onClick={() => setSelectedProfile(member)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 flex flex-col items-center justify-center text-center bg-surface border-border">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-border flex items-center justify-center mb-3 text-muted">
                    <Users className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No approved members found for Batch {year}
                  </p>
                  <p className="text-xs text-muted mt-1 max-w-sm">
                    Alumni who register with SSC Year {year} will automatically appear here once approved.
                  </p>
                </Card>
              )}
            </section>
          </>
        )}
      </div>

      {/* Profile Detail Modal */}
      {selectedProfile && (
        <Modal
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          title="Alumni Profile"
        >
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <Avatar
                src={selectedProfile.avatar_url}
                name={selectedProfile.full_name}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-serif text-lg font-semibold text-foreground">
                  {selectedProfile.full_name}
                </h4>
                <p className="text-xs text-accent font-medium">
                  {selectedProfile.profession || "Alumni Member"}
                  {selectedProfile.company ? ` at ${selectedProfile.company}` : ""}
                </p>
                <p className="text-xs text-muted mt-1">
                  {[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ") || "Location unlisted"}
                </p>
              </div>
            </div>

            {selectedProfile.phone && (
              <div className="pt-3 border-t border-border flex items-center gap-2 text-xs text-foreground/80">
                <Phone className="w-3.5 h-3.5 text-muted" />
                <a
                  href={`tel:${selectedProfile.phone}`}
                  className="text-brand hover:underline"
                >
                  {selectedProfile.phone}
                </a>
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardShell>
  );
}
