"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/organisms/Sidebar";
import TopNav from "@/components/organisms/TopNav";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  title?: string;
}

export default function DashboardShell({
  children,
  title,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Restore sidebar state from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("alumni_sidebar_dock_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // Ignore localStorage read errors (SSR or privacy mode)
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("alumni_sidebar_dock_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <div
        className={cn(
          "transition-all duration-200 min-h-screen flex flex-col",
          isCollapsed ? "lg:ml-[72px]" : "lg:ml-[256px]"
        )}
      >
        <TopNav title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
