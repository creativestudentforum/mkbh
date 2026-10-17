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

  return (
    <DashboardShell title="Blood Finder">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Blood Finder</h2>
            <Droplets className="w-5 h-5 text-[#EF4444]" />
          </div>
          <p className="text-[#777] text-[14px]">Find alumni who agreed to share their phone number for urgent blood needs.</p>
        </div>

        <Card className="p-4 sm:p-5 bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.12)] slide-up stagger-2">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[rgba(239,68,68,0.08)] flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#EF4444]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#fafafa] mb-1">Contact directory only</p>
              <p className="text-[12px] text-[#888] leading-relaxed">Medical screening and donation eligibility must be confirmed by the hospital or blood bank.</p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
          <Card className="p-4 h-fit slide-up stagger-3">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-[#555]" />
              <h3 className="text-[14px] font-semibold text-[#fafafa]">Filters</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="blood-group" className="block text-[12px] font-medium text-[#a0a0a0]">Blood group</label>
                <select id="blood-group" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="w-full rounded-lg bg-[#101010] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]">
                  <option value="">All groups</option>
                  {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="block text-[12px] font-medium text-[#a0a0a0]">City</label>
                <select id="city" value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg bg-[#101010] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]">
                  <option value="">All cities</option>
                  {cities.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              <label className="flex items-start gap-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3 text-[12px] text-[#888] leading-relaxed">
                <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="mt-0.5 accent-[#FF6363]" />
                Show available donors only
              </label>

              {(bloodGroup || city || !availableOnly) && (
                <Button type="button" variant="secondary" className="w-full" onClick={() => { setBloodGroup(""); setCity(""); setAvailableOnly(true); }}>
                  Reset Filters
                </Button>
              )}
            </div>
          </Card>

          <div className="space-y-4 slide-up stagger-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <p className="text-[13px] text-[#777]">
                Showing <span className="text-[#fafafa] font-semibold">{filteredDonors.length}</span> donor{filteredDonors.length === 1 ? "" : "s"}
              </p>
              <Badge variant="danger">Voluntary donors</Badge>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-44 rounded-xl" />)}
              </div>
            ) : error ? (
              <Card className="p-8 text-center">
                <p className="text-[13px] text-[#EF4444]">Could not load blood donors.</p>
              </Card>
            ) : filteredDonors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredDonors.map((donor) => (
                  <DonorCard key={donor.id} donor={donor} />
                ))}
              </div>
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3">
                  <Users className="w-7 h-7 text-[#444]" />
                </div>
                <p className="text-[13px] text-[#666] mb-1">No donors found</p>
                <p className="text-[11px] text-[#444]">Try changing the blood group, city, or availability filter.</p>
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
    <Card className="p-5 hover:border-[rgba(255,255,255,0.12)] transition-all">
      <div className="flex items-start gap-4">
        <Avatar src={donor.avatar_url} name={donor.full_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-[14px] font-semibold text-[#fafafa] truncate">{donor.full_name}</h3>
            <Badge variant="danger">{donor.blood_group}</Badge>
            {donor.available ? <Badge variant="success">Available</Badge> : <Badge variant="warning">Recent donation</Badge>}
          </div>

          <div className="space-y-1.5 mt-3">
            {donor.batch && <p className="text-[12px] text-[#777]">Batch {donor.batch}</p>}
            {donor.city && (
              <p className="flex items-center gap-1.5 text-[12px] text-[#777]"><MapPin className="w-3.5 h-3.5 text-[#555]" />{donor.city}</p>
            )}
            {donor.last_donation_date && (
              <p className="text-[11px] text-[#555]">Last donated: {new Date(donor.last_donation_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
            )}
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            <Button size="sm" className="px-3" onClick={() => window.location.href = `tel:${donor.phone}`}>
              <Phone className="w-4 h-4" /> Call
            </Button>
            <a href={getWhatsAppUrl(donor.phone)} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium bg-[rgba(255,255,255,0.06)] text-[#a0a0a0] hover:bg-[rgba(255,255,255,0.1)] hover:text-[#fafafa] transition-all">
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </Card>
  );
}
