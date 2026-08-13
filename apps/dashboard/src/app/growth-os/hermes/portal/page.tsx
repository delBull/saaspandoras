'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const SESSION_KEY = 'pandoras_portal_session';

function setPortalSession(sessionToken: string) {
  try {
    localStorage.setItem(SESSION_KEY, sessionToken);
  } catch {}
  // New Mission Control (/portal/[slug]) validates the session via cookie
  document.cookie = `${SESSION_KEY}=${sessionToken}; Max-Age=${60 * 60 * 24 * 30}; Path=/; SameSite=Lax`;
}

function clearPortalSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
  document.cookie = `${SESSION_KEY}=; Max-Age=0; Path=/`;
}

export default function ClientPortalPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-white/10 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm text-white/50">Cargando Centro de Operaciones...</div>
        </div>
      </div>
    }>
      <ClientPortalContent />
    </Suspense>
  );
}

function ClientPortalContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const returnPath = searchParams.get('return');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPortal() {
      setLoading(true);
      setError(null);

      const sessionToken = localStorage.getItem(SESSION_KEY);

      try {
        let res;
        let organization: any = null;
        if (token) {
          // Consume magic token
          res = await fetch('/api/v1/portal/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
        } else if (sessionToken) {
          // Validate existing session
          res = await fetch('/api/v1/portal/session', {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
          });
        } else {
          const loginUrl = returnPath?.startsWith('/') ? `/growth-os/hermes/portal/login?return=${encodeURIComponent(returnPath)}` : '/growth-os/hermes/portal/login';
          window.location.href = loginUrl;
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.sessionToken) {
            setPortalSession(data.sessionToken);
          } else if (sessionToken) {
            // Session validated from localStorage; ensure cookie is fresh for /portal/[slug]
            setPortalSession(sessionToken);
          }
          organization = data.organization ?? data.org;

          // The organization resolved from the session carries the tenant slug.
          // Redirect to the new Mission Control portal so Hermes can accompany
          // the tenant through onboarding instead of the legacy workbench.
          const slug = organization?.slug;
          if (slug) {
            const target = returnPath?.startsWith('/portal/')
              ? returnPath
              : `/portal/${slug}`;
            window.location.href = target;
            return;
          }
          setError('No se pudo resolver la organización asociada a tu cuenta.');
        } else {
          clearPortalSession();
          window.location.href = '/growth-os/hermes/portal/login';
        }
      } catch (err: any) {
        setError('Error de conexión con el Kernel');
      } finally {
        setLoading(false);
      }
    }

    loadPortal();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center text-white font-sans">
        <div className="text-center">
          <div className="w-9 h-9 border-4 border-white/10 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <div className="text-sm text-white/50">Autenticando Tenant...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#08080C] flex items-center justify-center text-white">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl text-center">
          <h2 className="text-red-400 font-bold mb-2">Error</h2>
          <p className="text-red-200/70">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}
