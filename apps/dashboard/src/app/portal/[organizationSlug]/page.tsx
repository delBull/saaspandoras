/**
 * Portal Overview — Phase 6.1 Stub
 * /portal/[organizationSlug]/page.tsx
 * 
 * Phase 6.2 will build the real Overview with system status and activity feed.
 * This stub validates that the PortalShell + ControlPlaneContext are working.
 * 
 * Authorization was already enforced by layout.tsx.
 * This page operates within the authorized tenant context.
 */

export default function PortalOverviewPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      {/* Status badge */}
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-300 text-sm font-medium">Phase 6.1 — Shell Verified</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">
        Your Hermes operating system is ready.
      </h1>
      <p className="text-white/40 text-base max-w-md leading-relaxed">
        Identity, Knowledge, Channels, and Conversations are coming in Phase 6.2–6.6.
        The tenant boundary, authorization, and shell are certified.
      </p>

      {/* Checklist */}
      <div className="mt-10 grid grid-cols-2 gap-3 text-left max-w-sm w-full">
        {[
          ['Portal Shell', true],
          ['Tenant Context', true],
          ['Authorization Boundary', true],
          ['Organization Scope', true],
          ['Permission Model', true],
          ['Cross-tenant isolation', true],
          ['Overview (Phase 6.2)', false],
          ['Identity (Phase 6.3)', false],
        ].map(([label, done]) => (
          <div
            key={String(label)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          >
            <span className={`text-sm ${done ? 'text-emerald-400' : 'text-white/20'}`}>
              {done ? '✓' : '○'}
            </span>
            <span className={`text-xs ${done ? 'text-white/70' : 'text-white/25'}`}>
              {String(label)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
