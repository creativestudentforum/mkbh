"use client";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import { useI18n } from "@/lib/i18n/client";
import type { I18nKey } from "@/lib/i18n/dictionaries";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  GraduationCap,
  CreditCard,
  LogOut,
  Shield,
  BookOpen,
  X,
  ChevronLeft,
  CalendarDays,
  Droplets,
  Layers,
  Images,
  ListChecks,
  DollarSign,
  Flower2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: Array<{ href: string; labelKey: I18nKey; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/directory", labelKey: "nav.directory", icon: Users },
  { href: "/batches", labelKey: "nav.batches", icon: Layers },
  { href: "/profile", labelKey: "nav.profile", icon: UserCircle },
  { href: "/teachers", labelKey: "nav.teachers", icon: BookOpen },
  { href: "/events", labelKey: "nav.events", icon: CalendarDays },
  { href: "/gallery", labelKey: "nav.gallery", icon: Images },
  { href: "/blood", labelKey: "nav.blood", icon: Droplets },
  { href: "/fund", labelKey: "nav.fund", icon: DollarSign },
  { href: "/memorial", labelKey: "nav.memorial", icon: Flower2 },
  { href: "/id-card", labelKey: "nav.idCard", icon: CreditCard },
];

const adminItems: Array<{ href: string; labelKey: I18nKey; icon: typeof LayoutDashboard }> = [
  { href: "/admin/users", labelKey: "nav.users", icon: Shield },
  { href: "/admin/teachers", labelKey: "nav.manageTeachers", icon: GraduationCap },
  { href: "/admin/events", labelKey: "nav.manageEvents", icon: CalendarDays },
  { href: "/admin/batches", labelKey: "nav.manageBatches", icon: Layers },
  { href: "/admin/gallery", labelKey: "nav.manageGallery", icon: Images },
  { href: "/admin/roster", labelKey: "nav.roster", icon: ListChecks },
  { href: "/admin/fund", labelKey: "nav.manageFund", icon: DollarSign },
  { href: "/admin/memorial", labelKey: "nav.manageMemorial", icon: Flower2 },
];

export default function Sidebar({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { t } = useI18n();

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[#0f0f0f] border-r border-[rgba(255,255,255,0.06)] z-50 flex flex-col",
          /* Smooth transitions */
          "transition-all duration-300 ease-out",
          /* Width */
          isCollapsed ? "w-[72px]" : "w-[260px]",
          /* Mobile: slide in/out */
          isOpen
            ? "translate-x-0 shadow-[24px_0_48px_rgba(0,0,0,0.5)]"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-[rgba(255,255,255,0.06)] px-4 flex-shrink-0",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={onClose}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center shadow-[0_0_12px_rgba(255,99,99,0.2)] group-hover:shadow-[0_0_20px_rgba(255,99,99,0.3)] transition-shadow">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-[15px] font-semibold text-[#fafafa] tracking-tight">
                AlumniHub
              </span>
            </Link>
          )}
          {isCollapsed && (
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center shadow-[0_0_12px_rgba(255,99,99,0.2)]">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
          )}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-[#666] hover:text-white hover:bg-[rgba(255,255,255,0.06)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 overscroll-contain">
          <div className={cn("mb-2 mt-1", isCollapsed ? "px-0" : "px-3")}>
            {!isCollapsed && (
              <p className="text-[10px] font-semibold text-[#444] uppercase tracking-[0.08em]">
                {t("nav.main")}
              </p>
            )}
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? t(item.labelKey) : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-[rgba(255,255,255,0.06)] text-[#fafafa]"
                    : "text-[#777] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.04)]"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#FF6363] rounded-r-full" />
                )}
                <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-[#FF6363]")} />
                {!isCollapsed && t(item.labelKey)}
              </Link>
            );
          })}

          {profile?.role === "admin" && (
            <>
              <div
                className={cn("pt-4 mb-2", isCollapsed ? "px-0" : "px-3")}
              >
                {!isCollapsed ? (
                  <p className="text-[10px] font-semibold text-[#444] uppercase tracking-[0.08em]">
                    {t("nav.admin")}
                  </p>
                ) : (
                  <div className="border-t border-[rgba(255,255,255,0.06)] mx-2" />
                )}
              </div>
              {adminItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={isCollapsed ? t(item.labelKey) : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 group relative",
                      isCollapsed && "justify-center px-2",
                      isActive
                        ? "bg-[rgba(255,255,255,0.06)] text-[#fafafa]"
                        : "text-[#777] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.04)]"
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-[#FF6363] rounded-r-full" />
                    )}
                    <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-[#FF6363]")} />
                    {!isCollapsed && t(item.labelKey)}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block p-2 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#555] hover:text-[#e5e5e5] hover:bg-[rgba(255,255,255,0.04)] transition-all"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform duration-300",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* User section */}
        <div
          className={cn(
            "p-2 border-t border-[rgba(255,255,255,0.06)] flex-shrink-0",
            isCollapsed
              ? "flex flex-col items-center gap-2"
              : ""
          )}
        >
          {!isCollapsed && (
            <Link
              href="/profile"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2 mb-1 rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
            >
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name || "User"}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[13px] font-medium text-[#e5e5e5] truncate">
                    {profile?.full_name}
                  </p>
                  {profile?.role === "admin" && (
                    <Badge variant="info" className="text-[9px] px-1.5 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-[#555] truncate">
                  {profile?.email}
                </p>
              </div>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/profile" onClick={onClose} title="Open profile">
              <Avatar
                src={profile?.avatar_url}
                name={profile?.full_name || "User"}
                size="sm"
              />
            </Link>
          )}
          <button
            onClick={signOut}
            title={isCollapsed ? "Sign Out" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[#666] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.06)] transition-all duration-200 w-full",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            {!isCollapsed && t("nav.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
