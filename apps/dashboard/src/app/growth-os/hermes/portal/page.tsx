'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HermesWorkbench } from '@pandoras/hermes-console';
import { PortalEvidenceLayer } from './PortalEvidenceLayer';
import { PortalSettingsLayer } from './PortalSettingsLayer';
import { PortalQuickStartBanner } from './PortalQuickStartBanner';
import { PortalGuideModal } from './PortalGuideModal';

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    async function loadPortal() {
      setLoading(true);
      setError(null);

      const sessionToken = localStorage.getItem('pandoras_portal_session');

      try {
        let res;
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
          window.location.href = '/growth-os/hermes/portal/login';
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.sessionToken) {
            localStorage.setItem('pandoras_portal_session', data.sessionToken);
          }
          setTenantId(data.organization?.projectId ?? data.org?.projectId);
        } else {
          localStorage.removeItem('pandoras_portal_session');
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

  if (!tenantId) return null;

  const handleLogout = () => {
    localStorage.removeItem('pandoras_portal_session');
    window.location.href = '/growth-os/hermes/portal/login';
  };

  return (
    <div className="min-h-screen bg-[#08080C] text-white p-4 md:p-8 flex flex-col items-center relative">
      <div className="w-full max-w-7xl">
        <PortalQuickStartBanner 
          onOpenGuide={() => setIsGuideOpen(true)}
        />
        
        <HermesWorkbench 
          tenantId={tenantId} 
          renderKnowledge={<PortalEvidenceLayer tenantId={tenantId} />} 
          renderSettings={<PortalSettingsLayer tenantId={tenantId} />} 
        />
      </div>

      <button 
        onClick={handleLogout}
        className="fixed bottom-6 right-6 z-40 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-xs font-semibold text-red-400 transition-colors shadow-lg"
      >
        Cerrar Sesión
      </button>

      <PortalGuideModal 
        isOpen={isGuideOpen} 
        onClose={() => setIsGuideOpen(false)} 
      />
    </div>
  );
}
