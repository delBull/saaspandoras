'use client';

/**
 * Texto con enlaces clickeables (chat interno de Nexus).
 *
 * Sólo presentación: convierte URLs en `<a>` con `target="_blank"` y
 * `rel="noopener noreferrer nofollow"`. No valida el destino ni concede acceso.
 */
import { linkifySegments } from '@/lib/nexus/linkify';

export function LinkifiedText({
  text,
  className,
  linkClassName,
}: {
  text: string;
  className?: string;
  linkClassName?: string;
}) {
  const segments = linkifySegments(text);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.type === 'link' ? (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={
              linkClassName ??
              'underline underline-offset-2 break-all decoration-current/50 hover:decoration-current transition-colors'
            }
            onClick={(event) => event.stopPropagation()}
          >
            {segment.value}
          </a>
        ) : (
          <span key={index}>{segment.value}</span>
        ),
      )}
    </span>
  );
}
