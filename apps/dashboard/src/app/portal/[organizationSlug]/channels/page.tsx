/**
 * Portal placeholder — inherits PortalShell + ControlPlaneContext from layout.tsx.
 */
export default function PortalSectionPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-6">
        <span className="text-white/20 text-xl">○</span>
      </div>
      <h2 className="text-white/60 text-lg font-semibold mb-2">Coming soon</h2>
      <p className="text-white/25 text-sm">This module is being built in Phase 6.x.</p>
    </div>
  );
}
