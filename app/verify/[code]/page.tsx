"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Image from "next/image";
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
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] flex items-center justify-center p-4">
      <Card className="w-full max-w-xl p-6 sm:p-8 bg-[#13151b] border border-white/10 shadow-2xl">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center mx-auto mb-5 relative shadow-md">
          <Image
            src="/logo.png"
            alt="M.K.B.H High School"
            fill
            className="object-cover"
            sizes="56px"
            priority
          />
        </div>

        {isLoading ? (
          <div className="space-y-4 text-center py-6">
            <div className="skeleton h-6 rounded-md mx-auto w-44" />
            <div className="skeleton h-24 rounded-xl" />
          </div>
        ) : data?.verified && !error ? (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1a634b]/20 border border-[#22785c]/35 text-[#34d399] text-xs font-semibold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4" />
                Verified Alumni Member
              </div>

              <div className="flex flex-col items-center gap-3">
                <Avatar src={data.avatar_url} name={data.full_name} size="xl" />
                <div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
                    {data.full_name}
                  </h1>
                  <p className="text-sm text-[#9ca3af] mt-1">
                    Batch {data.batch || "N/A"}{data.department ? ` · ${data.department}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {hasValue(data.bio) && (
              <div className="rounded-lg bg-[#0e1015] border border-white/[0.08] p-4">
                <p className="text-xs text-[#d1d5db] leading-relaxed text-center italic">{data.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/[0.08]">
              {hasValue(data.email) && <InfoItem icon={Mail} label="Email" value={data.email} />}
              {hasValue(data.phone) && <InfoItem icon={Phone} label="Phone" value={data.phone} />}
              {hasValue(data.date_of_birth) && <InfoItem icon={CalendarDays} label="Birthday" value={formatDate(data.date_of_birth!)} />}
              {(hasValue(data.profession) || hasValue(data.company)) && <InfoItem icon={Briefcase} label="Work" value={[data.profession, data.company].filter(Boolean).join(" at ")} />}
              {(hasValue(data.city) || hasValue(data.country)) && <InfoItem icon={MapPin} label="Location" value={[data.city, data.country].filter(Boolean).join(", ")} />}
            </div>

            {[data.linkedin_url, data.facebook_url, data.twitter_url, data.website_url].some(hasValue) && (
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {hasValue(data.linkedin_url) && (
                  <SocialLink href={data.linkedin_url!} label="LinkedIn" />
                )}
                {hasValue(data.facebook_url) && (
                  <SocialLink href={data.facebook_url!} label="Facebook" />
                )}
                {hasValue(data.website_url) && (
                  <SocialLink href={data.website_url!} label="Website" />
                )}
              </div>
            )}

            <div className="pt-4 border-t border-white/[0.08] text-center">
              <p className="text-[11px] text-[#6b7280]">
                Official MKBH High School Alumni Registry Verification Record
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto text-red-400">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold text-[#f3f4f6]">Verification Record Not Found</h2>
              <p className="text-xs text-[#9ca3af] mt-1 max-w-sm mx-auto">
                The member verification code is invalid, expired, or the member profile is inactive.
              </p>
            </div>
            <Link href="/" className="inline-block pt-2">
              <span className="text-xs text-[#34d399] hover:underline">Return to Home</span>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string | null | undefined }) {
  return (
    <div className="p-2.5 rounded-lg bg-[#0e1015] border border-white/[0.06] flex items-center gap-2.5 min-w-0">
      <Icon className="w-4 h-4 text-[#6b7280] flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-[#6b7280]">{label}</p>
        <p className="text-xs font-medium text-[#f3f4f6] truncate">{value}</p>
      </div>
    </div>
  );
}

function SocialLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href.startsWith("http") ? href : `https://${href}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#0e1015] border border-white/10 text-[#9ca3af] hover:text-white hover:border-white/20 transition-colors"
    >
      <span>{label}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}
