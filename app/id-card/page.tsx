"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { useAuth } from "@/lib/auth-context";
import { getAvatarUrl } from "@/lib/utils";
import { Download, Printer, GraduationCap, Phone, Users, QrCode } from "lucide-react";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import Image from "next/image";

export default function IDCardPage() {
  const { profile, loading } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Alumni-ID-${profile?.full_name?.replace(/\s+/g, '-')}.png`;
      link.click();
    } catch (error) { console.error("Error generating ID card:", error); alert("Failed to generate image.");
    } finally { setDownloading(false); }
  };

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <DashboardShell title="Digital ID Card">
        <Card className="max-w-3xl mx-auto p-8 text-center">
          <p className="text-[13px] text-[#777]">Loading digital ID...</p>
        </Card>
      </DashboardShell>
    );
  }

  if (!profile) {
    return (
      <DashboardShell title="Digital ID Card">
        <Card className="max-w-3xl mx-auto p-8 text-center">
          <h2 className="text-[18px] font-semibold text-[#fafafa] mb-2">Profile not found</h2>
          <p className="text-[13px] text-[#777]">A profile is required before a digital ID card can be generated.</p>
        </Card>
      </DashboardShell>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const verificationUrl = `${siteUrl}/verify/${profile.public_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=112x112&margin=0&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <DashboardShell title="Digital ID Card">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center slide-up stagger-1">
          <div>
            <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">Your Digital ID</h2>
            <p className="text-[#777] text-[14px]">Use this to access alumni events and facilities</p>
            <a href={verificationUrl} target="_blank" rel="noreferrer" className="inline-flex mt-2 text-[12px] text-[#FF6363] hover:text-[#FF4F4F] transition-colors">
              Public verification link
            </a>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button onClick={handleDownload} isLoading={downloading}>
              <Download className="w-4 h-4" />
              Download
            </Button>
          </div>
        </div>

        <div className="flex justify-center slide-up stagger-2 p-4 sm:p-8 bg-[#0f0f0f] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            ref={cardRef}
            id="id-card-container"
            className="relative w-full max-w-[380px] aspect-[1.6/1] rounded-2xl overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.5)] flex flex-col border border-[rgba(255,255,255,0.1)] print:shadow-none print:border-none"
            style={{ background: 'linear-gradient(145deg, #111111 0%, #0d0d0d 40%, #1a0f0f 100%)' }}
          >
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 0.5px, transparent 0)', backgroundSize: '20px 20px' }} />
            
            {/* Top accent bar with gradient */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF6363] via-[#FF9A63] to-[#FFD363] relative z-10 flex-shrink-0" />

            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-[radial-gradient(circle,rgba(255,99,99,0.08)_0%,transparent_70%)]" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[radial-gradient(circle,rgba(255,154,99,0.05)_0%,transparent_70%)]" />

            {/* Card content */}
            <div className="flex-1 flex flex-col relative z-10 p-5 sm:p-6">
              {/* Header: Logo + Avatar */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center shadow-[0_0_16px_rgba(255,99,99,0.2)]">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#fafafa] tracking-wider uppercase leading-none">Alumni Hub</p>
                    <p className="text-[8px] text-[#555] tracking-[0.15em] uppercase mt-0.5">Identity Card</p>
                  </div>
                </div>

                {/* Avatar */}
                <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[rgba(255,99,99,0.2)] shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {profile.avatar_url ? (
                    <div className="w-full h-full relative">
                      <Image src={getAvatarUrl(profile.avatar_url)} alt={profile.full_name} fill className="object-cover" crossOrigin="anonymous" />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center text-xl font-bold text-white">{profile.full_name.charAt(0)}</div>
                  )}
                </div>
              </div>

              {/* Name */}
              <h3 className="text-[18px] font-bold text-[#fafafa] tracking-tight leading-tight mb-4">{profile.full_name}</h3>

              {/* Info rows */}
              <div className="space-y-2.5 mt-auto pr-24">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[rgba(255,99,99,0.08)] flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-[#FF6363]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#555] uppercase tracking-wider font-medium">Batch</p>
                    <p className="text-[13px] font-semibold text-[#e5e5e5] truncate">{profile.batch || "N/A"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[rgba(255,154,99,0.08)] flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-[#FF9A63]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] text-[#555] uppercase tracking-wider font-medium">Mobile</p>
                    <p className="text-[13px] font-semibold text-[#e5e5e5] truncate">{profile.phone || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-5 bottom-9 z-20 w-[72px] h-[72px] rounded-lg bg-white p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.35)]">
              {profile.public_code ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="ID verification QR code" className="w-full h-full" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#111]"><QrCode className="w-8 h-8" /></div>
              )}
            </div>

            {/* Bottom bar */}
            <div className="px-5 sm:px-6 pb-4 flex items-center justify-between relative z-10">
              <p className="text-[8px] text-[#444] font-mono tracking-widest uppercase">ID: {(profile.public_code || profile.id.split('-')[0]).toUpperCase()}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                <span className="text-[8px] text-[#555] font-medium uppercase tracking-wider">Verified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
