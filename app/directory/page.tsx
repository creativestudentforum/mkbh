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
import { Briefcase, MapPin, GraduationCap, Phone, Users, Globe, QrCode, ShieldCheck } from "lucide-react";
import { FacebookIcon, LinkedinIcon } from "@/components/atoms/SocialIcons";
import Link from "next/link";

export default function DirectoryPage() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProfile, setSelectedProfile] = useState<AlumniDirectoryProfile | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const supabase = createClient();
  const PAGE_SIZE = 12;

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["directory", debouncedSearch, batchFilter, deptFilter],
    queryFn: async () => {
      let query = supabase
        .from("alumni_directory")
        .select("id, public_code, full_name, batch, department, avatar_url, profession, company, city, country, linkedin_url, blood_group, phone, bio, facebook_url, website_url, created_at, is_featured, achievement")
        .order("full_name")
        .limit(100);
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

  const totalPages = Math.ceil(filteredProfiles.length / PAGE_SIZE) || 1;
  const paginatedProfiles = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProfiles.slice(start, start + PAGE_SIZE);
  }, [filteredProfiles, currentPage]);

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const verificationUrl = selectedProfile?.public_code ? `${siteUrl}/verify/${selectedProfile.public_code}` : "";
  const qrUrl = verificationUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=128x128&margin=0&data=${encodeURIComponent(verificationUrl)}` : "";

  return (
    <DashboardShell title={t("nav.directory")}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight mb-1">
              {t("directory.title")}
            </h2>
            <p className="text-sm text-[#9ca3af]">
              {t("directory.subtitle")} ({profiles?.length || 0}{profiles?.length === 72 ? "+" : ""})
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
                placeholder={t("directory.search")}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={batchFilter}
                onChange={(e) => { setBatchFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#0e1015] border border-white/10 rounded-lg text-sm text-[#f3f4f6] px-3 py-2 focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c] hover:border-white/20 transition-colors cursor-pointer"
              >
                <option value="">{t("directory.allBatches")}</option>
                {batches.map((b) => (<option key={b} value={b}>{b}</option>))}
              </select>
              <select
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
                className="bg-[#0e1015] border border-white/10 rounded-lg text-sm text-[#f3f4f6] px-3 py-2 focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c] hover:border-white/20 transition-colors cursor-pointer"
              >
                <option value="">{t("directory.allGroups")}</option>
                {departments.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
          </div>

          {(batchFilter || deptFilter) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#6b7280]">Active Filters:</span>
              {batchFilter && (
                <button
                  onClick={() => { setBatchFilter(""); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1a634b]/15 text-[#34d399] text-xs border border-[#22785c]/30 hover:bg-[#1a634b]/25 transition-colors"
                >
                  Batch: {batchFilter}
                  <span className="ml-1">×</span>
                </button>
              )}
              {deptFilter && (
                <button
                  onClick={() => { setDeptFilter(""); setCurrentPage(1); }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1a634b]/15 text-[#34d399] text-xs border border-[#22785c]/30 hover:bg-[#1a634b]/25 transition-colors"
                >
                  Group: {deptFilter}
                  <span className="ml-1">×</span>
                </button>
              )}
              <button
                onClick={() => { setBatchFilter(""); setDeptFilter(""); setCurrentPage(1); }}
                className="text-xs text-[#9ca3af] hover:text-white transition-colors underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (<ProfileCardSkeleton key={i} />))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProfiles.map((profile) => (
                <ProfileCard
                  key={profile.id}
                  profile={profile}
                  onClick={() => setSelectedProfile(profile)}
                />
              ))}
              {filteredProfiles.length === 0 && (
                <div className="col-span-full text-center py-16 bg-[#13151b] border border-white/10 rounded-xl p-8">
                  <div className="w-12 h-12 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto mb-3 text-[#9ca3af]">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-[#f3f4f6]">{t("directory.noFound")}</h3>
                  <p className="text-xs text-[#9ca3af] mt-1">{t("directory.adjust")}</p>
                </div>
              )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-5">
                <p className="text-xs text-[#9ca3af]">
                  Showing <span className="text-[#f3f4f6] font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> to{" "}
                  <span className="text-[#f3f4f6] font-medium">{Math.min(currentPage * PAGE_SIZE, filteredProfiles.length)}</span> of{" "}
                  <span className="text-[#f3f4f6] font-medium">{filteredProfiles.length}</span> alumni
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181b22] border border-white/10 text-[#9ca3af] hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-[#6b7280] px-1">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181b22] border border-white/10 text-[#9ca3af] hover:text-white hover:border-white/20 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
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
                <h3 className="font-serif text-xl font-semibold text-[#f3f4f6] mb-1">{selectedProfile.full_name}</h3>
                <p className="text-[#34d399] font-medium text-xs">
                  {selectedProfile.profession || "Alumni Member"}{selectedProfile.company && ` @ ${selectedProfile.company}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/[0.08]">
              <div className="space-y-2.5">
                <h4 className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">Contact & Location</h4>
                <div className="space-y-2 text-xs">
                  {selectedProfile.phone ? (
                    <div className="flex items-center gap-2 text-[#d1d5db]">
                      <Phone className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
                      <a href={`tel:${selectedProfile.phone}`} className="hover:text-white transition-colors">{selectedProfile.phone}</a>
                    </div>
                  ) : (
                    <p className="text-[#6b7280]">Phone hidden by privacy settings.</p>
                  )}
                  {(selectedProfile.city || selectedProfile.country) && (
                    <div className="flex items-center gap-2 text-[#d1d5db]">
                      <MapPin className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
                      {[selectedProfile.city, selectedProfile.country].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">School Record</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#d1d5db]">
                    <GraduationCap className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
                    {selectedProfile.batch ? (
                      <Link href={`/batches/${encodeURIComponent(selectedProfile.batch)}`} className="text-[#34d399] hover:underline">
                        Batch {selectedProfile.batch}
                      </Link>
                    ) : (
                      <span>Batch N/A</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[#d1d5db]">
                    <Briefcase className="w-3.5 h-3.5 text-[#6b7280] flex-shrink-0" />
                    <span>Group: {selectedProfile.department || "General"}</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedProfile.bio && (
              <div className="rounded-lg bg-[#0e1015] border border-white/[0.08] p-3.5 text-xs text-[#d1d5db] leading-relaxed italic">
                "{selectedProfile.bio}"
              </div>
            )}

            {/* Verification QR section */}
            {verificationUrl && (
              <div className="p-3.5 rounded-lg bg-[#0e1015] border border-white/[0.08] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#1a634b]/20 text-[#34d399] border border-[#22785c]/30 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#f3f4f6]">Official Digital ID Verification</p>
                    <p className="text-[10px] text-[#6b7280]">Public tamper-proof credential URL</p>
                  </div>
                </div>
                <Link
                  href={verificationUrl}
                  target="_blank"
                  className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#181b22] border border-white/10 text-[#d1d5db] hover:text-white hover:border-white/20 transition-colors"
                >
                  Verify →
                </Link>
              </div>
            )}
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
