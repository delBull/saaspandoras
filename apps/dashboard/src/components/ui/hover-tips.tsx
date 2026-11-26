'use client';

/**
 * Tooltips de hover para barras de herramientas compactas.
 *
 * Los `title` nativos tardan ~1 s, no se pueden estilizar y desaparecen si el
 * contenedor tiene scroll. Aquí se usa un solo tooltip en portal que sigue al
 * elemento con `data-tip` sobre el que está el mouse.
 *
 * Uso:
 *   <HoverTips><button data-tip="Presentar deck">…</button></HoverTips>
 *
 * Sin dependencias nuevas y sin cambiar el layout: el contenedor es `contents`.
 */
import React, { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TipState {
  text: string;
  top: number;
  left: number;
}

export function HoverTips({
  children,
  side = 'right',
}: {
  children: React.ReactNode;
  side?: 'right' | 'top';
}) {
  const [tip, setTip] = useState<TipState | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  const handleOver = useCallback(
    (event: React.MouseEvent) => {
      const target = (event.target as HTMLElement | null)?.closest?.('[data-tip]') as HTMLElement | null;
      if (!target) return;
      const text = (target.getAttribute('data-tip') || '').trim();
      if (!text) return;

      clearTimer();
      const rect = target.getBoundingClientRect();
      setTip({
        text,
        top: side === 'right' ? rect.top + rect.height / 2 : rect.top - 8,
        left: side === 'right' ? rect.right + 10 : rect.left + rect.width / 2,
      });
    },
    [side],
  );

  const handleOut = useCallback((event: React.MouseEvent) => {
    const next = event.relatedTarget as HTMLElement | null;
    if (next?.closest?.('[data-tip]')) return;
    clearTimer();
    hideTimer.current = setTimeout(() => setTip(null), 60);
  }, []);

  return (
    <div className="contents" onMouseOver={handleOver} onMouseOut={handleOut} onMouseLeave={() => setTip(null)}>
      {children}
      {tip && typeof document !== 'undefined' ? (
        <>{createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              top: tip.top,
              left: tip.left,
              transform: side === 'right' ? 'translateY(-50%)' : 'translate(-50%, -100%)',
              zIndex: 9999,
            }}
            className="pointer-events-none max-w-[16rem] rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5 text-[11px] leading-snug text-white shadow-xl backdrop-blur-sm"
          >
            {tip.text}
          </div>,
          document.body,
        )}</>
      ) : null}
    </div>
  );
}
