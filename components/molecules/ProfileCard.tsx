"use client";

import Badge from "@/components/atoms/Badge";
import type { AlumniDirectoryProfile, Profile } from "@/lib/types";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { Briefcase, MapPin, GraduationCap, Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProfileCardProps {
  profile: Profile | AlumniDirectoryProfile;
  onClick?: () => void;
}

export default function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const profession = profile.profession || "";
  const company = profile.company || "";
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const isAdmin = "role" in profile && profile.role === "admin";

  const eyebrow = profile.batch
    ? `Batch ${profile.batch}${profile.department ? ` • ${profile.department}` : ""}`
    : "Alumni Network";

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className="group relative flex flex-col justify-between text-left select-none h-[420px] rounded-[28px] p-6 sm:p-7 cursor-pointer bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922] transition-all duration-300 ease-out shadow-sm hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
    >
      {/* Top: Eyebrow + Full Name + Description */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-semibold text-[#86868b] tracking-tight uppercase truncate">
            {eyebrow}
          </span>
          {isAdmin && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#22785c]/20 text-[#34d399] border border-[#22785c]/40">
              Admin
            </span>
          )}
        </div>

        <h3 className="text-[22px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.2] line-clamp-1 group-hover:text-white transition-colors">
          {profile.full_name}
        </h3>

        <div className="mt-2 space-y-1">
          {profession ? (
            <p className="text-[13px] text-[#86868b] leading-relaxed line-clamp-1">
              {profession}
              {company ? ` at ${company}` : ""}
            </p>
          ) : (
            <p className="text-[13px] text-[#86868b] leading-relaxed line-clamp-1">
              Distinguished Alumnus
            </p>
          )}

          {location ? (
            <p className="text-xs text-[#6b7280] flex items-center gap-1 truncate">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span>{location}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Bottom: Apple Style Portrait Photo with Floating Plus Button */}
      <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-gradient-to-t from-black/60 to-black/10 border border-white/[0.08] mt-4 flex items-end justify-center">
        {profile.avatar_url ? (
          <Image
            src={getOptimizedImageUrl(profile.avatar_url, {
              width: 500,
              crop: "fill",
            })}
            alt={profile.full_name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] text-[#9ca3af]">
            <span className="text-4xl font-serif">{profile.full_name.charAt(0)}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#6b7280] mt-1">
              Alumni Member
            </span>
          </div>
        )}

        {/* Floating Apple Plus Button */}
        <div
          aria-label={`View ${profile.full_name}'s profile`}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-lg z-10"
        >
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>
    </div>
  );
}
