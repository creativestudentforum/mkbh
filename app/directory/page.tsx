"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import ProfileCard from "@/components/molecules/ProfileCard";
import SearchBar from "@/components/molecules/SearchBar";
import { ProfileCardSkeleton } from "@/components/atoms/Skeleton";
import Modal from "@/components/atoms/Modal";
import Avatar from "@/components/atoms/Avatar";
import { createClient } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import type { AlumniDirectoryProfile } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useDebounce } from "@/lib/hooks";
import { sanitizeSearchQuery } from "@/lib/utils";
import { Briefcase, MapPin, GraduationCap, Phone, Users, Globe } from "lucide-react";
import { FacebookIcon, LinkedinIcon } from "@/components/atoms/SocialIcons";
import Link from "next/link";

export default function DirectoryPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<AlumniDirectoryProfile | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["directory", debouncedSearch, batchFilter, deptFilter],
    queryFn: async () => {
      let query = supabase
        .from("alumni_directory")
        .select("id, full_name, batch, department, avatar_url, profession, company, city, country, linkedin_url, blood_group, phone, bio, facebook_url, website_url, created_at, is_featured, achievement")
        .order("full_name")
        .limit(72);
      const sanitizedSearch = sanitizeSearchQuery(debouncedSearch);
      if (sanitizedSearch) { query = query.or(`full_name.ilike.%${sanitizedSearch}%,company.ilike.%${sanitizedSearch}%,batch.ilike.%${sanitizedSearch}%,department.ilike.%${sanitizedSearch}%,profession.ilike.%${sanitizedSearch}%,city.ilike.%${sanitizedSearch}%`); }
      if (batchFilter) { query = query.eq("batch", batchFilter); }
      if (deptFilter) { query = query.eq("department", deptFilter); }
      const { data } = await query;
      return data as AlumniDirectoryProfile[];
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
    <DashboardShell title={t("nav.directory")}>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 slide-up stagger-1">
          <div>
            <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">{t("directory.title")}</h2>
            <p className="text-[#777] text-[14px]">{t("directory.subtitle")} ({profiles?.length || 0}{profiles?.length === 72 ? "+" : ""})</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t("directory.search")} /></div>
            <div className="flex gap-2">
              <select value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)} className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#a0a0a0] px-3 py-2.5 focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] hover:border-[rgba(255,255,255,0.14)] transition-all appearance-none cursor-pointer">
                <option value="">{t("directory.allBatches")}</option>
                {batches.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
              <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="bg-[#141414] border border-[rgba(255,255,255,0.08)] rounded-lg text-[13px] text-[#a0a0a0] px-3 py-2.5 focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] hover:border-[rgba(255,255,255,0.14)] transition-all appearance-none cursor-pointer">
                <option value="">{t("directory.allGroups")}</option>
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
                <p className="text-[#666] mb-1">{t("directory.noFound")}</p>
                <p className="text-[11px] text-[#444]">{t("directory.adjust")}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedProfile} onClose={() => setSelectedProfile(null)} title={t("directory.profile")} size="lg">
        {selectedProfile && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Avatar src={selectedProfile.avatar_url} name={selectedProfile.full_name} size="xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="text-[18px] font-bold text-[#fafafa]">{selectedProfile.full_name}</h3>
                </div>
                <p className="text-[#FF6363] font-medium text-[13px]">{selectedProfile.profession || "Alumni"}{selectedProfile.company && ` @ ${selectedProfile.company}`}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Contact Info</h4>
                <div className="space-y-2">
                  {selectedProfile.phone && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Phone className="w-4 h-4 text-[#555] flex-shrink-0" /><a href={`tel:${selectedProfile.phone}`} className="hover:text-[#FF6363] transition-colors">{selectedProfile.phone}</a></div>)}
                  {(selectedProfile.city || selectedProfile.country) && (<div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><MapPin className="w-4 h-4 text-[#555] flex-shrink-0" />{[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ")}</div>)}
                  {!selectedProfile.phone && <p className="text-[13px] text-[#555]">Phone hidden by privacy settings.</p>}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Academic Info</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><GraduationCap className="w-4 h-4 text-[#555] flex-shrink-0" />{selectedProfile.batch ? <Link href={`/batches/${encodeURIComponent(selectedProfile.batch)}`} className="hover:text-[#FF6363] transition-colors">Batch {selectedProfile.batch}</Link> : <span>Batch N/A</span>}</div>
                  <div className="flex items-center gap-2 text-[13px] text-[#a0a0a0]"><Briefcase className="w-4 h-4 text-[#555] flex-shrink-0" /><span>{selectedProfile.department || "N/A"}</span></div>
                </div>
              </div>
            </div>
            {selectedProfile.bio && (
              <div className="space-y-2 pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Bio</h4>
                <p className="text-[13px] text-[#a0a0a0] leading-relaxed">{selectedProfile.bio}</p>
              </div>
            )}
            <div className="space-y-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
              <h4 className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Social Links</h4>
              <div className="flex gap-3 flex-wrap">
                {selectedProfile.linkedin_url && (<Link href={selectedProfile.linkedin_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><LinkedinIcon className="w-5 h-5" /></Link>)}
                {selectedProfile.facebook_url && (<Link href={selectedProfile.facebook_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><FacebookIcon className="w-5 h-5" /></Link>)}
                {selectedProfile.website_url && (<Link href={selectedProfile.website_url} target="_blank" className="p-2.5 rounded-lg bg-[rgba(255,255,255,0.04)] text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.08)] transition-colors"><Globe className="w-5 h-5" /></Link>)}
                {!selectedProfile.linkedin_url && !selectedProfile.facebook_url && !selectedProfile.website_url && (<p className="text-[13px] text-[#555]">No public social links provided.</p>)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
