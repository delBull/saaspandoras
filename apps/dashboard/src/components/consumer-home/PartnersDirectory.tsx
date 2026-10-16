import React from "react";
import type { CatalogItemDto } from "@saasfly/shared";
import { Building2, ExternalLink, Globe, ShieldCheck } from "lucide-react";

interface PartnersDirectoryProps {
  items: CatalogItemDto[];
}

export function PartnersDirectory({ items }: PartnersDirectoryProps) {
  // Deduplicate by tenantSlug/canonicalOrgId to show sovereign partner directory
  const partnersMap = new Map<string, CatalogItemDto>();
  for (const item of items) {
    if (!partnersMap.has(item.tenantSlug)) {
      partnersMap.set(item.tenantSlug, item);
    }
  }
  const partners = Array.from(partnersMap.values());

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-400" />
          Directorio de Partners & Ecosistema Soberano
        </h2>
        <p className="text-xs text-zinc-400">
          Red de organizaciones y proyectos desplegados con soberanía digital sobre Pandora&apos;s Growth OS.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {partners.map((partner) => {
          const isExternal = partner.integration.mode === "EXTERNAL_PORTAL" && Boolean(partner.integration.targetUrl);
          const destination = partner.integration.targetUrl || `/project/${partner.slug}`;

          return (
            <div
              key={partner.tenantSlug}
              className="flex flex-col p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all shadow-md group"
            >
              <div className="flex items-center gap-3.5 mb-3">
                {partner.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={partner.logoUrl}
                    alt={partner.tenantName}
                    className="w-12 h-12 rounded-xl object-cover bg-zinc-900 border border-zinc-800"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 font-bold text-lg">
                    {partner.tenantName.charAt(0)}
                  </div>
                )}

                <div className="flex flex-col">
                  <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    {partner.tenantName}
                  </h4>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    /{partner.tenantSlug}
                  </span>
                </div>
              </div>

              <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                {partner.tagline || partner.description}
              </p>

              <div className="mt-auto pt-3 border-t border-zinc-900 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-900/60">
                  <ShieldCheck className="w-3 h-3" />
                  Tenant Verificado
                </span>

                {isExternal ? (
                  <a
                    href={destination}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition-colors"
                  >
                    <span>Portal Oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href={destination}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition-colors"
                  >
                    <span>Explorar Ficha</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
