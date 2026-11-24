"use client";

import NotificationCard, {
  NotificationCardSkeleton,
  type NotificationItem,
  getNotificationIcon,
} from "@/components/molecules/NotificationCard";
import Modal from "@/components/atoms/Modal";
import Button from "@/components/atoms/Button";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Pin,
  Trash2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface NotificationCarouselProps {
  items: NotificationItem[];
  isLoading?: boolean;
  isAdmin?: boolean;
  onNewAnnouncement?: () => void;
  onTogglePin?: (id: string, currentPinned: boolean) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  className?: string;
}

export default function NotificationCarousel({
  items,
  isLoading = false,
  isAdmin = false,
  onNewAnnouncement,
  onTogglePin,
  onDelete,
  className,
}: NotificationCarouselProps) {
  const { t } = useI18n();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);

  const checkScrollability = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
  }, []);

  useEffect(() => {
    checkScrollability();
    const el = carouselRef.current;
    if (!el) return;

    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability);

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [checkScrollability, items, isLoading]);

  const handleScroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const scrollAmount = Math.max(320, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleCardClick = (item: NotificationItem) => {
    setSelectedItem(item);
  };

  const handleTogglePinAction = async () => {
    if (!selectedItem || !onTogglePin) return;
    setIsActionPending(true);
    try {
      await onTogglePin(selectedItem.id, !!selectedItem.isPinned);
      setSelectedItem((prev) =>
        prev ? { ...prev, isPinned: !prev.isPinned } : null
      );
    } finally {
      setIsActionPending(false);
    }
  };

  const handleDeleteAction = async () => {
    if (!selectedItem || !onDelete) return;
    if (!confirm(t("dashboard.delete") + "?")) return;
    setIsActionPending(true);
    try {
      await onDelete(selectedItem.id);
      setSelectedItem(null);
    } finally {
      setIsActionPending(false);
    }
  };

  const SelectedIcon = selectedItem ? getNotificationIcon(selectedItem.type) : null;

  return (
    <section className={cn("space-y-4", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#f3f4f6]">
            {t("dashboard.notifications")}
          </h2>
          <p className="text-xs text-[#86868b] mt-0.5">
            Official announcements, community requests, and school updates.
          </p>
        </div>

        {/* Actions: Admin create */}
        <div className="flex items-center gap-2">
          {isAdmin && onNewAnnouncement && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNewAnnouncement}
              className="rounded-full px-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              {t("dashboard.newAnnouncement")}
            </Button>
          )}
        </div>
      </div>

      {/* Carousel Track */}
      {isLoading ? (
        <div className="flex items-center gap-5 overflow-hidden py-1">
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
          <NotificationCardSkeleton />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-3">
          <div
            ref={carouselRef}
            tabIndex={0}
            aria-label="Announcements feed"
            className="flex items-stretch gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline-none"
          >
            {items.map((item, index) => (
              <NotificationCard
                key={item.id}
                item={item}
                onClick={handleCardClick}
                isFeatured={index === 0 && item.isPinned}
              />
            ))}
            <div className="w-3 flex-shrink-0" aria-hidden="true" />
          </div>

          {/* Apple Store Carousel Navigation Buttons (Bottom Right, matching reference image) */}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              aria-label={t("dashboard.prevNotifications")}
              className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              aria-label={t("dashboard.nextNotifications")}
              className="w-9 h-9 rounded-full bg-white/[0.08] hover:bg-white/20 border border-white/10 text-white flex items-center justify-center transition-all disabled:opacity-20 disabled:pointer-events-none shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-10 rounded-[28px] bg-[#13151b] border border-white/[0.08] text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#9ca3af] mb-3">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-[#f3f4f6]">
            {t("dashboard.allCaughtUp")}
          </h3>
          <p className="mt-1 text-xs text-[#86868b] max-w-sm">
            {t("dashboard.allCaughtUpSub")}
          </p>
          {isAdmin && onNewAnnouncement && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onNewAnnouncement}
              className="mt-4 rounded-full"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t("dashboard.createAnnouncement")}
            </Button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                {SelectedIcon && (
                  <div className="p-1 rounded-md bg-white/[0.05] border border-white/10 text-white">
                    <SelectedIcon className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="text-[11px] uppercase font-semibold tracking-wider text-[#9ca3af]">
                  {selectedItem.label}
                </span>
                {selectedItem.isPinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-[#e5b869] bg-[#c89542]/15 border border-[#c89542]/30 px-2.5 py-0.5 rounded-full">
                    <Pin className="w-2.5 h-2.5 fill-current" />
                    {t("dashboard.pinned")}
                  </span>
                )}
              </div>

              <div className="text-xs text-[#6b7280]">
                {selectedItem.authorName && (
                  <span>By {selectedItem.authorName} • </span>
                )}
                <span>{selectedItem.date}</span>
              </div>
            </div>

            <div className="text-[#d1d5db] text-sm leading-relaxed whitespace-pre-line">
              {selectedItem.rawContent || selectedItem.summary}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] flex-wrap gap-2">
              {isAdmin && (onTogglePin || onDelete) ? (
                <div className="flex items-center gap-2">
                  {onTogglePin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={isActionPending}
                      onClick={handleTogglePinAction}
                    >
                      <Pin className="w-3.5 h-3.5 mr-1" />
                      {selectedItem.isPinned
                        ? t("dashboard.unpin")
                        : t("dashboard.pin")}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={isActionPending}
                      onClick={handleDeleteAction}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {t("dashboard.delete")}
                    </Button>
                  )}
                </div>
              ) : (
                <div />
              )}

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="rounded-full"
              >
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
