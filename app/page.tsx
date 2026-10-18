import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap, ShieldCheck, Users } from "lucide-react";
import Button from "@/components/atoms/Button";
import { siteConfig } from "@/lib/site";

// Entrance timing is set inline so it always wins over utility classes.
const delay = (ms: number) => ({ animationDelay: `${ms}ms` });

const features = [
  { icon: Users, title: "Directory", text: "Approved members can find and connect with alumni." },
  { icon: CalendarDays, title: "Events", text: "RSVP to reunions and alumni gatherings." },
  { icon: ShieldCheck, title: "Verified ID", text: "Public QR verification shows only safe details." },
  { icon: GraduationCap, title: "School Network", text: "Teachers, batches, gallery, fund and more." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#fafafa] relative overflow-hidden">
      {/* School photo + readability overlays */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="hero-bg absolute inset-0">
          <Image
            src="/mkbh.jpeg"
            alt=""
            fill
            priority
            quality={70}
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
        {/* mobile: flat dim, desktop: dark on the text side, photo shows on the right */}
        <div className="absolute inset-0 bg-[#0a0a0a]/75 lg:hidden" />
        <div className="absolute inset-0 hidden lg:block bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/85 to-[#0a0a0a]/45" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#0a0a0a]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
      </div>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[720px] h-[720px] bg-[radial-gradient(circle,rgba(255,99,99,0.08)_0%,transparent_70%)] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[560px] h-[560px] bg-[radial-gradient(circle,rgba(255,154,99,0.05)_0%,transparent_70%)] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <nav className="hero-fade flex items-center justify-between mb-20" style={delay(200)}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">{siteConfig.shortName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost">Login</Button></Link>
            <span className="hero-cta rounded-lg">
              <Link href="/signup"><Button>Join</Button></Link>
            </span>
          </div>
        </nav>

        <section className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
          <div className="space-y-7">
            <div
              className="hero-rise inline-flex items-center gap-2 rounded-full border border-[rgba(255,99,99,0.18)] bg-[rgba(255,99,99,0.08)] px-3 py-1 text-[12px] text-[#FF9A63]"
              style={delay(300)}
            >
              <ShieldCheck className="w-4 h-4" /> Members-only alumni network
            </div>

            <div>
              <h1
                className="hero-rise text-4xl sm:text-6xl font-bold tracking-tight leading-[1.05] mb-5"
                style={delay(450)}
              >
                A private home for the{" "}
                <span className="font-serif italic font-medium text-[#FF7A6B]">MKBH High School</span>{" "}
                alumni community.
              </h1>
              <p
                className="hero-rise text-[#a3a3a3] text-base sm:text-lg leading-8 max-w-2xl"
                style={delay(600)}
              >
                {siteConfig.description}
              </p>
              <p className="hero-rise mt-4 text-[15px] text-[#c4c4c4]" style={delay(720)}>
                Reconnect with your{" "}
                <span className="hero-word font-medium text-[#fafafa]">
                  <span>batchmates</span>
                  <span aria-hidden>teachers</span>
                  <span aria-hidden>friends</span>
                </span>
                .
              </p>
            </div>

            <div className="hero-rise flex flex-col sm:flex-row gap-3" style={delay(850)}>
              <span className="hero-cta w-fit rounded-xl">
                <Link href="/signup">
                  <Button size="lg">Apply for Access <ArrowRight className="w-4 h-4" /></Button>
                </Link>
              </span>
              <Link href="/login"><Button size="lg" variant="secondary">Member Login</Button></Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((item, i) => (
              <div
                key={item.title}
                className="hero-rise rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#141414]/70 backdrop-blur-md p-5 transition-colors hover:border-[rgba(255,255,255,0.16)]"
                style={delay(800 + i * 120)}
              >
                <div className="w-10 h-10 rounded-xl bg-[rgba(255,99,99,0.08)] flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#FF6363]" />
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-[13px] text-[#9a9a9a] leading-6">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <footer
          className="hero-fade mt-20 pt-8 border-t border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row justify-between gap-3 text-[12px] text-[#6b6b6b]"
          style={delay(1300)}
        >
          <p>© 2026 {siteConfig.shortName}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[#FF6363]">Privacy</Link>
            <Link href="/terms" className="hover:text-[#FF6363]">Terms</Link>
          </div>
        </footer>
      </div>
    </main>
  );
}