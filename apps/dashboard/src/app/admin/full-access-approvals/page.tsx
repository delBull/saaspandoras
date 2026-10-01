'use client';

/**
 * 🔐 SUPER-ONLY — Full-Access Approvals queue
 * apps/dashboard/src/app/admin/full-access-approvals/page.tsx
 *
 * Deep link target desde Discord ("Aprobar como Super Admin").
 * Lista los intents admin.full_access.v1 en status 'proposed' y permite:
 *   - APROBAR (PATCH /api/admin/projects/[slug]/full-access con intentId)
 *   - La acción requiere sesión SUPER_ADMIN (el endpoint re-verifica fail-closed)
 *   - Panel visible también para ADMIN — pero el gate del backend bloqueará
 *     la aprobación; verá "Forbidden — Super Admin only".
 */

import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, ShieldX } from 'lucide-react';
import { motion } from 'framer-motion';

interface PendingIntent {
  intentId: string;
  slug: string;
  requestedBy: string;
  createdAt: string;
}

export default function FullAccessApprovalsPage() {
  const [pending, setPending] = useState<PendingIntent[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<string>('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/full-access-approvals', { cache: 'no-store' });
      if (!res.ok) { setMessage('No autorizado o error al cargar peticiones'); return; }
      const data = await res.json();
      setPending(data.pending || []);
      if (data.role) setRole(data.role);
    } catch (e: any) {
      setMessage(e?.message || 'Error de conexión');
    }
  }, []);

  const approve = useCallback(async (intentId: string, slug: string) => {
    setBusy(intentId);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/projects/${slug}/full-access/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setMessage(`✅ FULL ACCESS ejecutado para ${slug} (${data.approvedBy}).`);
        await load();
      } else {
        setMessage(`Error: ${data.message || res.statusText}`);
      }
    } catch (e: any) {
      setMessage(e?.message || 'Error al aprobar');
    } finally {
      setBusy(null);
    }
  }, [load]);

  return (
    <>
    <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="rounded-3xl border border-violet-500/25 bg-[#0a0a0f]/90 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-56 h-56 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="p-5 border-b border-violet-500/10 flex items-center justify-between">
            <h1 className="font-bold text-white text-sm flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              Full-Access Approvals — Pending Requests (SUPER-ONLY)
            </h1>
            <span className="text-[10px] text-violet-400 font-mono px-2 py-0.5 rounded-md border border-violet-500/20 bg-violet-500/10">
              NO-CHARGE · PRODUCTION TESTING
            </span>
          </div>
          <div className="p-5 space-y-3">
            {message && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-violet-200">
                {message}
              </div>
            )}
            {pending.length === 0 && (
              <div className="p-8 rounded-xl bg-black/40 border border-white/5 text-center text-zinc-500 font-mono text-xs">
                Sin peticiones pendientes. Cuando un admin solicite Full Access, aparecerá aquí con notificación a pandoras-alerts.
              </div>
            )}
            {pending.map((p, i) => (
              <motion.div key={p.intentId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                <div>
                  <p className="text-xs font-bold text-white font-mono">{p.slug}</p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">
                    Solicitado por {p.requestedBy} · id: {p.intentId?.slice(0, 32)}… · {new Date(p.createdAt).toLocaleString()}
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono mt-0.5">GROWTH_OS · HERMES · CAPITAL · NFT_LAB — plan enterprise sin cobro</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => approve(p.intentId, p.slug)} disabled={busy === p.intentId}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-200 text-xs font-bold hover:bg-violet-500/35 transition-colors disabled:opacity-40">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {busy === p.intentId ? 'Provisionando…' : 'Aprobar'}
                  </button>
                  <span title="Rechazo por omisión: la petición expira sola. No hay riesgo de provisión sin visto bueno."
                    className="inline-flex items-center gap-1 text-zinc-600">
                    <ShieldX className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
