"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import { parsePhotoCaption } from "@/components/organisms/ApplePhotoGallery";
import { createClient } from "@/lib/supabase";
import type { BatchPhoto } from "@/lib/types";
import { formatDate, getOptimizedImageUrl, uploadImage } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Edit3,
  ImageIcon,
  ImagePlus,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Plus,
  Save,
  Star,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface BatchPhotoGalleryProps {
  batchYear: string;
  photos: BatchPhoto[];
  canManage: boolean;
  currentGroupPhotoUrl?: string | null;
  onSetGroupPhoto?: (url: string) => Promise<void>;
  migrationPending?: boolean;
}

interface StagedPhoto {
  id: string;
  file: File;
  preview: string;
  title: string;
  story: string;
}

export default function BatchPhotoGallery({
  batchYear,
  photos,
  canManage,
  currentGroupPhotoUrl,
  onSetGroupPhoto,
  migrationPending = false,
}: BatchPhotoGalleryProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Edit caption state
  const [editingPhoto, setEditingPhoto] = useState<BatchPhoto | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStory, setEditStory] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Carousel ref & lightbox ref
  const carouselRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [photos, viewMode]);

  const scrollByCard = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = Math.max(340, Math.floor(carouselRef.current.clientWidth * 0.75));
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Fullscreen Toggle
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (lightboxRef.current?.requestFullscreen) {
          await lightboxRef.current.requestFullscreen();
          setIsFullscreen(true);
        } else if ((lightboxRef.current as unknown as { webkitRequestFullscreen?: () => Promise<void> })?.webkitRequestFullscreen) {
          await (lightboxRef.current as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
          setIsFullscreen(true);
        } else {
          setIsFullscreen(true);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } else {
          setIsFullscreen(false);
        }
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    if (selectedPhotoIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          setSelectedPhotoIndex(null);
        }
      }
      if (e.key === "ArrowLeft") {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev > 0 ? prev - 1 : photos.length - 1
        );
      }
      if (e.key === "ArrowRight") {
        setSelectedPhotoIndex((prev) =>
          prev !== null && prev < photos.length - 1 ? prev + 1 : 0
        );
      }
      if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  // Handle file selection into staging
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const files = Array.from(event.target.files);
    const staged: StagedPhoto[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      story: "",
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
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      const remaining = prev.filter((item) => item.id !== id);
      if (remaining.length === 0) setShowUploadModal(false);
      return remaining;
    });
  };

  // Upload staged photos
  const handleUploadStaged = async () => {
    if (stagedPhotos.length === 0) return;
    setUploading(true);
    setUploadProgress(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = authData?.user?.id || null;

      const rows: Array<{
        batch_year: string;
        url: string;
        caption: string;
        uploaded_by: string | null;
      }> = [];

      for (let i = 0; i < stagedPhotos.length; i++) {
        const item = stagedPhotos[i];
        setUploadProgress(`Uploading ${i + 1} of ${stagedPhotos.length}: ${item.title}...`);

        const uploadedUrl = await uploadImage(item.file, {
          folder: `alumni-hub/batches/${batchYear}`,
          maxSizeMB: 0.6,
          maxWidthOrHeight: 1800,
        });

        if (uploadedUrl) {
          const caption = item.story.trim()
            ? `${item.title.trim()} :: ${item.story.trim()}`
            : item.title.trim();

          rows.push({
            batch_year: batchYear,
            url: uploadedUrl,
            caption,
            uploaded_by: currentUserId,
          });
        }
      }

      if (rows.length > 0) {
        const { error: insertError } = await supabase.from("batch_photos").insert(rows);
        if (insertError) throw insertError;

        if (!currentGroupPhotoUrl && onSetGroupPhoto && rows[0]?.url) {
          await onSetGroupPhoto(rows[0].url);
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["batch-photos", batchYear] }),
        queryClient.invalidateQueries({ queryKey: ["batch", batchYear] }),
        queryClient.invalidateQueries({ queryKey: ["batches"] }),
      ]);

      stagedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      setStagedPhotos([]);
      setShowUploadModal(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Upload failed";
      alert("Error uploading photos: " + message);
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDeletePhoto = async (photo: BatchPhoto) => {
    if (!confirm("Are you sure you want to delete this photo from the batch gallery?")) return;
    try {
      const { error } = await supabase.from("batch_photos").delete().eq("id", photo.id);
      if (error) throw error;

      if (selectedPhotoIndex !== null) {
        setSelectedPhotoIndex(null);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["batch-photos", batchYear] }),
        queryClient.invalidateQueries({ queryKey: ["batch", batchYear] }),
        queryClient.invalidateQueries({ queryKey: ["batches"] }),
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Delete failed";
      alert("Could not delete photo: " + message);
    }
  };

  const openEditCaption = (photo: BatchPhoto) => {
    const { title, comment } = parsePhotoCaption(photo.caption);
    setEditingPhoto(photo);
    setEditTitle(title);
    setEditStory(comment);
  };

  const handleSaveCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setSavingEdit(true);

    try {
      const caption = editStory.trim()
        ? `${editTitle.trim()} :: ${editStory.trim()}`
        : editTitle.trim();

      const { error } = await supabase
        .from("batch_photos")
        .update({ caption })
        .eq("id", editingPhoto.id);

      if (error) throw error;

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["batch-photos", batchYear] }),
        queryClient.invalidateQueries({ queryKey: ["batch", batchYear] }),
      ]);

      setEditingPhoto(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed";
      alert("Could not update caption: " + message);
    } finally {
      setSavingEdit(false);
    }
  };

  const selectedPhoto =
    selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;
  const parsedSelected = selectedPhoto
    ? parsePhotoCaption(selectedPhoto.caption)
    : null;

  return (
    <div className="space-y-6">
      {/* Top Header & Mode Toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="info">
            {photos.length} photograph{photos.length === 1 ? "" : "s"}
          </Badge>
          <span className="text-xs text-[#86868b] hidden sm:inline">
            Batch of {batchYear} Archive
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Upload Button */}
          {canManage && (
            <label className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Photos</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}

          {photos.length > 0 && (
            <div className="flex items-center bg-[#13151b] p-1 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("carousel")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === "carousel"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                <Columns3 className="w-3.5 h-3.5" />
                <span>Spotlight</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  viewMode === "grid"
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-[#86868b] hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {photos.length === 0 ? (
        <div className="p-12 rounded-[28px] bg-[#13151b] border border-white/[0.08] flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#9ca3af] mb-3">
            <Camera className="w-6 h-6 text-[#c89542]" />
          </div>
          <h3 className="text-base font-semibold text-[#f3f4f6]">
            No photographs in this batch gallery yet
          </h3>
          <p className="text-xs text-[#86868b] mt-1 max-w-md">
            {canManage
              ? "As Coordinator or Admin, you can upload memories, reunions, and class photos for this batch!"
              : "Photographs uploaded by the batch coordinator or administrator will appear here."}
          </p>

          {canManage && (
            <label className="mt-4 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              Upload First Batch Photos
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
          )}
        </div>
      ) : viewMode === "carousel" ? (
        /* Spotlight / Carousel View */
        <div className="space-y-3">
          <div
            ref={carouselRef}
            className="flex items-stretch gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((photo, index) => {
              const { title, comment } = parsePhotoCaption(photo.caption);
              const isCover = photo.url === currentGroupPhotoUrl;

              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className="group relative flex flex-col justify-between text-left select-none w-[300px] sm:w-[350px] md:w-[370px] h-[450px] sm:h-[480px] rounded-[28px] p-6 sm:p-7 flex-shrink-0 snap-start cursor-pointer bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922] transition-all duration-300 ease-out shadow-sm hover:shadow-xl"
                >
                  {/* Top Text Header */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#86868b]">
                      <span className="font-semibold uppercase tracking-tight">
                        Batch {batchYear} • {index + 1} of {photos.length}
                      </span>
                      {isCover && (
                        <span className="text-[10px] font-semibold text-[#34d399] bg-[#22785c]/20 border border-[#22785c]/40 px-2 py-0.5 rounded-full">
                          Cover
                        </span>
                      )}
                    </div>
                    <h3 className="text-[22px] sm:text-[24px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.2] mt-1.5 line-clamp-1 group-hover:text-white transition-colors">
                      {title}
                    </h3>
                  </div>

                  {/* Photo area with overlaid caption & floating plus button */}
                  <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden bg-gradient-to-t from-black/80 via-black/20 to-black/5 border border-white/[0.08] mt-4">
                    <Image
                      src={getOptimizedImageUrl(photo.url, {
                        width: 800,
                        crop: "fill",
                      })}
                      alt={title}
                      fill
                      sizes="380px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    {/* Overlaid caption on top of photo */}
                    <div className="absolute inset-x-0 bottom-0 p-3.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-end justify-between gap-3">
                      <div className="min-w-0 flex-1 pr-1">
                        <p className="text-xs font-semibold text-white truncate drop-shadow-sm">
                          {title}
                        </p>
                        {comment ? (
                          <p className="text-[11px] text-[#d1d5db] line-clamp-2 mt-0.5 leading-relaxed drop-shadow-sm">
                            {comment}
                          </p>
                        ) : null}
                      </div>

                      {/* Floating Apple Plus Button */}
                      <div
                        aria-label="View photo fullscreen"
                        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 text-white flex-shrink-0 flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-lg"
                      >
                        <Plus className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="w-3 flex-shrink-0" aria-hidden="true" />
          </div>

          {/* Apple Store Carousel Navigation Buttons (Bottom Right) */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => scrollByCard("left")}
              disabled={!canScrollLeft}
              aria-label="Previous photograph"
              className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard("right")}
              disabled={!canScrollRight}
              aria-label="Next photograph"
              className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            const { title, comment } = parsePhotoCaption(photo.caption);
            const isCover = photo.url === currentGroupPhotoUrl;

            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhotoIndex(index)}
                className="group relative rounded-[24px] overflow-hidden bg-[#13151b] border border-white/[0.08] hover:border-white/20 transition-all duration-300 cursor-pointer aspect-square shadow-sm hover:shadow-xl"
              >
                <Image
                  src={getOptimizedImageUrl(photo.url, {
                    width: 700,
                    crop: "fill",
                  })}
                  alt={title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Overlaid caption on top of photo */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    {isCover ? (
                      <span className="text-[10px] font-semibold text-[#34d399] bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                        Cover
                      </span>
                    ) : <span />}
                    <span className="text-[10px] font-semibold text-white/80 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                      {index + 1}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0 flex-1 pr-1">
                      <p className="text-sm font-semibold text-white line-clamp-1 drop-shadow-md">
                        {title}
                      </p>
                      {comment ? (
                        <p className="text-xs text-[#d1d5db] line-clamp-2 mt-0.5 drop-shadow-md">
                          {comment}
                        </p>
                      ) : null}
                    </div>

                    <div className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/20 text-white flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox with Fullscreen Feature */}
      {selectedPhoto && parsedSelected && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          className={`fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-3 sm:p-6 select-none ${
            isFullscreen ? "p-0" : ""
          }`}
          onClick={() => setSelectedPhotoIndex(null)}
        >
          {/* Top Control Bar */}
          <div
            className="w-full flex items-center justify-between gap-4 z-30 p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white/90 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 1} / {photos.length}
              </span>
              <span className="text-xs text-[#86868b] hidden sm:inline truncate max-w-xs">
                Batch of {batchYear} Archive
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen Button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 backdrop-blur-md"
                title={isFullscreen ? "Exit Fullscreen (F)" : "Enter Fullscreen (F)"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              {/* Management controls */}
              {canManage && (
                <>
                  {onSetGroupPhoto && selectedPhoto.url !== currentGroupPhotoUrl && (
                    <button
                      type="button"
                      onClick={() => onSetGroupPhoto(selectedPhoto.url)}
                      className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium text-white border border-white/10 backdrop-blur-md"
                      title="Set as Batch Group Photo"
                    >
                      Set Cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openEditCaption(selectedPhoto)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 backdrop-blur-md"
                    title="Edit Caption"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(selectedPhoto)}
                    className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-300 transition-all border border-red-500/30 backdrop-blur-md"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  setSelectedPhotoIndex(null);
                }}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 backdrop-blur-md"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : photos.length - 1
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/20 backdrop-blur-md hover:scale-105"
                title="Previous photo (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPhotoIndex((prev) =>
                    prev !== null && prev < photos.length - 1 ? prev + 1 : 0
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all border border-white/20 backdrop-blur-md hover:scale-105"
                title="Next photo (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Center Image Presentation */}
          <div
            className={`relative w-full flex-1 flex items-center justify-center overflow-hidden ${
              isFullscreen ? "h-screen" : "max-h-[82vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
              <Image
                src={getOptimizedImageUrl(selectedPhoto.url, { width: 1800 })}
                alt={parsedSelected.title}
                fill
                sizes="100vw"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Overlaid Caption Card floating at the bottom */}
          <div
            className="z-30 w-full max-w-2xl px-4 pb-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 rounded-[24px] bg-black/70 backdrop-blur-xl border border-white/15 text-white shadow-2xl text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold tracking-tight text-white">
                {parsedSelected.title}
              </h3>
              {parsedSelected.comment ? (
                <p className="text-xs sm:text-sm text-[#d1d5db] leading-relaxed max-w-xl mx-auto">
                  {parsedSelected.comment}
                </p>
              ) : null}
              {selectedPhoto.uploader_name && (
                <p className="text-[11px] text-[#86868b] pt-1">
                  Uploaded by {selectedPhoto.uploader_name} • {formatDate(selectedPhoto.created_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal with Live Preview of Overlay Text */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          if (!uploading) {
            stagedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
            setStagedPhotos([]);
            setShowUploadModal(false);
          }
        }}
        title={`Add Photographs to Batch ${batchYear}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#86868b]">
            Give each photo a title and memory note. The text will be displayed beautifully overlaid on top of the photo in the batch gallery.
          </p>

          <div className="max-h-[52vh] overflow-y-auto space-y-3.5 pr-1">
            {stagedPhotos.map((item, idx) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-white/[0.08] bg-[#0e1015]"
              >
                {/* Photo Preview with Live Overlay */}
                <div className="relative w-full md:w-44 h-36 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 group">
                  <Image
                    src={item.preview}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeStagedPhoto(item.id)}
                    disabled={uploading}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/70 hover:bg-red-600 text-white text-xs transition-colors z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {/* Live overlay */}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                    <p className="text-[11px] font-semibold text-white truncate">
                      {item.title || "Untitled"}
                    </p>
                    {item.story ? (
                      <p className="text-[9px] text-[#d1d5db] truncate">
                        {item.story}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                  <Input
                    label={`Photo ${idx + 1} Title`}
                    value={item.title}
                    onChange={(e) => updateStagedPhoto(item.id, { title: e.target.value })}
                    placeholder="e.g. Reunion 2024, Class Group Photo"
                    disabled={uploading}
                  />
                  <div>
                    <label className="block text-[11px] font-medium text-[#9ca3af] mb-1">
                      Note / Description (will be shown over photo)
                    </label>
                    <textarea
                      rows={2}
                      value={item.story}
                      onChange={(e) => updateStagedPhoto(item.id, { story: e.target.value })}
                      placeholder="e.g. Taken during the annual gathering at the campus hall"
                      disabled={uploading}
                      className="w-full rounded-lg bg-[#13151b] border border-white/10 text-foreground px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {uploadProgress && (
            <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10 text-[#34d399] text-xs flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin" />
              <span>{uploadProgress}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button
              variant="secondary"
              type="button"
              disabled={uploading}
              onClick={() => {
                stagedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
                setStagedPhotos([]);
                setShowUploadModal(false);
              }}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUploadStaged}
              isLoading={uploading}
              disabled={stagedPhotos.length === 0}
              className="rounded-full"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Upload {stagedPhotos.length} Photograph{stagedPhotos.length === 1 ? "" : "s"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Caption Modal */}
      {editingPhoto && (
        <Modal
          isOpen={true}
          onClose={() => setEditingPhoto(null)}
          title="Edit Photograph Caption"
          size="md"
        >
          <form onSubmit={handleSaveCaption} className="space-y-4">
            <Input
              label="Photo Title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              placeholder="e.g. Batch Picnic 2022"
            />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#9ca3af]">
                Story / Note (will be shown over photo)
              </label>
              <textarea
                rows={3}
                value={editStory}
                onChange={(e) => setEditStory(e.target.value)}
                placeholder="Share a short note or memory about this photograph..."
                className="w-full rounded-lg bg-[#0e1015] border border-white/10 text-foreground placeholder-muted px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setEditingPhoto(null)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={savingEdit} className="rounded-full">
                <Save className="w-4 h-4 mr-1.5" /> Save
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
