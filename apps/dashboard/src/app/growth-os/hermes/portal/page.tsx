'use client';

import { useEffect } from 'react';

export default function GrowthOsHermesPortalRedirect() {
  useEffect(() => {
    // Telemetría: identificar el origen real de este enlace legacy
    // (ningún código actual lo genera; se sospecha email antiguo o bookmark).
    console.warn(
      '[Legacy Route] /growth-os/hermes/portal hit. Referer:',
      document.referrer || 'none',
      'Query:',
      window.location.search
    );

    const search = window.location.search;
    const hash = window.location.hash;
    window.location.replace(`/portal${search}${hash}`);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 text-sm">
      Redirigiendo al portal…
    </div>
  );
}
