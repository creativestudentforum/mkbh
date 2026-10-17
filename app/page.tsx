import Button from "@/components/atoms/Button";
import { siteConfig } from "@/lib/site";
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#fafafa] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[720px] h-[720px] bg-[radial-gradient(circle,rgba(255,99,99,0.08)_0%,transparent_70%)] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[560px] h-[560px] bg-[radial-gradient(circle,rgba(255,154,99,0.05)_0%,transparent_70%)] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">{siteConfig.shortName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <Link href="/signup"><Button>Join</Button></Link>
          </div>
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,99,99,0.18)] bg-[rgba(255,99,99,0.08)] px-3 py-1 text-[12px] text-[#FF9A63]">
              <ShieldCheck className="w-4 h-4" /> Members-only alumni network
            </div>
            <div>
              <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-5">A private home for our alumni community.</h1>
              <p className="text-[#999] text-base sm:text-lg leading-8 max-w-2xl">{siteConfig.description}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup"><Button size="lg">Apply for Access <ArrowRight className="w-4 h-4" /></Button></Link>
              <Link href="/login"><Button size="lg" variant="secondary">Member Login</Button></Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Users, title: "Directory", text: "Approved members can find and connect with alumni." },
              { icon: CalendarDays, title: "Events", text: "RSVP to reunions and alumni gatherings." },
              { icon: ShieldCheck, title: "Verified ID", text: "Public QR verification shows only safe details." },
              { icon: GraduationCap, title: "School Network", text: "Teachers, batches, gallery, fund and more." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[#141414] p-5">
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,99,99,0.08)] flex items-center justify-center mb-4"><item.icon className="w-5 h-5 text-[#FF6363]" /></div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#777] leading-6">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-20 pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-[#555]">
          <p>© 2026 {siteConfig.shortName}</p>
          <div className="flex gap-4"><Link href="/privacy" className="hover:text-[#FF6363]">Privacy</Link><Link href="/terms" className="hover:text-[#FF6363]">Terms</Link></div>
        </footer>
      </div>
    </main>
  );
}
