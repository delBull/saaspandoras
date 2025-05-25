import { DashboardHeader } from "~/components/header";
import { DashboardShell } from "~/components/shell";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Pandorians"
        text="Loading dashboard..."
      />
      <div className="divide-border-200 divide-y rounded-sm border">
        <div className="p-4">
          <div className="space-y-3">
            <div className="h-5 w-2/6 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/6 animate-pulse rounded bg-muted" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4">
            <div className="space-y-3">
              <div className="h-5 w-1/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/6 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}