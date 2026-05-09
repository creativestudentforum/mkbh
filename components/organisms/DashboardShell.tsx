"use client";

import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Ambient background glow */}
      <div className="ambient-glow" />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div className={cn(
        "transition-all duration-300 relative z-10",
        isCollapsed ? "lg:ml-[72px]" : "lg:ml-[260px]"
      )}>
        <TopNav
          onMenuClick={() => setSidebarOpen(true)}
          title={title}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
