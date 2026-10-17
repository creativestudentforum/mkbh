"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import ProfileCard from "@/components/molecules/ProfileCard";
import DashboardShell from "@/components/organisms/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { AlumniDirectoryProfile, Batch } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Edit3, ImageIcon, Save, Users } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

export default function BatchDetailPage({ params }: { params: Promise<{ year: string }> }) {
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

  const { data, isLoading, error } = useQuery({
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
      const coordinator = batch?.coordinator_id
        ? members.find((member) => member.id === batch.coordinator_id) || null
        : null;

      return { batch, members, coordinator };
    },
  });

  const members = data?.members || [];
  const canEdit = Boolean(data?.batch && (profile?.role === "admin" || data.batch.coordinator_id === user?.id));

  const startEditing = () => {
    setDescription(data?.batch?.description || "");
    setGroupPhotoUrl(data?.batch?.group_photo_url || "");
    setIsEditing(true);
  };

  const saveBatch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("batches")
      .update({ description: description.trim(), group_photo_url: groupPhotoUrl.trim() || null })
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

  return (
    <DashboardShell title={`Batch ${year}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <Link href="/batches" className="inline-flex items-center gap-2 text-[12px] text-[#777] hover:text-[#FF6363] transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to batches
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-[24px] font-bold text-[#fafafa] tracking-tight">Batch {year}</h2>
                <CalendarRange className="w-5 h-5 text-[#FF6363]" />
              </div>
              <p className="text-[#777] text-[14px]">Members, coordinator and batch information.</p>
            </div>
            <Badge variant="info">{members.length} member{members.length === 1 ? "" : "s"}</Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <div className="skeleton h-52 rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-32 rounded-xl" />)}
            </div>
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-[13px] text-[#EF4444]">Could not load this batch.</p>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-5 slide-up stagger-2">
              <Card className="overflow-hidden">
                {data?.batch?.group_photo_url ? (
                  <div
                    role="img"
                    aria-label={`Batch ${year} group photo`}
                    className="h-56 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${data.batch.group_photo_url})` }}
                  />
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center bg-[rgba(255,255,255,0.02)] text-center px-6">
                    <ImageIcon className="w-10 h-10 text-[#444] mb-3" />
                    <p className="text-[13px] text-[#666]">No group photo yet</p>
                  </div>
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-[15px] font-semibold text-[#fafafa]">About this batch</h3>
                    {canEdit && !isEditing && <Button size="sm" variant="ghost" onClick={startEditing}><Edit3 className="w-4 h-4" />Edit</Button>}
                  </div>
                  {isEditing ? (
                    <form onSubmit={saveBatch} className="space-y-4">
                      <Input label="Group Photo URL" type="url" value={groupPhotoUrl} onChange={(event) => setGroupPhotoUrl(event.target.value)} placeholder="https://..." />
                      <div className="space-y-2">
                        <label htmlFor="batch-description" className="block text-[13px] font-medium text-[#a0a0a0]">Description</label>
                        <textarea id="batch-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg bg-[#101010] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                        <Button type="submit" isLoading={saving}><Save className="w-4 h-4" />Save</Button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-[13px] text-[#888] leading-relaxed">
                      {data?.batch?.description || "No batch description has been added yet."}
                    </p>
                  )}
                </div>
              </Card>

              <Card className="p-5 h-fit">
                <p className="text-[11px] text-[#555] uppercase tracking-wider font-semibold mb-4">Coordinator</p>
                {data?.coordinator ? (
                  <div className="flex items-center gap-3">
                    <Avatar src={data.coordinator.avatar_url} name={data.coordinator.full_name} size="md" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#fafafa] truncate">{data.coordinator.full_name}</p>
                      <p className="text-[11px] text-[#666] truncate">Batch {data.coordinator.batch}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[13px] text-[#666]">No coordinator assigned yet.</p>
                )}
              </Card>
            </div>

            <section className="space-y-4 slide-up stagger-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#FF6363]" />
                <h3 className="text-[15px] font-semibold text-[#fafafa]">Members</h3>
              </div>

              {members.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {members.map((member) => <ProfileCard key={member.id} profile={member} onClick={() => setSelectedProfile(member)} />)}
                </div>
              ) : (
                <Card className="p-12 flex flex-col items-center justify-center text-center">
                  <Users className="w-8 h-8 text-[#444] mb-3" />
                  <p className="text-[13px] text-[#666]">No approved members found for this batch.</p>
                </Card>
              )}
            </section>
          </>
        )}
      </div>

      {selectedProfile && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedProfile(null)}>
          <Card className="w-full max-w-md p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4">
              <Avatar src={selectedProfile.avatar_url} name={selectedProfile.full_name} size="xl" />
              <div className="min-w-0">
                <h3 className="text-[18px] font-bold text-[#fafafa] truncate">{selectedProfile.full_name}</h3>
                <p className="text-[#FF6363] font-medium text-[13px]">{selectedProfile.profession || "Alumni"}{selectedProfile.company && ` @ ${selectedProfile.company}`}</p>
                <p className="text-[12px] text-[#777] mt-2">{[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ") || "Location not provided"}</p>
                {selectedProfile.phone && <a href={`tel:${selectedProfile.phone}`} className="inline-flex mt-4 text-[13px] text-[#FF6363] hover:text-[#FF4F4F]">{selectedProfile.phone}</a>}
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
