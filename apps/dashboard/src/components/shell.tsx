import * as React from "react";
import { Sidebar } from "./sidebar";
import { NFTGate } from "./nft-gate";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  wallet?: string;
  userName?: string;
  title?: string;
  description?: string;
  className?: string;
}

export function DashboardShell({
  children,
  wallet,
  userName,
  title,
  description,
  className,
}: DashboardShellProps) {
  return (
    <div
      className={cn(
        "fixed inset-0",
        "flex bg-gradient-to-tr from-gray-950 to-black",
        "border-zinc-900",
        "overflow-hidden",
      )}
    >
      <Sidebar wallet={wallet} userName={userName} />
      <main
        className={cn(
          "flex-1 relative",
          "h-screen overflow-y-auto",
          "p-12 bg-gradient-to-br from-gray-950 to-fuchsia-950/30 via-fuchsia-950/40",
          "rounded-tl-[4rem]",
          className,
        )}
      >
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-white">{title}</h1>
            {description && <p className="mt-2 text-gray-400">{description}</p>}
          </div>
        )}
        <NFTGate>
          <div className="max-w-7xl mx-auto">{children}</div>
        </NFTGate>
      </main>
    </div>
  );
}