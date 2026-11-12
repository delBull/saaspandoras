import React from 'react';
import Link from 'next/link';
import {
  getProductEntryPath,
  normalizeProductKey,
  productDisplayName,
  type ProvisionableProduct,
} from '@saasfly/shared';

/**
 * Tira de productos del tenant en el hub (overview).
 *
 * Sólo NAVEGA: muestra los productos realmente instalados y enlaza a su entrada.
 * No reimplementa el hub rico (`EcosystemHubClient`, hoy huérfano) ni el
 * sidebar: reutiliza el catálogo canónico para nombre y ruta.
 */

const PRODUCT_BLURB: Record<ProvisionableProduct, string> = {
  HERMES: 'Agentes, conocimiento y operación diaria.',
  GROWTH_OS: 'Campañas, audiencias y contenido.',
  TOKENIZATION: 'RWA: activos tokenizados, gobernanza y tesorería.',
  MEDIA_CO: 'Producción y distribución de contenido.',
};

export function ProductEntryStrip({
  organizationSlug,
  installedProducts,
  activeProduct,
}: {
  organizationSlug: string;
  installedProducts?: string[];
  activeProduct?: string | null;
}) {
  const products = Array.from(
    new Set(
      (installedProducts ?? [])
        .map((p) => normalizeProductKey(p))
        .filter((p): p is ProvisionableProduct => Boolean(p))
    )
  );

  if (products.length === 0) return null;

  const activeKey = normalizeProductKey(activeProduct ?? null);

  return (
    <section aria-label="Tus productos" className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Tus productos</h2>
        <span className="text-[11px] text-zinc-600">{products.length} instalado(s)</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const isActive = activeKey === product;
          return (
            <Link
              key={product}
              href={getProductEntryPath(product, organizationSlug)}
              className={`group rounded-2xl border p-4 transition-colors ${
                isActive
                  ? 'border-emerald-400/30 bg-emerald-400/[0.06] hover:bg-emerald-400/[0.1]'
                  : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white">{productDisplayName(product)}</p>
                {isActive && (
                  <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                    Activo
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{PRODUCT_BLURB[product]}</p>
              <p className="mt-3 text-[11px] text-zinc-500 group-hover:text-zinc-300">
                Entrar →
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
