import { DashboardHeader } from "~/components/header";
import { DashboardShell } from "~/components/shell";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="fixed inset-0 flex">
        {/* Fake Sidebar */}
        <div className="hidden md:block w-80 bg-zinc-900 border-r border-zinc-800">
          <div className="p-6">
            {/* Fake Logo */}
            <div className="h-8 w-40 animate-pulse rounded bg-zinc-800 mb-8" />
            {/* Fake Wallet */}
            <div className="h-16 animate-pulse rounded bg-zinc-800 mb-6" />
            {/* Fake Navigation Items */}
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded bg-zinc-800"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen bg-black">
          <div className="p-8">
            {/* Header */}
            <DashboardHeader heading="Pandorians" text="Loading dashboard..." />

            {/* Fake Stats Grid */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-32 animate-pulse rounded-lg bg-zinc-900 border border-zinc-800"
                />
              ))}
            </div>

            {/* Fake Content Sections */}
            <div className="space-y-6">
              <div className="h-48 animate-pulse rounded-lg bg-zinc-900 border border-zinc-800" />
              <div className="h-64 animate-pulse rounded-lg bg-zinc-900 border border-zinc-800" />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
