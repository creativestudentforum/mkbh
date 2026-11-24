"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import AppleFacultyGallery from "@/components/organisms/AppleFacultyGallery";
import SearchBar from "@/components/molecules/SearchBar";
import { createClient } from "@/lib/supabase";
import type { Teacher } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "@/lib/hooks";
import { sanitizeSearchQuery } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export default function TeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers", debouncedSearch],
    queryFn: async () => {
      let query = supabase.from("teachers").select("*").eq("is_active", true).order("full_name");
      const sanitizedSearch = sanitizeSearchQuery(debouncedSearch);
      if (sanitizedSearch) {
        query = query.or(
          `full_name.ilike.%${sanitizedSearch}%,department.ilike.%${sanitizedSearch}%,designation.ilike.%${sanitizedSearch}%,specialization.ilike.%${sanitizedSearch}%`
        );
      }
      const { data } = await query;
      return (data || []) as Teacher[];
    },
  });

  return (
    <DashboardShell title="Faculty Members">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
                Faculty Members
              </h2>
              <GraduationCap className="w-5 h-5 text-accent" />
            </div>
            <p className="text-muted text-[14px]">
              Directory of respected faculty, mentors, and academic leadership.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search faculty by name or subject..."
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 bg-surface animate-pulse rounded-xl border border-border"
              />
            ))}
          </div>
        ) : (
          <AppleFacultyGallery teachers={teachers} />
        )}
      </div>
    </DashboardShell>
  );
}
