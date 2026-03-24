"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { NFTGate } from "./nft-gate";
import { cn } from "@/lib/utils"; // Fixed import path if needed, assuming @/lib/utils is correct
import { usePathname } from "next/navigation";

interface DashboardShellProps {
  children: React.ReactNode;
  wallet?: string;
  userName?: string;
  title?: string;
  description?: string;
  className?: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  sidebarDefaultOpen?: boolean;
  hideSidebar?: boolean;
}

export function DashboardShell({
  children,
  wallet,
  userName,
  title,
  description,
  className,
  isAdmin,
  isSuperAdmin,
  sidebarDefaultOpen,
  hideSidebar = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isGovernancePage = pathname?.startsWith("/governance");
  const isDaoPage = pathname?.includes("/dao");
  const isProjectPage = pathname?.startsWith("/projects/") && !pathname?.includes("/admin");
  const isAgoraPage = pathname?.startsWith("/agora");
  const isEducationPage = pathname === "/education";
  const isCourseDetailPage = pathname?.startsWith("/education/course/");

  return (
    <div
      className={cn(
        "fixed inset-0",
        "flex bg-gradient-to-tr from-gray-950 to-black",
        "border-zinc-900",
        "overflow-hidden",
      )}
    >
      {!hideSidebar && (
        <Sidebar
          wallet={wallet}
          userName={userName}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin} // Fixed typo
          defaultOpen={sidebarDefaultOpen}
        />
      )}
      <main
        className={cn(
          "flex-1 relative",
          "h-screen overflow-y-auto",
          // Conditional padding: No padding on Home, Governance, Protocol, DAO, Agora or Education pages
          isHomePage || isGovernancePage || isDaoPage || isProjectPage || isAgoraPage || isEducationPage || isCourseDetailPage ? "p-0" : "p-2 sm:p-2 md:px-8 md:pb-8 md:pt-0",
          "bg-gradient-to-br from-gray-950 to-fuchsia-950/30 via-fuchsia-950/40", // Fixed typo in via-color
          !hideSidebar && "rounded-tl-[4rem]", 
          "overflow-x-hidden", // Removed overflow-hidden to allow y-scroll
          className,
        )}
      >
        {title && (
          <div className="mb-6 px-6 pt-6">
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {description && <p className="mt-2 text-gray-400">{description}</p>}
          </div>
        )}
        <div className="w-full h-full flex flex-col">{children}</div>
      </main>
    </div>
  );
}
