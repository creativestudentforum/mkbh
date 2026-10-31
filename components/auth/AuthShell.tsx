import type { ReactNode } from "react";
import LangToggle from "@/components/atoms/LangToggle";

/**
 * Background image for the login / signup pages.
 * Save your image as public/auth-bg.jpg, or change this path
 * (for example "/auth-bg.svg" or "/mkbh.jpeg").
 */
export const AUTH_BG_IMAGE = "/auth-bg.svg";

type AuthShellProps = {
  children: ReactNode;
  /** Tailwind max-width class for the form column, e.g. "max-w-[400px]" */
  widthClass?: string;
};

/**
 * Mobile: photo fills the screen behind the form, dimmed so text stays readable.
 * Desktop (lg+): form on the left, photo on the right half.
 */
export default function AuthShell({ children, widthClass = "max-w-[400px]" }: AuthShellProps) {
  return (
    <div className="relative min-h-[100dvh] bg-[#0a0a0a] lg:grid lg:grid-cols-2">
      <div className="absolute top-4 right-4 z-20">
        <LangToggle />
      </div>

      {/* Soft glow behind the form */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 h-[600px] w-[600px] -translate-x-1/4 -translate-y-1/3 bg-[radial-gradient(circle,rgba(13,148,136,0.12)_0%,transparent_70%)]" />
      </div>

      {/* Image: full-screen backdrop on mobile, right half on desktop */}
      <div
        aria-hidden
        className="animate-in fade-in pointer-events-none fixed inset-0 lg:left-1/2"
        style={{ animationDuration: "900ms" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${AUTH_BG_IMAGE})` }}
        />
        <div className="absolute inset-0 bg-[#0a0a0a]/80 lg:bg-[#0a0a0a]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]/70" />
        <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-[#0a0a0a] to-transparent lg:block" />

        <div className="absolute inset-x-12 bottom-12 hidden lg:block">
          <p className="text-[13px] uppercase tracking-[0.2em] text-[#14B8A6] font-medium">Alumni Network</p>
          <p className="mt-2 text-4xl font-bold tracking-tight text-[#fafafa]">MKBH High School</p>
        </div>
      </div>

      {/* Form column */}
      <div className="relative z-10 flex min-h-[100dvh] items-center justify-center px-4 pb-10 pt-16 sm:px-8 lg:px-12 lg:py-10">
        <div className={`w-full ${widthClass}`}>{children}</div>
      </div>
    </div>
  );
}