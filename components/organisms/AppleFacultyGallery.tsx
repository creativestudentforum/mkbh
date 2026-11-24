"use client";

import Badge from "@/components/atoms/Badge";
import Modal from "@/components/atoms/Modal";
import type { Teacher } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Columns3,
  BookOpen,
  Mail,
  Phone,
  GraduationCap,
  Plus,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface AppleFacultyGalleryProps {
  teachers: Teacher[];
}

export default function AppleFacultyGallery({
  teachers,
}: AppleFacultyGalleryProps) {
  const [viewMode, setViewMode] = useState<"carousel" | "grid">("carousel");
  const [selectedTeacherIndex, setSelectedTeacherIndex] = useState<number | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
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
  }, [teachers, viewMode]);

  const scrollByCard = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = Math.max(340, Math.floor(carouselRef.current.clientWidth * 0.75));
    carouselRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (teachers.length === 0) {
    return (
      <div className="p-12 rounded-[28px] bg-[#13151b] border border-white/[0.08] flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#9ca3af] mb-3">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#f3f4f6]">
          No faculty members found
        </h3>
        <p className="text-xs text-[#86868b] mt-1 max-w-sm">
          Try adjusting your search criteria or check back later.
        </p>
      </div>
    );
  }

  const selectedTeacher =
    selectedTeacherIndex !== null ? teachers[selectedTeacherIndex] : null;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4">
        <Badge variant="info">
          {teachers.length} faculty member{teachers.length === 1 ? "" : "s"}
        </Badge>

        {/* View Toggle */}
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

      {/* Spotlight / Apple Store Carousel View */}
      {viewMode === "carousel" ? (
        <div className="space-y-3">
          <div
            ref={carouselRef}
            className="flex items-stretch gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {teachers.map((teacher, index) => (
              <div
                key={teacher.id}
                onClick={() => setSelectedTeacherIndex(index)}
                className="group relative flex flex-col justify-between text-left select-none w-[300px] sm:w-[340px] md:w-[360px] h-[440px] sm:h-[470px] rounded-[28px] p-6 sm:p-7 flex-shrink-0 snap-start cursor-pointer bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922] transition-all duration-300 ease-out shadow-sm hover:shadow-xl"
              >
                {/* Top: Eyebrow + Headline + Department */}
                <div>
                  <p className="text-xs font-semibold text-[#86868b] tracking-tight uppercase line-clamp-1">
                    {teacher.designation || "Faculty Member"}
                  </p>
                  <h3 className="text-[22px] sm:text-[24px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.2] mt-1.5 line-clamp-1 group-hover:text-white transition-colors">
                    {teacher.full_name}
                  </h3>
                  <p className="mt-2 text-[13px] text-[#86868b] leading-relaxed line-clamp-2">
                    {teacher.department}
                    {teacher.specialization ? ` • ${teacher.specialization}` : ""}
                  </p>
                </div>

                {/* Bottom: Apple Style Portrait Photo with Floating Plus Button */}
                <div className="relative w-full h-52 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-t from-black/60 to-black/10 border border-white/[0.08] mt-4 flex items-end justify-center">
                  {teacher.avatar_url ? (
                    <Image
                      src={getOptimizedImageUrl(teacher.avatar_url, {
                        width: 600,
                        crop: "fill",
                      })}
                      alt={teacher.full_name}
                      fill
                      sizes="360px"
                      className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-[#9ca3af] bg-white/[0.02]">
                      {teacher.full_name.charAt(0)}
                    </div>
                  )}

                  {/* Floating Apple Plus Button */}
                  <div
                    aria-label="View teacher profile"
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-lg z-10"
                  >
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            ))}
            <div className="w-3 flex-shrink-0" aria-hidden="true" />
          </div>

          {/* Apple Store Carousel Navigation Buttons (Bottom Right) */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => scrollByCard("left")}
              disabled={!canScrollLeft}
              aria-label="Previous faculty"
              className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard("right")}
              disabled={!canScrollRight}
              aria-label="Next faculty"
              className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Grid View with Apple Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {teachers.map((teacher, index) => (
            <div
              key={teacher.id}
              onClick={() => setSelectedTeacherIndex(index)}
              className="group relative flex flex-col justify-between text-left select-none h-[440px] rounded-[28px] p-6 sm:p-7 cursor-pointer bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922] transition-all duration-300 ease-out shadow-sm hover:shadow-xl"
            >
              <div>
                <p className="text-xs font-semibold text-[#86868b] tracking-tight uppercase line-clamp-1">
                  {teacher.designation || "Faculty Member"}
                </p>
                <h3 className="text-[22px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.2] mt-1.5 line-clamp-1 group-hover:text-white transition-colors">
                  {teacher.full_name}
                </h3>
                <p className="mt-2 text-[13px] text-[#86868b] leading-relaxed line-clamp-2">
                  {teacher.department}
                  {teacher.specialization ? ` • ${teacher.specialization}` : ""}
                </p>
              </div>

              <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gradient-to-t from-black/60 to-black/10 border border-white/[0.08] mt-4 flex items-end justify-center">
                {teacher.avatar_url ? (
                  <Image
                    src={getOptimizedImageUrl(teacher.avatar_url, {
                      width: 600,
                      crop: "fill",
                    })}
                    alt={teacher.full_name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-serif text-[#9ca3af] bg-white/[0.02]">
                    {teacher.full_name.charAt(0)}
                  </div>
                )}

                <div
                  aria-label="View teacher profile"
                  className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-lg z-10"
                >
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedTeacher && (
        <Modal
          isOpen={!!selectedTeacher}
          onClose={() => setSelectedTeacherIndex(null)}
          title="Faculty Profile"
          size="md"
        >
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 bg-[#0e1015] flex-shrink-0 relative">
                {selectedTeacher.avatar_url ? (
                  <Image
                    src={getOptimizedImageUrl(selectedTeacher.avatar_url, { width: 200, crop: "fill" })}
                    alt={selectedTeacher.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-serif text-[#9ca3af]">
                    {selectedTeacher.full_name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-[#86868b] tracking-tight uppercase block">
                  {selectedTeacher.designation || "Faculty Member"}
                </span>
                <h3 className="text-xl font-semibold text-[#f3f4f6] mt-0.5">
                  {selectedTeacher.full_name}
                </h3>
                <p className="text-xs text-[#9ca3af] mt-0.5">
                  {selectedTeacher.department}
                </p>
              </div>
            </div>

            {selectedTeacher.specialization && (
              <div className="p-3.5 rounded-2xl bg-[#0e1015] border border-white/[0.08]">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-[#86868b]">
                  Teaching Subject / Specialization
                </p>
                <p className="text-xs font-medium text-[#d1d5db] mt-1">
                  {selectedTeacher.specialization}
                </p>
              </div>
            )}

            {selectedTeacher.bio && (
              <div className="text-xs text-[#d1d5db] leading-relaxed italic p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                "{selectedTeacher.bio}"
              </div>
            )}

            <div className="pt-3 border-t border-white/[0.08] space-y-2 text-xs">
              {selectedTeacher.email && (
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <Mail className="w-3.5 h-3.5 text-[#6b7280]" />
                  <a href={`mailto:${selectedTeacher.email}`} className="hover:text-white transition-colors">
                    {selectedTeacher.email}
                  </a>
                </div>
              )}
              {selectedTeacher.phone && (
                <div className="flex items-center gap-2 text-[#9ca3af]">
                  <Phone className="w-3.5 h-3.5 text-[#6b7280]" />
                  <a href={`tel:${selectedTeacher.phone}`} className="hover:text-white transition-colors">
                    {selectedTeacher.phone}
                  </a>
                </div>
              )}
              {selectedTeacher.website_url && (
                <div className="flex items-center gap-2 text-[#6b7280]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <a
                    href={selectedTeacher.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Academic Website / Portfolio
                  </a>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
