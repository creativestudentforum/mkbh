"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { useAuth } from "@/lib/auth-context";
import { getAvatarUrl } from "@/lib/utils";
import { Download, Printer, GraduationCap, Phone, Users, QrCode } from "lucide-react";
import { useRef, useState } from "react";
import Image from "next/image";

export default function IDCardPage() {
  const { profile, loading } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, { scale: 2, backgroundColor: null, useCORS: true });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `Alumni-ID-${profile?.full_name?.replace(/\s+/g, '-')}.png`;
      link.click();
    } catch (error) {
      console.error("Error generating ID card:", error);
      alert("Failed to generate image.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => { window.print(); };

  if (loading) {
    return (
      <DashboardShell title="Digital ID Card">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <p className="text-xs text-[#9ca3af]">Loading membership card...</p>
        </Card>
      </DashboardShell>
    );
  }

  if (!profile) {
    return (
      <DashboardShell title="Digital ID Card">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="font-serif text-lg font-semibold text-[#f3f4f6] mb-1">Profile Not Found</h2>
          <p className="text-xs text-[#9ca3af]">An approved membership profile is required to generate a digital ID card.</p>
        </Card>
      </DashboardShell>
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const verificationUrl = `${siteUrl}/verify/${profile.public_code}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=112x112&margin=0&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <DashboardShell title="Digital ID Card">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight mb-1">
              Digital Membership Card
            </h2>
            <p className="text-sm text-[#9ca3af]">
              Official alumni identification for reunions, events, and school facility access.
            </p>
            <a
              href={verificationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex mt-1 text-xs text-[#34d399] hover:underline"
            >
              Public verification link →
            </a>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint}>
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print
            </Button>
            <Button size="sm" onClick={handleDownload} isLoading={downloading}>
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download PNG
            </Button>
          </div>
        </div>

        {/* Card Canvas */}
        <div className="flex justify-center p-6 sm:p-10 bg-[#0e1015] rounded-xl border border-white/10 overflow-hidden">
          <div
            ref={cardRef}
            id="id-card-container"
            className="relative w-full max-w-[400px] aspect-[1.6/1] rounded-xl overflow-hidden flex flex-col border border-white/20 bg-[#12141a] text-[#f3f4f6] shadow-xl print:shadow-none print:border-none"
          >
            {/* Top decorative stripe */}
            <div className="h-1.5 w-full bg-[#1a634b] flex-shrink-0" />
            <div className="h-0.5 w-full bg-[#c89542] flex-shrink-0" />

            {/* Inner Content */}
            <div className="flex-1 flex flex-col p-5 sm:p-6 justify-between">
              {/* Header: Crest + Title + Avatar */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center relative flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="M.K.B.H High School"
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    <p className="font-serif text-xs font-semibold text-[#f3f4f6] tracking-tight uppercase leading-none">
                      MKBH High School
                    </p>
                    <p className="text-[8px] text-[#c89542] font-semibold tracking-widest uppercase mt-0.5">
                      Alumni Association
                    </p>
                  </div>
                </div>

                <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/20 bg-[#0e1015] flex-shrink-0">
                  {profile.avatar_url ? (
                    <div className="w-full h-full relative">
                      <Image
                        src={getAvatarUrl(profile.avatar_url)}
                        alt={profile.full_name}
                        fill
                        className="object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-[#181b22] flex items-center justify-center text-sm font-semibold text-white">
                      {profile.full_name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>

              {/* Name & Details */}
              <div className="my-2">
                <h3 className="font-serif text-lg font-semibold text-[#f3f4f6] leading-tight">
                  {profile.full_name}
                </h3>
                <p className="text-[11px] text-[#9ca3af] mt-0.5">
                  Batch {profile.batch || "N/A"}{profile.department ? ` • ${profile.department}` : ""}
                </p>
              </div>

              {/* Bottom: QR Code + Verification Stamp */}
              <div className="flex items-end justify-between pt-2 border-t border-white/[0.08]">
                <div className="space-y-0.5">
                  <p className="text-[8px] font-mono tracking-widest text-[#6b7280] uppercase">
                    ID: {(profile.public_code || profile.id.split('-')[0]).toUpperCase()}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#34d399]" />
                    <span className="text-[9px] font-medium text-[#34d399] uppercase tracking-wider">
                      Verified Member
                    </span>
                  </div>
                </div>

                <div className="w-14 h-14 bg-white p-1 rounded-md border border-white/20 flex-shrink-0">
                  {profile.public_code ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrUrl} alt="QR verification code" className="w-full h-full" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#111]">
                      <QrCode className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
