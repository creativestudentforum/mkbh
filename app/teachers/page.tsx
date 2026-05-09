"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Avatar from "@/components/atoms/Avatar";
import SearchBar from "@/components/molecules/SearchBar";
import { TeacherCardSkeleton } from "@/components/atoms/Skeleton";
import { createClient } from "@/lib/supabase";
import type { Teacher } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@/lib/hooks";
import { BookOpen, Phone, Mail, Globe, Users } from "lucide-react";
import { LinkedinIcon } from "@/components/atoms/SocialIcons";
import Link from "next/link";

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["teachers", debouncedSearch],
    queryFn: async () => {
      let query = supabase.from("teachers").select("*").eq("is_active", true).order("full_name");
      if (debouncedSearch) { query = query.or(`full_name.ilike.%${debouncedSearch}%,department.ilike.%${debouncedSearch}%,designation.ilike.%${debouncedSearch}%,specialization.ilike.%${debouncedSearch}%`); }
      const { data } = await query;
      return data as Teacher[];
    },
  });

  return (
    <DashboardShell title="Teacher Directory">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center slide-up stagger-1">
          <div>
            <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">Faculty Members</h2>
            <p className="text-[#777] text-[14px]">{teachers?.length || 0} faculty members</p>
          </div>
          <div className="w-full sm:w-72"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, department..." /></div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => (<TeacherCardSkeleton key={i} />))}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 slide-up stagger-2">
            {teachers?.map((teacher) => (
              <Card key={teacher.id} className="p-5 sm:p-6 flex flex-col h-full group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <Avatar src={teacher.avatar_url} name={teacher.full_name} size="lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#34D399] border-2 border-[#141414]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-bold text-[#fafafa] leading-tight mb-0.5 group-hover:text-[#FF8A63] transition-colors">{teacher.full_name}</h3>
                    <p className="text-[13px] font-medium text-[#FF6363]">{teacher.designation}</p>
                    <div className="flex items-center gap-1 mt-1 text-[11px] text-[#666]"><BookOpen className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{teacher.department}</span></div>
                  </div>
                </div>
                {teacher.bio && (<p className="text-[13px] text-[#888] mb-4 line-clamp-2 leading-relaxed flex-grow">{teacher.bio}</p>)}
                {teacher.specialization && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-[#555] uppercase tracking-wider mb-2">Specialization</p>
                    <div className="flex flex-wrap gap-1.5">
                      {teacher.specialization.split(",").map((spec, i) => (<span key={i} className="px-2.5 py-1 rounded-md bg-[rgba(255,99,99,0.06)] text-[11px] text-[#FF8A63] border border-[rgba(255,99,99,0.1)] font-medium">{spec.trim()}</span>))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] mt-auto space-y-2">
                  {teacher.email && (<a href={`mailto:${teacher.email}`} className="flex items-center gap-2 text-[13px] text-[#777] hover:text-[#FF6363] transition-colors"><Mail className="w-4 h-4 flex-shrink-0" /><span className="truncate">{teacher.email}</span></a>)}
                  {teacher.phone && (<a href={`tel:${teacher.phone}`} className="flex items-center gap-2 text-[13px] text-[#777] hover:text-[#FF6363] transition-colors"><Phone className="w-4 h-4 flex-shrink-0" /><span className="truncate">{teacher.phone}</span></a>)}
                  {(teacher.linkedin_url || teacher.website_url) && (
                    <div className="flex gap-3 mt-3 pt-2">
                      {teacher.linkedin_url && (<Link href={teacher.linkedin_url} target="_blank" className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#555] hover:text-[#FF6363] hover:bg-[rgba(255,255,255,0.06)] transition-all"><LinkedinIcon className="w-4 h-4" /></Link>)}
                      {teacher.website_url && (<Link href={teacher.website_url} target="_blank" className="p-2 rounded-lg bg-[rgba(255,255,255,0.03)] text-[#555] hover:text-[#FF6363] hover:bg-[rgba(255,255,255,0.06)] transition-all"><Globe className="w-4 h-4" /></Link>)}
                    </div>
                  )}
                </div>
              </Card>
            ))}
            {teachers?.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-[#444]" /></div>
                <p className="text-[#666]">No teachers found</p>
                <p className="text-[11px] text-[#444] mt-1">Try adjusting your search</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
