import React from "react";
import type { CatalogVertical, CatalogProductNature } from "@saasfly/shared";
import { Filter, Layers, Tag } from "lucide-react";

export interface FilterState {
  vertical: CatalogVertical | "ALL";
  productNature: CatalogProductNature | "ALL";
  onlyVerified: boolean;
  searchQuery: string;
}

interface CatalogFilterBarProps {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  totalCount: number;
}

const VERTICAL_OPTIONS: { label: string; value: CatalogVertical | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "RWA / Inmuebles", value: "RWA_REAL_ESTATE" },
  { label: "Growth / Servicios", value: "GROWTH_SERVICES" },
  { label: "Software / SaaS", value: "SAAS_SOFTWARE" },
  { label: "Comunidades / Pases", value: "COMMUNITY_MEMBERSHIP" },
  { label: "E-commerce / Retail", value: "SPECIALTY_GOODS" },
];

export function CatalogFilterBar({ filters, onChange, totalCount }: CatalogFilterBarProps) {
  return (
    <div className="w-full flex flex-col gap-4 bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 md:p-5 backdrop-blur-md shadow-xl">
      {/* Top Search & Count Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Buscar por proyecto, servicio o activo..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-300 bg-zinc-900/60 border border-zinc-800/90 px-3 py-2 rounded-xl hover:border-zinc-700 transition-colors">
            <input
              type="checkbox"
              checked={filters.onlyVerified}
              onChange={(e) => onChange({ ...filters, onlyVerified: e.target.checked })}
              className="rounded bg-zinc-800 border-zinc-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            <span className="font-medium text-emerald-400">Solo Verificados</span>
          </label>

          <div className="text-xs font-mono text-zinc-400 px-3 py-2 rounded-xl bg-zinc-900/40 border border-zinc-800/50">
            {totalCount} {totalCount === 1 ? "oferta" : "ofertas"}
          </div>
        </div>
      </div>

      {/* Vertical Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-zinc-500 font-medium flex items-center gap-1 pl-1 pr-2 shrink-0">
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          Vertical:
        </span>
        {VERTICAL_OPTIONS.map((opt) => {
          const isActive = filters.vertical === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange({ ...filters, vertical: opt.value })}
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800/60"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
