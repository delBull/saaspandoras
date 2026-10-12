import React from 'react';
import { CheckCircle2, Clock3, Loader2, WifiOff, XCircle } from 'lucide-react';
import type { ActivityBlock } from './passport-view';

const STATE_ICON: Record<string, React.ReactNode> = {
  confirmed: <CheckCircle2 className="h-4 w-4 text-emerald-300" />,
  pending: <Clock3 className="h-4 w-4 text-amber-300" />,
  failed: <XCircle className="h-4 w-4 text-rose-300" />,
  unknown: <CheckCircle2 className="h-4 w-4 text-zinc-500" />,
};

export function ActivityTimeline({ block }: { block: ActivityBlock }) {
  const state = block.state === 'available' && !block.items?.length ? 'empty' : block.state;
  const copy =
    state === 'empty'
      ? 'Sin actividad reciente todavía.'
      : block.message ||
        (state === 'loading'
          ? 'Consultando actividad…'
          : 'Historial de actividad no disponible en este momento.');

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
      <h3 className="mb-4 text-sm font-semibold">Actividad reciente</h3>

      {block.state !== 'available' || !block.items?.length ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          {state === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
          {state === 'unavailable' && <WifiOff className="h-4 w-4" />}
          <span>{copy}</span>
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-white/5 pl-5">
          {block.items.slice(0, 8).map((item) => (
            <li key={item.id} className="relative">
              <span className="absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center">
                {STATE_ICON[item.state] || STATE_ICON.unknown}
              </span>
              <p className="text-sm leading-snug">{item.title}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                {new Date(item.at).toLocaleString('es-MX')} · {item.state}
              </p>
              {item.detail && <p className="mt-0.5 text-xs text-zinc-500">{item.detail}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}