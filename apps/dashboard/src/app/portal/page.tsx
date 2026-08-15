'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalRedirect() {
  const router = useRouter();

  useEffect(() => {
    const sessionToken = localStorage.getItem('pandoras_portal_session');
    if (!sessionToken) {
      router.push('/portal/login');
      return;
    }

    fetch('/api/v1/portal/session', {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid session');
        return res.json();
      })
      .then(data => {
        const org = data.organization ?? data.org;
        if (org && org.slug) {
          router.push(`/portal/${org.slug}`);
        } else if (org && org.projectId) {
          router.push(`/portal/${org.projectId}`);
        } else {
          // Fallback si no hay org clara
          router.push('/portal/login');
        }
      })
      .catch(() => {
        // Fallback en caso de error de sesión o local development
        router.push('/portal/login');
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-[#08080C] flex items-center justify-center text-white font-sans">
      <div className="text-center">
        <div className="w-9 h-9 border-4 border-white/10 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
        <div className="text-sm text-white/50">Resolviendo tenant del Portal...</div>
      </div>
    </div>
  );
}
