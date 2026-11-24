"use client";

import Badge from "@/components/atoms/Badge";
import type { Album, Photo } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import {
  ChevronLeft,
  ChevronRight,
  X,
  LayoutGrid,
  Columns3,
  Calendar,
  ImageIcon,
  Maximize2,
  Minimize2,
  Plus,
  Download,
  Info,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Parses composite caption into title and comment.
 * Format: "Title :: Comment" or plain "Title"
 */
export function parsePhotoCaption(raw: string | null | undefined): {
  title: string;
  comment: string;
} {
  if (!raw) return { title: "Untitled Photo", comment: "" };
  if (raw.includes("::")) {
    const [title, ...rest] = raw.split("::");
    return { title: title.trim(), comment: rest.join("::").trim() };
  }
  if (raw.includes("\n\n")) {
    const [title, ...rest] = raw.split("\n\n");
    return { title: title.trim(), comment: rest.join("\n\n").trim() };
  }
  return { title: raw.trim(), comment: "" };
}

interface ApplePhotoGalleryProps {
  album: Album | null;
  photos: Photo[];
  onUploadClick?: () => void;
  canUpload?: boolean;
}

export default function ApplePhotoGallery({
  album,
  photos,
  onUploadClick,
  canUpload = false,
}: ApplePhotoGalleryProps) {
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCaptionInLightbox, setShowCaptionInLightbox] = useState(true);

  const carouselRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Check scroll position for prev/next buttons
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

  // Keyboard navigation for modal lightbox
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
      if (e.key === "i" || e.key === "I") {
        setShowCaptionInLightbox((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, photos.length]);

  if (photos.length === 0) {
    return (
      <div className="p-12 rounded-[28px] bg-[#13151b] border border-white/[0.08] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#9ca3af] mb-3">
          <ImageIcon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#f3f4f6]">
          No photos in this album yet
        </h3>
        <p className="text-xs text-[#86868b] mt-1 max-w-sm">
          Photographs added to this collection will appear here.
        </p>
        {canUpload && onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            className="mt-4 px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Upload First Photograph
          </button>
        )}
      </div>
    );
  }

  const selectedPhoto =
    selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;
  const parsedSelected = selectedPhoto
    ? parsePhotoCaption(selectedPhoto.caption)
    : null;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="info">
            {photos.length} photograph{photos.length === 1 ? "" : "s"}
          </Badge>
          {album?.created_at && (
            <span className="text-xs text-[#86868b] hidden sm:inline-flex items-center gap-1.5 ml-2">
              <Calendar className="w-3.5 h-3.5 text-[#6b7280]" />
              {formatDate(album.created_at)}
            </span>
          )}
        </div>

        {/* View Mode Toggle + Upload Action */}
        <div className="flex items-center gap-2">
          {canUpload && onUploadClick && (
            <button
              type="button"
              onClick={onUploadClick}
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Photos</span>
            </button>
          )}

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
        </div>
      </div>

      {/* Spotlight / Apple Store Carousel View */}
      {viewMode === "carousel" ? (
        <div className="space-y-3">
          <div
            ref={carouselRef}
            className="flex items-stretch gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((photo, index) => {
              const { title, comment } = parsePhotoCaption(photo.caption);
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(index)}
                  className="group relative flex flex-col justify-between text-left select-none w-[300px] sm:w-[350px] md:w-[370px] h-[450px] sm:h-[480px] rounded-[28px] p-6 sm:p-7 flex-shrink-0 snap-start cursor-pointer bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922] transition-all duration-300 ease-out shadow-sm hover:shadow-xl"
                >
                  {/* Top Text Header */}
                  <div>
                    <p className="text-xs font-semibold text-[#86868b] tracking-tight uppercase">
                      Memory {index + 1} of {photos.length}
                    </p>
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
        /* Grid View with Apple Style Cards and Overlay Captions */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo, index) => {
            const { title, comment } = parsePhotoCaption(photo.caption);
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-between transition-opacity">
                  <div className="flex justify-end">
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

      {/* Lightbox Modal with Fullscreen Option */}
      {selectedPhoto && (
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
              {album?.title && (
                <span className="text-xs text-[#86868b] hidden sm:inline truncate max-w-xs">
                  {album.title}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Caption visibility */}
              <button
                type="button"
                onClick={() => setShowCaptionInLightbox((prev) => !prev)}
                className={`p-2 rounded-full border border-white/10 text-white transition-all backdrop-blur-md ${
                  showCaptionInLightbox ? "bg-white/20 text-white" : "bg-black/40 text-white/60 hover:text-white"
                }`}
                title="Toggle Caption (I)"
              >
                <Info className="w-4 h-4" />
              </button>

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

              {/* Download original image */}
              <a
                href={selectedPhoto.url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 backdrop-blur-md"
                title="Open / Download Full Resolution"
              >
                <Download className="w-4 h-4" />
              </a>

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

          {/* Center: Image Presentation */}
          <div
            className={`relative w-full flex-1 flex items-center justify-center overflow-hidden ${
              isFullscreen ? "h-screen" : "max-h-[82vh]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-full max-w-6xl max-h-[80vh] flex items-center justify-center">
              <Image
                src={getOptimizedImageUrl(selectedPhoto.url, {
                  width: 2000,
                  crop: "limit",
                })}
                alt={parsedSelected?.title || "Gallery photograph"}
                fill
                sizes="100vw"
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Overlaid Caption Card floating at the bottom */}
          {showCaptionInLightbox && parsedSelected && (
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
