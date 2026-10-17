"use client";

import { Menu, Bell } from "lucide-react";
import Avatar from "@/components/atoms/Avatar";
import LangToggle from "@/components/atoms/LangToggle";
import { useAuth } from "@/lib/auth-context";
import { translateTitle, useI18n } from "@/lib/i18n/client";
import Link from "next/link";

interface TopNavProps {
  onMenuClick: () => void;
  title?: string;
}

export default function TopNav({ onMenuClick, title }: TopNavProps) {
  const { profile } = useAuth();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-30 h-14 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        {title && (
          <h1 className="text-[15px] font-semibold text-[#fafafa]">{translateTitle(title, t)}</h1>
        )}
      </div>

      <div className="flex items-center gap-2">
        <LangToggle />
        <button className="relative p-2 rounded-lg text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#FF6363] rounded-full" />
        </button>
        <Link
          href="/profile"
          className="hidden sm:flex items-center gap-2.5 pl-3 ml-1 border-l border-[rgba(255,255,255,0.06)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
          title="Open profile"
        >
          <Avatar
            src={profile?.avatar_url}
            name={profile?.full_name || "User"}
            size="sm"
          />
          <span className="text-[13px] font-medium text-[#a0a0a0]">
            {profile?.full_name}
          </span>
        </Link>
      </div>
    </header>
  );
}
