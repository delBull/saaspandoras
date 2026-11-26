'use client';

import { useState } from 'react';

/**
 * 🎨 Generador de piezas (ADR-020 §2.3-ter)
 *
 * Llama a `POST /api/v1/hermes/media/render` con el brand kit del tenant y deja
 * el PNG en la biblioteca. La organización la resuelve el servidor desde la
 * sesión; aquí sólo viaja el contenido.
 */

type TemplateId = 'cover' | 'statement' | 'levels' | 'cta';

const TEMPLATES: Array<{ id: TemplateId; label: string; hint: string }> = [
  { id: 'cover', label: 'Portada', hint: 'Foto de fondo + titular (necesita imagen)' },
  { id: 'statement', label: 'Declaración', hint: 'Una idea fuerte; fondo opcional' },
  { id: 'levels', label: 'Niveles', hint: 'Los cuatro niveles; fondo opcional' },
  { id: 'cta', label: 'Cierre / CTA', hint: 'WhatsApp + fondo opcional' },
];

interface Asset {
  id: string;
  url: string;
  title: string;
}

export function MediaComposer({
  organizationSlug,
  assets,
}: {
  organizationSlug: string;
  assets: Asset[];
}) {
  const [template, setTemplate] = useState<TemplateId>('statement');
  const [kicker, setKicker] = useState('');
  const [title, setTitle] = useState('');
  const [goldLine, setGoldLine] = useState(0);
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [phone, setPhone] = useState('+1 833 652-9213');
  const [format, setFormat] = useState<'portrait' | 'feed'>('portrait');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string } | null>(null);

  const lines = title
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `/api/v1/hermes/media/render?organizationSlug=${encodeURIComponent(organizationSlug)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            template,
            kicker: kicker || null,
            lines,
            goldLine: Number.isInteger(goldLine) ? goldLine : null,
            body: body || null,
            imageUrl: imageUrl || null,
            phone: template === 'cta' ? phone : null,
            format,
          }),
        },
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `No se pudo generar (${res.status}).`);
        return;
      }
      setResult({ url: data.url });
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Estudio</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Generar pieza</h2>
      <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-zinc-400">
        Compón una pieza con la identidad del tenant. Se guarda en la biblioteca y te devuelve su URL
        pública para publicar.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={generate} className="mt-4 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Plantilla</span>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as TemplateId)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/25"
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <span className="block text-[10px] text-zinc-600">
              {TEMPLATES.find((t) => t.id === template)?.hint}
            </span>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Formato</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as 'portrait' | 'feed')}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/25"
            >
              <option value="portrait">Vertical 1080×1350</option>
              <option value="feed">Cuadrado 1080×1080</option>
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Kicker</span>
            <input
              value={kicker}
              onChange={(e) => setKicker(e.target.value)}
              placeholder="01"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/25"
            />
          </label>
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Título (una línea por renglón)
            </span>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              placeholder={'No compras un\ndepartamento'}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder-zinc-600 outline-none focus:border-white/25"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Línea en oro
            </span>
            <select
              value={goldLine}
              onChange={(e) => setGoldLine(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/25"
            >
              <option value={-1}>Ninguna</option>
              {lines.map((line, index) => (
                <option key={`${line}-${index}`} value={index}>
                  {index + 1}: {line.slice(0, 40)}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Cuerpo</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={2}
              placeholder="Texto de apoyo (opcional)"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white placeholder-zinc-600 outline-none focus:border-white/25"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              {template === 'cover' ? 'Imagen (obligatoria)' : 'Fondo (opcional)'}
            </span>
            <select
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] text-white outline-none focus:border-white/25"
            >
              <option value="">Sin imagen</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.url}>
                  {asset.title}
                </option>
              ))}
            </select>
          </label>

          {template === 'cta' && (
            <label className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">WhatsApp</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[12px] text-white outline-none focus:border-white/25"
              />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={busy || lines.length === 0 || (template === 'cover' && !imageUrl)}
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-5 py-2.5 text-[12px] font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40"
        >
          {busy ? 'Generando…' : 'Generar pieza'}
        </button>
      </form>

      {result && (
        <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-emerald-300">Pieza lista</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.url} alt="Pieza generada" className="mt-3 w-full max-w-sm rounded-lg" />
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(result.url)}
            className="mt-3 text-[11px] font-mono text-zinc-400 hover:text-zinc-200"
          >
            Copiar URL
          </button>
        </div>
      )}
    </section>
  );
}
