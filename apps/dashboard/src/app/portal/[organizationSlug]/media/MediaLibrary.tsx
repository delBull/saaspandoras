'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Biblioteca de medios del tenant (ADR-020 §2.3-bis).
 *
 * Sube imágenes y devuelve la URL pública que se usa al publicar: Instagram no
 * acepta archivos, sólo URLs https.
 */
interface Asset {
  id: string;
  url: string;
  title: string;
  createdAt: string;
}

export function MediaLibrary({ organizationSlug }: { organizationSlug: string }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const endpoint = `/api/v1/tenant/${encodeURIComponent(organizationSlug)}/media-assets`;

  const load = useCallback(async () => {
    try {
      const res = await fetch(endpoint, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.assets)) setAssets(data.assets);
    } catch {
      // estado vacío
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    setNotice(null);

    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', file.name.replace(/\.[a-z0-9]+$/i, ''));

      const res = await fetch(endpoint, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || `No se pudo subir (${res.status}).`);
        return;
      }
      setNotice('Imagen subida. Ya tienes su URL pública para publicar.');
      await load();
    } catch (err: any) {
      setError(err?.message || 'Error de red.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">Biblioteca</p>
      <h2 className="mt-2 text-lg font-semibold text-white">Medios del tenant</h2>
      <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-zinc-400">
        Material real del proyecto. Cada imagen queda con una URL pública; las redes publican con esa
        URL, no con el archivo. JPG, PNG o WebP hasta 8 MB.
      </p>

      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[12px] text-red-300">
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[12px] text-emerald-200">
          {notice}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-[12px] font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40"
        >
          {uploading ? 'Subiendo…' : 'Subir imagen'}
        </button>
        <span className="text-[10px] text-zinc-600">{assets.length} asset(s)</span>
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="text-[12px] text-zinc-500">Cargando…</p>
        ) : assets.length === 0 ? (
          <p className="text-[12px] text-zinc-500">Todavía no hay imágenes. Sube la primera.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <li key={asset.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt={asset.title} className="h-36 w-full object-cover" />
                <div className="space-y-1 p-3">
                  <p className="truncate text-[12px] text-zinc-200">{asset.title}</p>
                  <button
                    type="button"
                    onClick={() => void navigator.clipboard?.writeText(asset.url)}
                    className="text-[10px] font-mono text-zinc-500 hover:text-zinc-300"
                    title="Copiar URL pública"
                  >
                    Copiar URL
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
