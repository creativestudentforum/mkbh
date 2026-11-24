"use client";

import { cn, getInitials, getAvatarUrl } from "@/lib/utils";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export default function Avatar({
  src,
  name,
  size = "md",
  className,
}: AvatarProps) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  const imgSizes = {
    sm: 32,
    md: 40,
    lg: 56,
    xl: 80,
  };

  const avatarUrl = getAvatarUrl(src ?? null);

  if (avatarUrl) {
    return (
      <div
        className={cn(
          "relative rounded-full overflow-hidden ring-1 ring-white/10 flex-shrink-0 bg-[#14161d]",
          sizes[size],
          className
        )}
      >
        <Image
          src={avatarUrl}
          alt={name}
          width={imgSizes[size]}
          height={imgSizes[size]}
          className="object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-medium bg-[#1a1d25] text-[#f3f4f6] border border-white/10 flex-shrink-0 select-none",
        sizes[size],
        className
      )}
    >
      {getInitials(name || "U")}
    </div>
  );
}
