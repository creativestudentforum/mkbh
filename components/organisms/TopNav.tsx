"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import Avatar from "@/components/atoms/Avatar";
import LangToggle from "@/components/atoms/LangToggle";
import { useAuth } from "@/lib/auth-context";
import { translateTitle, useI18n } from "@/lib/i18n/client";

interface TopNavProps {
  onMenuClick?: () => void;
  title?: string;
}

export default function TopNav({ onMenuClick, title }: TopNavProps) {
  const { profile } = useAuth();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#101217] border-b border-white/[0.08] flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-md text-[#9ca3af] hover:text-white hover:bg-white/[0.08] transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link href="/dashboard" className="flex items-center gap-2 group" title="M.K.B.H High School Alumni">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-white border border-white/20 flex-shrink-0 relative">
            <Image
              src="/logo.png"
              alt="M.K.B.H High School"
              fill
              className="object-cover"
              sizes="28px"
              priority
            />
          </div>
          <span className="font-serif text-sm font-semibold text-[#f3f4f6] tracking-tight hidden md:inline">
            M.K.B.H
          </span>
        </Link>
        {title && (
          <>
            <span className="hidden md:inline text-white/20 text-xs font-mono">/</span>
            <h1 className="font-serif text-base font-semibold text-[#f3f4f6] tracking-tight">
              {translateTitle(title, t)}
            </h1>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LangToggle />
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-md text-[#9ca3af] hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#c89542] rounded-full" />
        </button>
        <Link
          href="/profile"
          className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-white/[0.08] rounded-md hover:bg-white/[0.05] p-1 transition-colors"
          title="Open profile"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || "User"}
            size="sm"
          />
          <span className="text-xs font-medium text-[#d1d5db]">
            {profile?.full_name}
          </span>
        </Link>
      </div>
    </header>
  );
}
