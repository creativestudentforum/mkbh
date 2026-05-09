"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import type { Profile } from "@/lib/types";
import { Briefcase, MapPin, GraduationCap } from "lucide-react";

interface ProfileCardProps {
  profile: Profile;
  onClick?: () => void;
}

export default function ProfileCard({ profile, onClick }: ProfileCardProps) {
  return (
    <Card hover onClick={onClick} className="p-5">
      <div className="flex items-start gap-4">
        <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-[#fafafa] font-semibold truncate text-[14px]">
              {profile.full_name}
            </h3>
            {profile.role === "admin" && (
              <Badge variant="info">Admin</Badge>
            )}
          </div>

          {profile.job_title && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#888] mb-1">
              <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-[#555]" />
              <span className="truncate">
                {profile.job_title}
                {profile.current_company && ` at ${profile.current_company}`}
              </span>
            </div>
          )}

          {profile.batch && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#888] mb-1">
              <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-[#555]" />
              <span className="truncate">
                Batch {profile.batch}
                {profile.department && ` • ${profile.department}`}
              </span>
            </div>
          )}

          {profile.location && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#888]">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#555]" />
              <span className="truncate">{profile.location}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
