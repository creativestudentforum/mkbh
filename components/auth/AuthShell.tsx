import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import LangToggle from "@/components/atoms/LangToggle";
import { GraduationCap } from "lucide-react";
import { siteConfig } from "@/lib/site";

export const AUTH_BG_IMAGE = "/mkbh.jpeg";

type AuthShellProps = {
  children: ReactNode;
  widthClass?: string;
};

export default function AuthShell({ children, widthClass = "max-w-[400px]" }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] lg:grid lg:grid-cols-2">
      {/* Top right language switch */}
      <div className="absolute top-4 right-4 z-20">
        <LangToggle />
      </div>

      {/* Form Column */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-8 lg:px-12">
        <div className={`w-full ${widthClass}`}>{children}</div>
      </div>

      {/* Campus / Editorial Visual Column (Desktop) */}
      <div className="relative hidden lg:block overflow-hidden border-l border-white/[0.08] bg-[#101217]">
        <div className="absolute inset-0">
          <Image
            src={AUTH_BG_IMAGE}
            alt="MKBH High School"
            fill
            priority
            quality={85}
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#0c0d11]/75 backdrop-contrast-125" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0d11] via-[#0c0d11]/40 to-transparent" />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-[#f3f4f6]">
          <Link href="/" className="inline-flex items-center gap-3 w-fit">
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
              <span className="font-serif text-base font-semibold tracking-tight block text-foreground leading-tight">
                M.K.B.H High School
              </span>
              <span className="text-[10px] text-muted uppercase tracking-wider block">
                Alumni Network • Est. 1989
              </span>
            </div>
          </Link>

          <div className="space-y-3 max-w-md">
            <p className="text-xs uppercase tracking-widest text-[#c89542] font-semibold">Official Network</p>
            <h2 className="font-serif text-3xl font-semibold leading-snug">
              Preserving memories, strengthening ties, and supporting our school.
            </h2>
            <p className="text-sm text-[#9ca3af] leading-relaxed">
              Every member is verified against school graduation records to ensure a safe, authentic community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
