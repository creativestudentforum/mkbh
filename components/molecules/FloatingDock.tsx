"use client";

import { cn } from "@/lib/utils";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useRef, useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export interface DockItem {
  title: string;
  icon: React.ReactNode;
  href: string;
  onClick?: () => void;
  isActive?: boolean;
}

export interface FloatingDockProps {
  items: DockItem[];
  orientation?: "vertical" | "horizontal";
  desktopClassName?: string;
  mobileClassName?: string;
  className?: string;
  tooltipSide?: "right" | "left" | "top" | "bottom";
  baseSize?: number;
  magnifiedSize?: number;
  distanceRadius?: number;
}

export default function FloatingDock({
  items,
  orientation = "vertical",
  desktopClassName,
  mobileClassName,
  className,
  tooltipSide,
  baseSize = 42,
  magnifiedSize = 74,
  distanceRadius = 150,
}: FloatingDockProps) {
  const effectiveTooltipSide =
    tooltipSide || (orientation === "vertical" ? "right" : "top");

  return (
    <>
      {/* Desktop macOS dock with proximity magnification */}
      <FloatingDockDesktop
        items={items}
        orientation={orientation}
        tooltipSide={effectiveTooltipSide}
        baseSize={baseSize}
        magnifiedSize={magnifiedSize}
        distanceRadius={distanceRadius}
        className={cn(desktopClassName, className)}
      />

      {/* Mobile responsive floating dock */}
      <FloatingDockMobile
        items={items}
        className={cn(mobileClassName, className)}
      />
    </>
  );
}

/* =========================================================
   DESKTOP DOCK (Proximity Magnification with Apple Springs)
   ========================================================= */

export interface DesktopDockProps {
  items: DockItem[];
  orientation?: "vertical" | "horizontal";
  tooltipSide?: "right" | "left" | "top" | "bottom";
  baseSize?: number;
  magnifiedSize?: number;
  distanceRadius?: number;
  className?: string;
}

export function FloatingDockDesktop({
  items,
  orientation = "vertical",
  tooltipSide = "right",
  baseSize = 42,
  magnifiedSize = 74,
  distanceRadius = 150,
  className,
}: DesktopDockProps) {
  const isVertical = orientation === "vertical";
  const mousePos = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => {
        // Track client coordinates relative to orientation continuously
        mousePos.set(isVertical ? e.clientY : e.clientX);
      }}
      onMouseLeave={() => mousePos.set(Infinity)}
      className={cn(
        "hidden md:flex items-center",
        isVertical
          ? "flex-col justify-center py-3 px-2 gap-3 w-fit rounded-3xl"
          : "flex-row justify-center px-3 py-2.5 gap-3 h-fit rounded-2xl",
        /* macOS Frosted Glass Surface */
        "bg-[#141416]/85 backdrop-blur-2xl border border-white/[0.08]",
        "shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_1px_1px_rgba(255,255,255,0.06)_inset]",
        className
      )}
    >
      {items.map((item, idx) => (
        <DockItemContainer
          key={item.href || `${item.title}-${idx}`}
          mousePos={mousePos}
          item={item}
          isVertical={isVertical}
          tooltipSide={tooltipSide}
          baseSize={baseSize}
          magnifiedSize={magnifiedSize}
          distanceRadius={distanceRadius}
        />
      ))}
    </motion.div>
  );
}

/* =========================================================
   INDIVIDUAL DOCK ICON CONTAINER
   ========================================================= */

interface DockItemContainerProps {
  mousePos: MotionValue<number>;
  item: DockItem;
  isVertical: boolean;
  tooltipSide: "right" | "left" | "top" | "bottom";
  baseSize: number;
  magnifiedSize: number;
  distanceRadius: number;
}

export function DockItemContainer({
  mousePos,
  item,
  isVertical,
  tooltipSide,
  baseSize,
  magnifiedSize,
  distanceRadius,
}: DockItemContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [tooltipCoords, setTooltipCoords] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const pathname = usePathname();

  const isCurrentActive =
    item.isActive !== undefined
      ? item.isActive
      : pathname === item.href ||
        (item.href !== "/dashboard" &&
          item.href !== "/" &&
          pathname.startsWith(item.href));

  // Compute Euclidean distance from cursor to icon midpoint continuously
  const distance = useTransform(mousePos, (cursorVal) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds || cursorVal === Infinity) return Infinity;

    if (isVertical) {
      const centerY = bounds.y + bounds.height / 2;
      return cursorVal - centerY;
    } else {
      const centerX = bounds.x + bounds.width / 2;
      return cursorVal - centerX;
    }
  });

  // Scale mappings: hovered reaches magnifiedSize (~74px), neighbors scale progressively less, distant remain at baseSize (42px)
  const sizeTransform = useTransform(
    distance,
    [-distanceRadius, 0, distanceRadius],
    [baseSize, magnifiedSize, baseSize]
  );

  // Icon scale: scales icon inside proportionally from base (1.0) to peak (magnifiedSize / baseSize * 0.75)
  const iconScaleTransform = useTransform(
    distance,
    [-distanceRadius, 0, distanceRadius],
    [1, (magnifiedSize / baseSize) * 0.78, 1]
  );

  // Apple macOS Spring Physics for snappy, fluid response
  const springConfig = {
    mass: 0.1,
    stiffness: 165,
    damping: 14,
  };

  const animatedSize = useSpring(sizeTransform, springConfig);
  const animatedIconScale = useSpring(iconScaleTransform, springConfig);

  const updateTooltipCoords = () => {
    if (ref.current) {
      const bounds = ref.current.getBoundingClientRect();
      switch (tooltipSide) {
        case "right":
          setTooltipCoords({
            top: bounds.top + bounds.height / 2,
            left: bounds.right + 14,
          });
          break;
        case "left":
          setTooltipCoords({
            top: bounds.top + bounds.height / 2,
            left: bounds.left - 14,
          });
          break;
        case "top":
          setTooltipCoords({
            top: bounds.top - 10,
            left: bounds.left + bounds.width / 2,
          });
          break;
        case "bottom":
          setTooltipCoords({
            top: bounds.bottom + 10,
            left: bounds.left + bounds.width / 2,
          });
          break;
      }
    }
  };

  const handleMouseEnter = () => {
    updateTooltipCoords();
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const handleFocus = () => {
    updateTooltipCoords();
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const isLabelVisible = hovered || isFocused;

  const getTooltipStyle = () => {
    if (!tooltipCoords) return {};
    switch (tooltipSide) {
      case "right":
        return {
          position: "fixed" as const,
          top: tooltipCoords.top,
          left: tooltipCoords.left,
          transform: "translateY(-50%)",
        };
      case "left":
        return {
          position: "fixed" as const,
          top: tooltipCoords.top,
          left: tooltipCoords.left,
          transform: "translate(-100%, -50%)",
        };
      case "top":
        return {
          position: "fixed" as const,
          top: tooltipCoords.top,
          left: tooltipCoords.left,
          transform: "translate(-50%, -100%)",
        };
      case "bottom":
        return {
          position: "fixed" as const,
          top: tooltipCoords.top,
          left: tooltipCoords.left,
          transform: "translate(-50%, 0)",
        };
    }
  };

  return (
    <Link
      href={item.href}
      onClick={item.onClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="relative flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] rounded-full group/dock-link"
    >
      <motion.div
        ref={ref}
        style={{
          width: animatedSize,
          height: animatedSize,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        whileTap={{ scale: 0.92 }}
        className={cn(
          /* Circular disc button matching reference image */
          "relative flex items-center justify-center rounded-full cursor-pointer transition-colors duration-150 select-none",
          isCurrentActive
            ? "bg-gradient-to-br from-[#1a2e2b] to-[#122220] text-teal-400 border border-teal-500/40 shadow-[0_0_16px_rgba(20,184,166,0.3)]"
            : "bg-[#242427] hover:bg-[#2c2c31] text-neutral-300 hover:text-white border border-white/[0.08]"
        )}
      >
        {/* Scaled Icon inside circular disc */}
        <motion.div
          style={{
            scale: animatedIconScale,
          }}
          className="flex items-center justify-center pointer-events-none"
        >
          {item.icon}
        </motion.div>

        {/* macOS Active App Indicator Dot */}
        {isCurrentActive && (
          <motion.div
            layoutId="macOSActiveIndicator"
            className={cn(
              "absolute rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.95)] pointer-events-none",
              isVertical
                ? "-left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5"
                : "-bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5"
            )}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 26,
            }}
          />
        )}
      </motion.div>

      {/* Floating Tooltip matching reference image rounded badge */}
      <AnimatePresence>
        {isLabelVisible && tooltipCoords && (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.92,
              x: tooltipSide === "right" ? -8 : tooltipSide === "left" ? 8 : 0,
              y: tooltipSide === "top" ? 8 : tooltipSide === "bottom" ? -8 : 0,
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{
              opacity: 0,
              scale: 0.92,
              x: tooltipSide === "right" ? -4 : tooltipSide === "left" ? 4 : 0,
            }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={getTooltipStyle()}
            className="pointer-events-none z-[99999] whitespace-nowrap px-2.5 py-1 rounded-md text-xs font-medium tracking-tight bg-[#18181b]/95 text-white border border-white/10 shadow-xl backdrop-blur-md"
          >
            {item.title}
          </motion.div>
        )}
      </AnimatePresence>
    </Link>
  );
}

/* =========================================================
   MOBILE DOCK (Touch-optimized floating action / drawer)
   ========================================================= */

export interface MobileDockProps {
  items: DockItem[];
  className?: string;
}

export function FloatingDockMobile({ items, className }: MobileDockProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close when pathname changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className={cn("fixed bottom-6 right-6 z-50 md:hidden", className)}>
      {/* Dim backdrop when open */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>

      {/* Expandable item stack with comfortable touch targets */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col items-end gap-2.5 max-h-[70vh] overflow-y-auto overscroll-contain pr-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((item, idx) => {
              const isCurrentActive =
                item.isActive !== undefined
                  ? item.isActive
                  : pathname === item.href ||
                    (item.href !== "/dashboard" &&
                      item.href !== "/" &&
                      pathname.startsWith(item.href));

              return (
                <motion.div
                  key={item.href || `${item.title}-${idx}`}
                  initial={{ opacity: 0, y: 15, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.9,
                    transition: { delay: (items.length - 1 - idx) * 0.02 },
                  }}
                  transition={{
                    delay: (items.length - 1 - idx) * 0.03,
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                  }}
                  className="flex items-center gap-2.5"
                >
                  <span className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#18181b]/95 border border-white/10 text-white shadow-lg backdrop-blur-md">
                    {item.title}
                  </span>
                  <Link
                    href={item.href}
                    onClick={() => {
                      item.onClick?.();
                      setOpen(false);
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <motion.div
                      whileTap={{ scale: 0.9 }}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shadow-lg border transition-colors",
                        isCurrentActive
                          ? "bg-teal-950/80 text-teal-400 border-teal-500/40 shadow-teal-500/20"
                          : "bg-[#242427] text-white border-white/10 active:bg-neutral-700"
                      )}
                    >
                      {item.icon}
                    </motion.div>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button */}
      <motion.button
        type="button"
        aria-label="Toggle navigation dock"
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.9 }}
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl backdrop-blur-xl border border-white/15 transition-all duration-200",
          open
            ? "bg-neutral-800 text-teal-400 rotate-90"
            : "bg-gradient-to-tr from-[#0D9488] to-[#14B8A6] shadow-[0_8px_25px_rgba(20,184,166,0.45)]"
        )}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
