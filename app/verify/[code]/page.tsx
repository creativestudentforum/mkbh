"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import { createClient } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarDays, CheckCircle, ExternalLink, GraduationCap, Mail, MapPin, Phone, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { use } from "react";

type VerificationResult = {
  full_name: string;
  avatar_url: string | null;
  batch: string;
  department: string;
  verified: boolean;
  email: string | null;
  phone: string | null;
  bio: string | null;
  date_of_birth: string | null;
  profession: string | null;
  company: string | null;
  city: string | null;
  country: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  website_url: string | null;
};

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export default function VerifyMemberPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const supabase = createClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-member", code],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("verify_member", { p_code: code });
      if (error) throw new Error(error.message);
      return ((data || []) as VerificationResult[])[0] || null;
    },
  });

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,99,99,0.04)_0%,transparent_70%)] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(52,211,153,0.035)_0%,transparent_70%)] translate-y-1/3 -translate-x-1/4" />
      </div>

      <Card className="w-full max-w-2xl p-6 sm:p-8 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center mx-auto mb-6">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>

        {isLoading ? (
          <div className="space-y-4 text-center">
            <div className="skeleton h-8 rounded-lg mx-auto w-48" />
            <div className="skeleton h-20 rounded-xl" />
          </div>
        ) : data?.verified && !error ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(52,211,153,0.1)] border border-[rgba(52,211,153,0.18)] flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-[#34D399]" />
              </div>
              <Badge variant="success" className="mb-4"><ShieldCheck className="w-3 h-3 mr-1" />Verified Alumni ID</Badge>
              <div className="flex flex-col items-center gap-3">
                <Avatar src={data.avatar_url} name={data.full_name} size="xl" />
                <div>
                  <h1 className="text-[24px] font-bold text-[#fafafa] tracking-tight">{data.full_name}</h1>
                  <p className="text-[14px] text-[#888] mt-1">
                    Batch {data.batch || "N/A"}{data.department ? ` · ${data.department}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {hasValue(data.bio) && (
              <div className="rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4">
                <p className="text-[13px] text-[#a0a0a0] leading-relaxed text-center">{data.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {hasValue(data.email) && <InfoItem icon={Mail} label="Email" value={data.email} />}
              {hasValue(data.phone) && <InfoItem icon={Phone} label="Phone" value={data.phone} />}
              {hasValue(data.date_of_birth) && <InfoItem icon={CalendarDays} label="Birthday" value={formatDate(data.date_of_birth!)} />}
              {(hasValue(data.profession) || hasValue(data.company)) && <InfoItem icon={Briefcase} label="Work" value={[data.profession, data.company].filter(Boolean).join(" at ")} />}
              {(hasValue(data.city) || hasValue(data.country)) && <InfoItem icon={MapPin} label="Location" value={[data.city, data.country].filter(Boolean).join(", ")} />}
            </div>

            {[data.linkedin_url, data.facebook_url, data.twitter_url, data.website_url].some(hasValue) && (
              <div className="flex flex-wrap justify-center gap-2">
                {hasValue(data.linkedin_url) && <PublicLink href={data.linkedin_url} label="LinkedIn" />}
                {hasValue(data.facebook_url) && <PublicLink href={data.facebook_url} label="Facebook" />}
                {hasValue(data.twitter_url) && <PublicLink href={data.twitter_url} label="Twitter" />}
                {hasValue(data.website_url) && <PublicLink href={data.website_url} label="Website" />}
              </div>
            )}

            <p className="text-[12px] text-[#666] leading-relaxed text-center">Only information this alumni allowed for public QR verification is shown here.</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.18)] flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-9 h-9 text-[#EF4444]" />
            </div>
            <h1 className="text-[22px] font-bold text-[#fafafa] tracking-tight mb-2">Could not verify</h1>
            <p className="text-[13px] text-[#888] leading-relaxed">This code is invalid or the member is not approved.</p>
          </div>
        )}

        <Link href="/login" className="flex justify-center mt-8 text-[12px] text-[#FF6363] hover:text-[#FF4F4F] transition-colors">
          Go to AlumniHub
        </Link>
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4">
      <Icon className="w-4 h-4 text-[#FF6363] mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-[#555] uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-[13px] text-[#e5e5e5] break-words mt-1">{value}</p>
      </div>
    </div>
  );
}

function PublicLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return null;

  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[rgba(255,99,99,0.08)] border border-[rgba(255,99,99,0.16)] px-3 py-2 text-[12px] font-medium text-[#FF8A8A] hover:bg-[rgba(255,99,99,0.12)] transition-colors">
      {label}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
