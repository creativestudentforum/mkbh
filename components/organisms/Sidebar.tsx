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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
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
      {/* Mobile backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/70 z-40 lg:hidden transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-[#101217] border-r border-white/[0.08] z-50 flex flex-col",
          "w-[264px] max-w-[85vw]",
          "transition-all duration-200 ease-out",
          /* Mobile slide in / out */
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
          /* Desktop */
          "lg:translate-x-0",
          isCollapsed ? "lg:w-[72px]" : "lg:w-[256px]"
        )}
      >
        {/* Logo Header */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-white/[0.08] px-4 flex-shrink-0 justify-between",
            isCollapsed && "lg:justify-center lg:px-2"
          )}
        >
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 group",
              isCollapsed && "lg:hidden"
            )}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center text-white flex-shrink-0 relative">
              <Image
                src="/logo.png"
                alt="M.K.B.H High School"
                fill
                className="object-cover"
                sizes="32px"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold text-[#f3f4f6] tracking-tight leading-tight">
                M.K.B.H Alumni
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#9ca3af]">
                Established 1989
              </span>
            </div>
          </Link>

          {/* Desktop collapsed icon */}
          {isCollapsed && (
            <Link
              href="/dashboard"
              onClick={onClose}
              title="M.K.B.H Alumni"
              className="hidden lg:flex w-8 h-8 rounded-full overflow-hidden bg-white border border-white/20 items-center justify-center relative"
            >
              <Image
                src="/logo.png"
                alt="M.K.B.H High School"
                fill
                className="object-cover"
                sizes="32px"
                priority
              />
            </Link>
          )}

          {/* Mobile close button */}
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1.5 rounded-md text-[#9ca3af] hover:text-white hover:bg-white/[0.08] transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 overscroll-contain">
          {!isCollapsed && (
            <div className="px-2.5 pt-1 pb-1.5">
              <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                {t("nav.main")}
              </p>
            </div>
          )}

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
                  "flex items-center rounded-lg text-xs font-medium transition-colors duration-150 relative",
                  isCollapsed
                    ? "justify-center p-2.5"
                    : "gap-2.5 px-3 py-2",
                  isActive
                    ? "bg-[#1a634b]/20 text-white border border-[#22785c]/40 font-semibold"
                    : "text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.05]"
                )}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 flex-shrink-0",
                    isActive ? "text-[#34d399]" : "text-[#828a9b]"
                  )}
                />
                {!isCollapsed && <span>{t(item.labelKey)}</span>}
              </Link>
            );
          })}

          {profile?.role === "admin" && (
            <>
              <div className="pt-3 pb-1.5 px-2.5">
                {!isCollapsed ? (
                  <p className="text-[10px] font-semibold text-[#6b7280] uppercase tracking-wider">
                    {t("nav.admin")}
                  </p>
                ) : (
                  <div className="h-[1px] bg-white/[0.08] my-1" />
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
                      "flex items-center rounded-lg text-xs font-medium transition-colors duration-150 relative",
                      isCollapsed
                        ? "justify-center p-2.5"
                        : "gap-2.5 px-3 py-2",
                      isActive
                        ? "bg-[#1a634b]/20 text-white border border-[#22785c]/40 font-semibold"
                        : "text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-white/[0.05]"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive ? "text-[#34d399]" : "text-[#828a9b]"
                      )}
                    />
                    {!isCollapsed && <span>{t(item.labelKey)}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:block px-2 py-1.5 border-t border-white/[0.08] flex-shrink-0">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-2 rounded-lg text-[#6b7280] hover:text-[#f3f4f6] hover:bg-white/[0.05] transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform duration-200",
                isCollapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* User profile footer */}
        <div
          className={cn(
            "p-2 border-t border-white/[0.08] flex-shrink-0",
            isCollapsed && "lg:flex lg:flex-col lg:items-center"
          )}
        >
          <Link
            href="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 mb-1 rounded-lg hover:bg-white/[0.05] transition-colors",
              isCollapsed && "lg:justify-center lg:px-1"
            )}
            title={isCollapsed ? profile?.full_name || "Profile" : undefined}
          >
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name || "User"}
              size="sm"
            />
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-[#f3f4f6] truncate">
                    {profile?.full_name}
                  </p>
                  {profile?.role === "admin" && (
                    <Badge variant="info" className="text-[9px] px-1 py-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-[#6b7280] truncate">
                  {profile?.email}
                </p>
              </div>
            )}
          </Link>

          <button
            onClick={() => {
              onClose?.();
              signOut();
            }}
            title={isCollapsed ? t("nav.signOut") : undefined}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#9ca3af] hover:text-red-400 hover:bg-red-500/[0.08] transition-colors w-full",
              isCollapsed && "lg:justify-center lg:px-1"
            )}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>{t("nav.signOut")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
