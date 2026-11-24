"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { BloodDonor } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Droplets, MapPin, Phone, Search, ShieldAlert, Users } from "lucide-react";
import { useMemo, useState } from "react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function getWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withoutLeadingZero = digits.startsWith("0") ? digits.slice(1) : digits;
  const number = withoutLeadingZero.startsWith("880") ? withoutLeadingZero : `880${withoutLeadingZero}`;
  return `https://wa.me/${number}`;
}

export default function BloodPage() {
  const supabase = createClient();
  const [bloodGroup, setBloodGroup] = useState("");
  const [city, setCity] = useState("");
  const [availableOnly, setAvailableOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  const { data: donors, isLoading, error } = useQuery({
    queryKey: ["blood-donors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blood_donors")
        .select("*")
        .order("blood_group")
        .order("full_name");

      if (error) throw new Error(error.message);
      return (data || []) as BloodDonor[];
    },
  });

  const cities = useMemo(() => {
    const set = new Set((donors || []).map((donor) => donor.city).filter(Boolean));
    return Array.from(set).sort();
  }, [donors]);

  const filteredDonors = useMemo(() => {
    return (donors || []).filter((donor) => {
      if (bloodGroup && donor.blood_group !== bloodGroup) return false;
      if (city && donor.city !== city) return false;
      if (availableOnly && !donor.available) return false;
      return true;
    });
  }, [donors, bloodGroup, city, availableOnly]);

  const totalPages = Math.ceil(filteredDonors.length / PAGE_SIZE) || 1;
  const paginatedDonors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredDonors.slice(start, start + PAGE_SIZE);
  }, [filteredDonors, currentPage]);

  return (
    <DashboardShell title="Blood Finder">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight mb-1">
            Emergency Blood Finder
          </h2>
          <p className="text-sm text-[#9ca3af]">
            Directory of alumni volunteers who consented to share contact numbers for urgent blood donation needs.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-red-500/[0.04] border border-red-500/20 flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[#9ca3af] leading-relaxed">
            <span className="font-semibold text-red-300">Community Directory Notice:</span> This tool facilitates peer contact only. All medical screening, cross-matching, and donation eligibility must be conducted through certified hospitals or licensed blood banks.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
          <Card className="p-4 sm:p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-[#6b7280]" />
              <h3 className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Search Filters</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="blood-group" className="block text-xs font-medium text-[#9ca3af]">Blood Group</label>
                <select
                  id="blood-group"
                  value={bloodGroup}
                  onChange={(e) => { setBloodGroup(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg bg-[#0e1015] border border-white/10 text-[#f3f4f6] px-3 py-2 text-sm focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c]"
                >
                  <option value="">All Blood Groups</option>
                  {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="city" className="block text-xs font-medium text-[#9ca3af]">City / Location</label>
                <select
                  id="city"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setCurrentPage(1); }}
                  className="w-full rounded-lg bg-[#0e1015] border border-white/10 text-[#f3f4f6] px-3 py-2 text-sm focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c]"
                >
                  <option value="">All Locations</option>
                  {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              <label className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] p-3 text-xs text-[#9ca3af] leading-relaxed cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => { setAvailableOnly(e.target.checked); setCurrentPage(1); }}
                  className="mt-0.5 accent-[#1a634b]"
                />
                <span>Available donors only</span>
              </label>

              {(bloodGroup || city || !availableOnly) && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => { setBloodGroup(""); setCity(""); setAvailableOnly(true); setCurrentPage(1); }}
                >
                  Reset Filters
                </Button>
              )}
            </div>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-[#9ca3af]">
                Showing <span className="text-[#f3f4f6] font-semibold">{filteredDonors.length}</span> volunteer donor{filteredDonors.length === 1 ? "" : "s"}
              </p>
              <Badge variant="danger">Verified Volunteer Registry</Badge>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-44 rounded-xl" />)}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-xs text-red-400">Could not load blood donor volunteers.</p>
              </Card>
            ) : filteredDonors.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paginatedDonors.map((donor) => (
                    <DonorCard key={donor.id} donor={donor} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                    <p className="text-xs text-[#6b7280]">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181b22] border border-white/10 text-[#9ca3af] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        Previous
                      </button>
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#181b22] border border-white/10 text-[#9ca3af] hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-[#9ca3af]">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-[#f3f4f6]">No donors matched your filter</p>
                <p className="text-xs text-[#9ca3af] mt-1">Try resetting the blood group or location filter.</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function DonorCard({ donor }: { donor: BloodDonor }) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between">
      <div className="flex items-start gap-3.5">
        <Avatar src={donor.avatar_url} name={donor.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="font-serif text-base font-semibold text-[#f3f4f6] truncate">{donor.full_name}</h4>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-red-500/15 text-red-300 border border-red-500/30">
              {donor.blood_group}
            </span>
            {donor.available ? (
              <Badge variant="success">Available</Badge>
            ) : (
              <Badge variant="warning">Recent Donor</Badge>
            )}
          </div>

          <div className="space-y-1 mt-2 text-xs text-[#9ca3af]">
            {donor.batch && <p>Batch {donor.batch}</p>}
            {donor.city && (
              <p className="flex items-center gap-1 text-[#6b7280]">
                <MapPin className="w-3.5 h-3.5" />
                <span>{donor.city}</span>
              </p>
            )}
            {donor.last_donation_date && (
              <p className="text-[11px] text-[#6b7280]">
                Last donated: {new Date(donor.last_donation_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-3 border-t border-white/[0.06]">
        <Button size="sm" className="flex-1" onClick={() => window.location.href = `tel:${donor.phone}`}>
          <Phone className="w-3.5 h-3.5 mr-1.5" /> Call
        </Button>
        <a
          href={getWhatsAppUrl(donor.phone)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#181b22] border border-white/10 text-[#d1d5db] hover:text-white hover:border-white/20 transition-colors flex-1"
        >
          WhatsApp
        </a>
      </div>
    </Card>
  );
}
