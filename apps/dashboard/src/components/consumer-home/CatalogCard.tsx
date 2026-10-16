import React from "react";
import type { CatalogItemDto, CatalogVerificationFlag } from "@saasfly/shared";
import { 
  ShieldCheck, 
  FileText, 
  ExternalLink, 
  MessageSquare, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  ArrowUpRight 
} from "lucide-react";
import Link from "next/link";

interface CatalogCardProps {
  item: CatalogItemDto;
  onConciergeClick?: (item: CatalogItemDto) => void;
}

const VERTICAL_LABELS: Record<string, string> = {
  RWA_REAL_ESTATE: "RWA / Inmuebles",
  GROWTH_SERVICES: "Growth / Servicios",
  SAAS_SOFTWARE: "Software / SaaS",
  SPECIALTY_GOODS: "Specialty / Retail",
  COMMUNITY_MEMBERSHIP: "Membresía / Comunidad",
  INFRASTRUCTURE: "Infraestructura",
  OTHER: "General",
};

const NATURE_LABELS: Record<string, string> = {
  FRACTIONAL_RIGHT: "Título Notarizado",
  MEMBERSHIP_PASS: "Membresía / Pase",
  ACCESS_LICENSE: "Licencia de Acceso",
  B2B_SERVICE: "Servicio B2B",
  PRODUCT_OFFER: "Producto Físico",
  UTILITY_TOKEN: "Token Utilitario",
};

export function CatalogCard({ item, onConciergeClick }: CatalogCardProps) {
  const isExternal = item.integration.mode === "EXTERNAL_PORTAL" && Boolean(item.integration.targetUrl);
  const isDirect = item.integration.mode === "DIRECT_CHECKOUT";
  const isContact = item.integration.mode === "CONTACT_REQUIRED";

  const renderBadge = (flag: CatalogVerificationFlag) => {
    switch (flag) {
      case "TENANT_AUTHENTICATED":
        return (
          <span
            key={flag}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60"
            title="Tenant con identidad soberana y entidad autenticada"
          >
            <ShieldCheck className="w-3 h-3" />
            Tenant Verificado
          </span>
        );
      case "LEGAL_STRUCTURE_REVIEWED":
        return (
          <span
            key={flag}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-950/80 text-sky-400 border border-sky-800/60"
            title="Estructura legal y plantilla de acuerdo registrada en IPFS"
          >
            <FileText className="w-3 h-3" />
            Legal Auditado
          </span>
        );
      case "CRYPTOGRAPHICALLY_SEALED":
        return (
          <span
            key={flag}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-400 border border-purple-800/60"
            title="Contrato on-chain sellado y desplegado"
          >
            <Lock className="w-3 h-3" />
            On-Chain
          </span>
        );
      case "HERMES_CONCIERGE_ENABLED":
        return (
          <span
            key={flag}
            className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/60"
            title="Agente autónomo Hermes activo para este tenant"
          >
            <Sparkles className="w-3 h-3" />
            Hermes AI
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-emerald-950/20">
      {/* Media Container */}
      <div className="relative w-full h-44 overflow-hidden bg-zinc-900">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-zinc-950 text-zinc-600">
            <span className="text-xs font-mono uppercase tracking-wider">{item.title}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent" />

        {/* Nature Tag */}
        <div className="absolute top-3 left-3">
          <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md bg-zinc-900/90 text-zinc-300 border border-zinc-700/60 backdrop-blur-md">
            {NATURE_LABELS[item.productNature] || item.productNature}
          </span>
        </div>

        {/* Vertical Tag */}
        <div className="absolute top-3 right-3">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-black/60 text-zinc-400 border border-zinc-800 backdrop-blur-md">
            {VERTICAL_LABELS[item.vertical] || item.vertical}
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Verification Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {item.verificationFlags.map((flag) => renderBadge(flag))}
        </div>

        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors line-clamp-1">
            {item.title}
          </h3>
          {item.tagline && (
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{item.tagline}</p>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Pricing & Rail */}
        <div className="mt-auto pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              {item.pricing.isCustomQuote ? "Modalidad" : "Adquisición"}
            </span>
            <span className="text-sm font-semibold text-zinc-100">
              {item.pricing.formatted}
            </span>
          </div>

          {/* CTA Actions */}
          <div className="flex items-center gap-2">
            {isContact && (
              <button
                onClick={() => onConciergeClick?.(item)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-900 text-zinc-200 border border-zinc-700 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Concierge
              </button>
            )}

            {isExternal && item.integration.targetUrl && (
              <a
                href={item.integration.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all shadow-sm"
              >
                <span>{item.integration.ctaLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}

            {isDirect && (
              <Link
                href={item.integration.targetUrl || `/project/${item.slug}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-colors shadow-md shadow-emerald-950"
              >
                <span>{item.integration.ctaLabel}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            )}

            {!isExternal && !isDirect && !isContact && (
              <Link
                href={`/project/${item.slug}`}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                Detalles
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
