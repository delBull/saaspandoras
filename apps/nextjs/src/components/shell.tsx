import * as React from "react";
import { Sidebar } from "~/components/sidebar";
import { cn } from "~/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  wallet?: string;
  totalBalance?: number;
}

export function DashboardShell({
  children,
  wallet,
  totalBalance 
}: DashboardShellProps) {
  return (
    <div className={cn(
      "fixed inset-0",
      "flex bg-gray-950",
      "border-zinc-900",
      "overflow-hidden"
    )}>
      <Sidebar wallet={wallet} totalBalance={totalBalance} />
      <main className={cn(
        "flex-1 relative", 
        "h-screen overflow-y-auto",
        "p-12 bg-gray-950",
        "rounded-tl-[4rem]"
      )}>
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
