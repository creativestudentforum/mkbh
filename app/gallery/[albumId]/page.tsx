"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import ApplePhotoGallery from "@/components/organisms/ApplePhotoGallery";
import Card from "@/components/atoms/Card";
import Modal from "@/components/atoms/Modal";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { Album, Photo } from "@/lib/types";
import { uploadImage, getErrorMessage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Upload, X, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useRef, useState } from "react";

interface StagedPhoto {
  id: string;
  file: File;
  preview: string;
  title: string;
  comment: string;
}

export default function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params);
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["gallery-album", albumId],
    queryFn: async () => {
      const [albumResponse, photosResponse] = await Promise.all([
        supabase.from("albums").select("*").eq("id", albumId).maybeSingle(),
        supabase.from("photos").select("*").eq("album_id", albumId).order("created_at", { ascending: false }).limit(100),
      ]);

      if (albumResponse.error) throw new Error(albumResponse.error.message);
      if (photosResponse.error) throw new Error(photosResponse.error.message);

      return {
        album: albumResponse.data as Album | null,
        photos: (photosResponse.data || []) as Photo[],
      };
    },
  });

  const album = data?.album || null;
  const photos = data?.photos || [];

  // File selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const files = Array.from(event.target.files);
    const staged: StagedPhoto[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      comment: "",
    }));
    setStagedPhotos((prev) => [...prev, ...staged]);
    setShowUploadModal(true);
    event.target.value = "";
  };

  const updateStagedPhoto = (id: string, updates: Partial<StagedPhoto>) => {
    setStagedPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeStagedPhoto = (id: string) => {
    setStagedPhotos((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 0) setShowUploadModal(false);
      return filtered;
    });
  };

  const handleUploadStaged = async () => {
    if (stagedPhotos.length === 0 || !albumId) return;
    setUploading(true);
    setUploadProgress(null);

    try {
      const rows: Array<Pick<Photo, "album_id" | "url" | "caption" | "uploaded_by">> = [];

      for (let index = 0; index < stagedPhotos.length; index += 1) {
        const item = stagedPhotos[index];
        setUploadProgress(`Uploading ${index + 1} of ${stagedPhotos.length}...`);

        const publicUrl = await uploadImage(item.file, {
          folder: `alumni-hub/gallery/${albumId}`,
        });

        if (publicUrl) {
          const compositeCaption = item.comment.trim()
            ? `${item.title.trim()} :: ${item.comment.trim()}`
            : item.title.trim();

          rows.push({
            album_id: albumId,
            url: publicUrl,
            caption: compositeCaption,
            uploaded_by: user?.id || null,
          });
        }
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from("photos").insert(rows);
        if (insertError) throw insertError;

        if (album && !album.cover_url) {
          await supabase
            .from("albums")
            .update({ cover_url: rows[0].url })
            .eq("id", albumId);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["gallery-album", albumId] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-albums"] });

      stagedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      setStagedPhotos([]);
      setShowUploadModal(false);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  return (
    <DashboardShell title={album?.title || "Album"}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link
            href="/gallery"
            className="inline-flex items-center gap-1.5 text-xs text-[#86868b] hover:text-white transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to all albums
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
                {album?.title || "Album"}
              </h2>
              {album?.description && (
                <p className="text-sm text-[#86868b] mt-1.5 max-w-2xl leading-relaxed">
                  {album.description}
                </p>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-[420px] rounded-[28px]" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center rounded-[28px]">
            <p className="text-xs text-red-400">Could not load this album.</p>
          </Card>
        ) : (
          <ApplePhotoGallery
            album={album}
            photos={photos}
            canUpload={Boolean(user)}
            onUploadClick={() => fileInputRef.current?.click()}
          />
        )}

        {/* Upload Modal with Caption/Story Inputs for each photo */}
        <Modal
          isOpen={showUploadModal}
          onClose={() => {
            if (uploading) return;
            stagedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
            setStagedPhotos([]);
            setShowUploadModal(false);
          }}
          title={`Add Photos to "${album?.title || "Album"}"`}
          size="lg"
        >
          <div className="space-y-5">
            <p className="text-xs text-[#86868b]">
              Give each photo a title and a story or note. The text will be displayed beautifully overlaid on top of the photo in the Apple gallery cards.
            </p>

            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {stagedPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="p-4 rounded-2xl bg-[#0e1015] border border-white/[0.08] flex flex-col md:flex-row gap-4 items-start"
                >
                  {/* Photo Preview with Live Overlay Preview */}
                  <div className="relative w-full md:w-44 h-36 rounded-xl overflow-hidden bg-black flex-shrink-0 border border-white/10 group">
                    <Image
                      src={photo.preview}
                      alt={photo.title || "Preview"}
                      fill
                      className="object-cover"
                    />
                    {/* Live overlay preview */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                      <p className="text-[11px] font-semibold text-white truncate">
                        {photo.title || "Untitled"}
                      </p>
                      {photo.comment ? (
                        <p className="text-[9px] text-[#d1d5db] truncate">
                          {photo.comment}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Text Input Fields */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wider">
                        Photo {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStagedPhoto(photo.id)}
                        disabled={uploading}
                        className="text-xs text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] text-[#9ca3af] block mb-1">
                        Title / Caption
                      </label>
                      <Input
                        value={photo.title}
                        onChange={(e) =>
                          updateStagedPhoto(photo.id, { title: e.target.value })
                        }
                        placeholder="e.g. Annual Alumni Reunion 2026"
                        disabled={uploading}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-[#9ca3af] block mb-1">
                        Note / Description (will be shown over photo)
                      </label>
                      <textarea
                        value={photo.comment}
                        onChange={(e) =>
                          updateStagedPhoto(photo.id, { comment: e.target.value })
                        }
                        placeholder="Write a brief story or memory about this photograph..."
                        rows={2}
                        disabled={uploading}
                        className="w-full rounded-lg bg-[#13151b] border border-white/10 px-3 py-1.5 text-xs text-[#f3f4f6] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-neutral-300 hover:text-white inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More Photos
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="rounded-full"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUploadStaged}
                  isLoading={uploading}
                  disabled={uploading || stagedPhotos.length === 0}
                  className="rounded-full"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  {uploading
                    ? uploadProgress || "Uploading..."
                    : `Upload ${stagedPhotos.length} Photo${stagedPhotos.length === 1 ? "" : "s"}`}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardShell>
  );
}
