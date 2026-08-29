'use client';

/**
 * 🛡️ HERMES MEDIA CO — CAPABILITY APPROVAL PANEL (ADMIN ONLY)
 * apps/dashboard/src/components/admin/HermesMediaGovernancePanel.tsx
 *
 * Mounted in the "🔑 Hermes Tenants" tab of /admin/dashboard.
 * Lets a verified platform admin Approve/Suspend Media Co capabilities per tenant.
 *
 * The backend (POST /api/v1/hermes/tenants/grants) enforces an admin session
 * server-side; this panel only drives that route — tenants can never self-grant.
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CapabilityItem {
  capability: string;
  label: string;
  enabled: boolean;
  status: string;
}

export function HermesMediaGovernancePanel({ tenantSlug }: { tenantSlug: string }) {
  const [capabilities, setCapabilities] = useState<CapabilityItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyCap, setBusyCap] = useState<string | null>(null);

  const loadGrants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/hermes/tenants/grants?tenantId=${tenantSlug}`);
      const data = await res.json();
      if (data.ok) {
        setCapabilities(data.grants || []);
      }
    } catch (err) {
      console.error('Failed to load grants for tenant', tenantSlug, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrants();
  }, [tenantSlug]);

  const toggleGrant = async (capability: string, enabled: boolean) => {
    setBusyCap(capability);
    try {
      toast.loading(`${enabled ? 'Aprobando' : 'Suspendiendo'} ${capability} para @${tenantSlug}...`);
      const res = await fetch('/api/v1/hermes/tenants/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenantSlug, capability, enabled }),
      });
      const data = await res.json();
      toast.dismiss();
      if (data.ok) {
        toast.success(`${enabled ? '✅ Capability aprobada' : '⏸️ Capability suspendida'} para @${tenantSlug}`);
        loadGrants();
      } else {
        toast.error(data.error || 'Falla al actualizar el grant');
      }
    } catch (e: any) {
      toast.dismiss();
      toast.error(e?.message || 'Falla de conexión');
    } finally {
      setBusyCap(null);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Media Co — Capabilities
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadGrants}
          className="p-1 h-6 text-zinc-500 hover:text-zinc-300"
          aria-label="Refrescar grants"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && capabilities === null ? (
        <p className="text-[11px] text-zinc-500 animate-pulse">Cargando grants...</p>
      ) : capabilities === null ? (
        <p className="text-[11px] text-zinc-500">No se pudieron cargar los grants.</p>
      ) : (
        <div className="space-y-2">
          {capabilities.map(cap => (
            <div
              key={cap.capability}
              className="flex items-center justify-between gap-2 rounded-lg bg-zinc-900/50 border border-zinc-800/80 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-xs text-zinc-200 truncate">{cap.label}</p>
                <p className="text-[10px] text-zinc-500 font-mono truncate">{cap.capability}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  className={
                    cap.enabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px]'
                      : 'bg-zinc-800 text-zinc-500 border-zinc-700 text-[9px]'
                  }
                >
                  {cap.status}
                </Badge>
                {cap.enabled ? (
                  <Button
                    size="sm"
                    disabled={busyCap === cap.capability}
                    onClick={() => toggleGrant(cap.capability, false)}
                    className="h-7 px-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-[10px] font-bold"
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Suspender
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={busyCap === cap.capability}
                    onClick={() => toggleGrant(cap.capability, true)}
                    className="h-7 px-2.5 bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/30 rounded-lg text-[10px] font-bold"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Aprobar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}