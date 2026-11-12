'use client';

import React, { useEffect, useState } from 'react';

/**
 * Avisos in-app del tenant (trial/gracias, aprobaciones, sistema).
 *
 * Muestra el aviso no leído más reciente como barra superior. Los avisos los
 * crea el cron `trial-reminders` (días 5, 6 y 7 del periodo de 7 días) o los
 * flujos de aprobación.
 */

interface Notification {
  id: string;
  kind: string;
  severity: 'info' | 'warning' | 'critical' | string;
  title: string;
  body: string;
  link: string | null;
  createdAt: string;
  readAt: string | null;
}

const STYLES: Record<string, string> = {
  info: 'border-sky-400/30 bg-sky-400/10 text-sky-100',
  warning: 'border-amber-400/30 bg-amber-400/10 text-amber-100',
  critical: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
};

export function TenantNotificationsBanner({ organizationSlug }: { organizationSlug: string }) {
  const [items, setItems] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v1/hermes/notifications?tenantId=${encodeURIComponent(organizationSlug)}&unread=1&limit=5`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.ok) setItems(data.notifications ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [organizationSlug]);

  const visible = items.filter((n) => !dismissed.has(n.id));
  const headline = visible[0];
  if (!headline) return null;
  const rest = visible.slice(1);

  const dismiss = async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    try {
      await fetch('/api/v1/hermes/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: organizationSlug, ids: [id] }),
      });
    } catch {
      // El aviso ya está oculto en UI; si falla el marcado, reaparecerá luego.
    }
  };

  return (
    <div className={`mx-4 mt-4 rounded-xl border px-4 py-3 text-sm md:mx-6 ${STYLES[headline.severity] ?? STYLES.info}`}>
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-white">{headline.title}</p>
          <p className="mt-0.5 text-xs leading-relaxed opacity-90">{headline.body}</p>
          {headline.link && (
            <a href={headline.link} className="mt-2 inline-block text-xs font-semibold underline underline-offset-2">
              Ver detalles →
            </a>
          )}
          {rest.length > 0 && (
            <p className="mt-2 text-[11px] opacity-70">+{rest.length} aviso(s) más en tu bandeja.</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void dismiss(headline.id)}
          className="shrink-0 rounded-full border border-white/20 px-2 py-0.5 text-[11px] opacity-80 hover:opacity-100"
          aria-label="Marcar como leído"
        >
          ✓
        </button>
      </div>
    </div>
  );
}
