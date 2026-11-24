import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, GraduationCap, ShieldCheck, Users, Wallet } from "lucide-react";
import Button from "@/components/atoms/Button";
import { siteConfig } from "@/lib/site";

const pillars = [
  {
    icon: Users,
    title: "Alumni & Batch Cohorts",
    description: "Search approved members across all SSC batch years, professional fields, and regional chapters.",
  },
  {
    icon: CalendarDays,
    title: "Reunions & Events",
    description: "Official school reunions, batch gatherings, and direct RSVP management for members and guests.",
  },
  {
    icon: ShieldCheck,
    title: "Digital Membership ID",
    description: "Secure, QR-verifiable membership cards that confirm alumni standing without exposing private details.",
  },
  {
    icon: Wallet,
    title: "Transparency Fund",
    description: "Open ledger for school development projects and community aid, backed by digital money receipts.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-white/[0.08] bg-[#0c0d11]/95 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center relative flex-shrink-0">
              <Image
                src="/logo.png"
                alt="M.K.B.H High School"
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>
            <div>
              <span className="font-serif text-base font-semibold tracking-tight block leading-none">
                M.K.B.H High School
              </span>
              <span className="text-[10px] text-[#9ca3af] uppercase tracking-wider block mt-0.5">
                Alumni Association • Established 1989
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/fund" className="hidden sm:inline-block">
              <Button variant="ghost" size="sm">Fund Ledger</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="sm">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Apply for Access</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Editorial Value Proposition */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs text-[#9ca3af] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a634b]" />
              Official Alumni Network • Verified Members
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-[54px] font-semibold tracking-tight text-[#f3f4f6] leading-[1.12]">
              A permanent, private home for{" "}
              <span className="italic text-[#c89542]">MKBH High School</span>{" "}
              alumni and faculty.
            </h1>

            <p className="text-base sm:text-lg text-[#9ca3af] leading-relaxed max-w-xl">
              {siteConfig.description}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto">
                  Apply for Membership
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Member Sign In
                </Button>
              </Link>
            </div>

            <div className="pt-6 border-t border-white/[0.08] grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="font-serif text-2xl font-semibold text-[#f3f4f6]">1985+</p>
                <p className="text-xs text-[#9ca3af] mt-0.5">SSC Batches</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-semibold text-[#f3f4f6]">100%</p>
                <p className="text-xs text-[#9ca3af] mt-0.5">Admin Verified</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-semibold text-[#f3f4f6]">Private</p>
                <p className="text-xs text-[#9ca3af] mt-0.5">Privacy By Default</p>
              </div>
            </div>
          </div>

          {/* Right Column: Institutional Heritage & Core Pillars */}
          <div className="lg:col-span-5 space-y-4">
            {/* School Campus Photo Card */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-[#13151b]">
              <div className="relative h-48 sm:h-56 w-full">
                <Image
                  src="/mkbh.jpeg"
                  alt="MKBH High School Campus"
                  fill
                  priority
                  quality={85}
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#13151b] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="font-serif text-sm font-medium text-[#f3f4f6]">MKBH High School Campus</p>
                  <p className="text-[11px] text-[#9ca3af]">A legacy of education and community service</p>
                </div>
              </div>

              {/* Pillars List */}
              <div className="p-4 sm:p-5 space-y-3.5 divide-y divide-white/[0.06]">
                {pillars.map((pillar, idx) => (
                  <div key={pillar.title} className={idx === 0 ? "flex items-start gap-3" : "pt-3.5 flex items-start gap-3"}>
                    <div className="p-1.5 rounded-md bg-[#1a634b]/15 text-[#34d399] border border-[#22785c]/30 flex-shrink-0 mt-0.5">
                      <pillar.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-[#f3f4f6] leading-tight">
                        {pillar.title}
                      </h2>
                      <p className="text-xs text-[#9ca3af] mt-1 leading-normal">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0c0d11] py-8 text-xs text-[#6b7280]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-[#f3f4f6] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#f3f4f6] transition-colors">
              Terms of Use
            </Link>
            <Link href="/fund" className="hover:text-[#f3f4f6] transition-colors">
              Fund Transparency
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
