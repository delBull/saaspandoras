import * as React from "react";
import { Sidebar } from "~/components/sidebar";

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
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar wallet={wallet} totalBalance={totalBalance} />
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
