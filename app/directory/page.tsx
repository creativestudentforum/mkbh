"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import ProfileCard from "@/components/molecules/ProfileCard";
import SearchBar from "@/components/molecules/SearchBar";
import { ProfileCardSkeleton } from "@/components/atoms/Skeleton";
import Modal from "@/components/atoms/Modal";
import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import { createClient } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useDebounce } from "@/lib/hooks";
import { Briefcase, MapPin, GraduationCap, Globe, Phone, Mail, Users } from "lucide-react";
import { FacebookIcon, LinkedinIcon, TwitterIcon } from "@/components/atoms/SocialIcons";
import Link from "next/link";

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["directory", debouncedSearch],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").eq("status", "approved").order("full_name");
      if (debouncedSearch) { query = query.or(`full_name.ilike.%${debouncedSearch}%,current_company.ilike.%${debouncedSearch}%,batch.ilike.%${debouncedSearch}%,department.ilike.%${debouncedSearch}%,job_title.ilike.%${debouncedSearch}%`); }
      const { data } = await query;
      return data as Profile[];
    },
  });

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p) => {
      if (batchFilter && p.batch !== batchFilter) return false;
      if (deptFilter && p.department !== deptFilter) return false;
      return true;
    });
  }, [profiles, batchFilter, deptFilter]);

  const batches = useMemo(() => {
    if (!profiles) return [];
    const set = new Set(profiles.map((p) => p.batch).filter(Boolean));
    return Array.from(set).sort();
  }, [profiles]);

  const departments = useMemo(() => {
    if (!profiles) return [];
    const set = new Set(profiles.map((p) => p.department).filter(Boolean));
    return Array.from(set).sort();
  }, [profiles]);

  return (
    <DashboardShell title="Alumni Directory">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 slide-up stagger-1">
          <div>
            <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">Directory</h2>
            <p className="text-[#777] text-[14px]">Connect with {profiles?.length || 0} fellow alumni</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, company, batch, or department..." /></div>
            <div className="flex gap-2">
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#a0a0a0] px-3 py-2.5 focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] hover:border-[rgba(255,255,255,0.14)] transition-all appearance-none cursor-pointer">
                <option value="">All Batches</option>
                {batches.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#a0a0a0] px-3 py-2.5 focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] hover:border-[rgba(255,255,255,0.14)] transition-all appearance-none cursor-pointer">
                <option value="">All Departments</option>
                {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
          </div>
          {(batchFilter || deptFilter) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[#555]">Filters:</span>
              {batchFilter && (<button onClick={() => setBatchFilter("")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[rgba(255,99,99,0.06)] text-[#FF6363] text-[11px] border border-[rgba(255,99,99,0.12)] hover:bg-[rgba(255,99,99,0.1)] transition-colors">Batch: {batchFilter}<span className="ml-1">×</span></button>)}
              {deptFilter && (<button onClick={() => setDeptFilter("")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[rgba(255,99,99,0.06)] text-[#FF6363] text-[11px] border border-[rgba(255,99,99,0.12)] hover:bg-[rgba(255,99,99,0.1)] transition-colors">Dept: {deptFilter}<span className="ml-1">×</span></button>)}
              <button onClick={() => { setBatchFilter(""); setDeptFilter(""); }} className="text-[11px] text-[#555] hover:text-[#a0a0a0] transition-colors">Clear all</button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => (<ProfileCardSkeleton key={i} />))}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 slide-up stagger-2">
            {filteredProfiles.map((profile) => (<ProfileCard key={profile.id} profile={profile} onClick={() => setSelectedProfile(profile)} />))}
            {filteredProfiles.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-4"><Users className="w-8 h-8 text-[#444]" /></div>
                <p className="text-[#666] mb-1">No alumni found</p>
                <p className="text-[11px] text-[#444]">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedProfile} onClose={() => setSelectedProfile(null)} title="Alumni Profile" size="lg">
        {selectedProfile && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar src={selectedProfile.avatar_url} name={selectedProfile.full_name} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-[18px] font-bold text-[#fafafa]">{selectedProfile.full_name}</h3>
                  {selectedProfile.role === "admin" && (<Badge variant="info">Admin</Badge>)}
                </div>
                <p className="text-[#FF6363] font-medium text-[13px]">{selectedProfile.job_title}{selectedProfile.current_company && ` @ ${selectedProfile.current_company}`}</p>
                {selectedProfile.bio && (<p className="mt-3 text-[#a0a0a0] text-[13px] leading-relaxed">{selectedProfile.bio}</p>)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Contact Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Mail className="w-4 h-4 text-[#555] flex-shrink-0" /><a href={`mailto:${selectedProfile.email}`} className="hover:text-[#FF6363] truncate transition-colors">{selectedProfile.email}</a></div>
                  {selectedProfile.phone && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Phone className="w-4 h-4 text-[#555] flex-shrink-0" /><a href={`tel:${selectedProfile.phone}`} className="hover:text-[#FF6363] transition-colors">{selectedProfile.phone}</a></div>)}
                  {selectedProfile.location && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><MapPin className="w-4 h-4 text-[#555] flex-shrink-0" />{selectedProfile.location}</div>)}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Academic Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><GraduationCap className="w-4 h-4 text-[#555] flex-shrink-0" /><span>Batch {selectedProfile.batch || "N/A"}</span></div>
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Briefcase className="w-4 h-4 text-[#555] flex-shrink-0" /><span>{selectedProfile.department || "N/A"}</span></div>
                </div>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Social Links</h4>
              <div className="flex gap-3 flex-wrap">
                {selectedProfile.linkedin_url && (<Link href={selectedProfile.linkedin_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><LinkedinIcon className="w-5 h-5" /></Link>)}
                {selectedProfile.facebook_url && (<Link href={selectedProfile.facebook_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><FacebookIcon className="w-5 h-5" /></Link>)}
                {selectedProfile.twitter_url && (<Link href={selectedProfile.twitter_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><TwitterIcon className="w-5 h-5" /></Link>)}
                {selectedProfile.website_url && (<Link href={selectedProfile.website_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><Globe className="w-5 h-5" /></Link>)}
                {!selectedProfile.linkedin_url && !selectedProfile.facebook_url && !selectedProfile.twitter_url && !selectedProfile.website_url && (<p className="text-[13px] text-[#555]">No social links provided.</p>)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
