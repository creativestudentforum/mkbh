"use client";

import { cn } from "@/lib/utils";
import {
  motion,
  MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface DockGridContextValue {
  mouseX: MotionValue<number>;
  mouseY: MotionValue<number>;
  proximityRadius: number;
  maxScale: number;
  maxLift: number;
  isReducedMotion: boolean;
}

const DockGridContext = createContext<DockGridContextValue | null>(null);

export interface DockGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  proximityRadius?: number;
  maxScale?: number;
  maxLift?: number;
  disabled?: boolean;
}

/**
 * DockGrid
 * Container for a collection of cards that coordinates a macOS dock-style
 * proximity magnification effect across 2D grids and lists.
 */
export function DockGrid({
  children,
  className,
  proximityRadius = 240,
  maxScale = 1.06,
  maxLift = -8,
  disabled = false,
  ...props
}: DockGridProps) {
  const mouseX = useMotionValue(Infinity);
  const mouseY = useMotionValue(Infinity);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Detect prefers-reduced-motion
    const checkMotion = () => {
      const isReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      setIsReducedMotion(isReduced || disabled);
    };

    checkMotion();

    const mediaReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaReduced.addEventListener("change", checkMotion);

    return () => {
      mediaReduced.removeEventListener("change", checkMotion);
    };
  }, [disabled]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isReducedMotion) return;
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  const handleMouseLeave = () => {
    mouseX.set(Infinity);
    mouseY.set(Infinity);
  };

  return (
    <DockGridContext.Provider
      value={{
        mouseX,
        mouseY,
        proximityRadius,
        maxScale,
        maxLift,
        isReducedMotion,
      }}
    >
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </DockGridContext.Provider>
  );
}

export interface DockCardProps {
  children: React.ReactNode;
  className?: string;
  proximityRadius?: number;
  maxScale?: number;
  maxLift?: number;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

/**
 * DockCard
 * Wraps an individual card inside a DockGrid to smoothly scale and lift
 * based on pointer proximity on desktop, AND provides explicit touch-feedback
 * magnification on mobile with zero scroll interference.
 */
export function DockCard({
  children,
  className,
  proximityRadius: overrideRadius,
  maxScale: overrideScale,
  maxLift: overrideLift,
  onClick,
}: DockCardProps) {
  const context = useContext(DockGridContext);
  const ref = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouchActive, setIsTouchActive] = useState(false);

  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const isScrollingRef = useRef(false);

  const proximityRadius = overrideRadius ?? context?.proximityRadius ?? 240;
  const maxScale = overrideScale ?? context?.maxScale ?? 1.06;
  const maxLift = overrideLift ?? context?.maxLift ?? -8;
  const isReducedMotion = context?.isReducedMotion ?? false;

  // Fallback motion values if used outside a DockGrid
  const dummyX = useMotionValue(Infinity);
  const dummyY = useMotionValue(Infinity);
  const mouseX = context?.mouseX ?? dummyX;
  const mouseY = context?.mouseY ?? dummyY;

  // Calculate Euclidean distance from desktop pointer to card perimeter
  const distance = useTransform([mouseX, mouseY], ([x, y]: number[]) => {
    if (x === Infinity || y === Infinity || isReducedMotion || !ref.current) {
      return Infinity;
    }
    const bounds = ref.current.getBoundingClientRect();
    const dx = Math.max(bounds.left - x, 0, x - bounds.right);
    const dy = Math.max(bounds.top - y, 0, y - bounds.bottom);
    return Math.sqrt(dx * dx + dy * dy);
  });

  // Map distance to scale [maxScale -> 1.0]
  const targetScale = useTransform(
    distance,
    [0, proximityRadius],
    [maxScale, 1.0],
    { clamp: true }
  );

  // Map distance to vertical lift [maxLift -> 0]
  const targetY = useTransform(distance, [0, proximityRadius], [maxLift, 0], {
    clamp: true,
  });

  // Apple Spring physics for natural damping and zero sluggishness
  const springConfig = {
    mass: 0.1,
    stiffness: 240,
    damping: 20,
  };

  const animatedScale = useSpring(targetScale, springConfig);
  const animatedY = useSpring(targetY, springConfig);

  // Touch gesture handlers for explicit mobile feedback
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isReducedMotion) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isScrollingRef.current = false;
    setIsTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPos.current || isScrollingRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    // If movement exceeds 8px in any direction, user is scrolling/swiping:
    // immediately cancel preview so normal page scroll or swipe proceeds natively!
    if (dx > 8 || dy > 8) {
      isScrollingRef.current = true;
      setIsTouchActive(false);
    }
  };

  const handleTouchEnd = () => {
    setIsTouchActive(false);
    touchStartPos.current = null;
  };

  const handleTouchCancel = () => {
    setIsTouchActive(false);
    touchStartPos.current = null;
  };

  // If user prefers reduced motion, render standard element without transforms
  if (isReducedMotion) {
    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn("relative h-full", className)}
      >
        {children}
      </div>
    );
  }

  // Active state: touched on mobile, hovered on desktop, or keyboard focused
  const isExplicitlyActive = isTouchActive || isFocused || isHovered;
  const dynamicZIndex = isExplicitlyActive ? 40 : 1;

  return (
    <motion.div
      ref={ref}
      style={{
        scale: isTouchActive || isFocused ? maxScale : animatedScale,
        y: isTouchActive || isFocused ? maxLift : animatedY,
        zIndex: dynamicZIndex,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onClick={onClick}
      className={cn(
        "relative h-full will-change-transform transform-gpu origin-center transition-shadow duration-200",
        isExplicitlyActive && "drop-shadow-[0_16px_28px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
