'use client';

/**
 * 📦 Pandoras App Consumer Home — Unified Sovereign Portal
 * src/components/consumer-home/ConsumerHomePage.tsx
 */

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Compass, 
  Key, 
  Building2, 
  ChevronRight, 
  Sparkles, 
  Wallet,
  AlertCircle 
} from "lucide-react";
import { sanitizeUrl } from "@saasfly/shared/project-utils";
import type { CatalogItemDto, CatalogResponseDto } from "@saasfly/shared";

import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";

import { CatalogCard } from "./CatalogCard";
import { CatalogFilterBar, type FilterState } from "./CatalogFilterBar";
import { PartnersDirectory } from "./PartnersDirectory";
import { UserSpaceVault } from "./UserSpaceVault";
import { CatalogSkeletonGrid } from "./ConsumerSkeletons";
import { HermesConciergeDrawer } from "./HermesConciergeDrawer";

// Strict compliance with Frozen Contract FC-011: No synthetic fallback projects.

function TypewriterText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [currentIndex, text, delay]);

  return (
    <h1 className={className}>
      {displayText}
      <span className="animate-pulse text-emerald-400">|</span>
    </h1>
  );
}

function FeaturedCarousel({ projects }: { projects: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!projects || projects.length === 0) return null;

  const currentProject = projects[currentIndex];

  const nextProject = () => {
    if (currentIndex < projects.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const prevProject = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div className="relative h-full w-full rounded-2xl overflow-hidden group cursor-pointer border border-zinc-800/80 shadow-2xl shadow-emerald-950/10 aspect-[16/10] md:aspect-auto bg-zinc-950">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sanitizeUrl(currentProject.imageUrl || currentProject.coverPhotoUrl) || "/images/dhub3.png"}
          alt={currentProject.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/50 to-transparent" />

        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-10">
          <div className="flex flex-col items-start gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 px-2.5 py-1 rounded bg-emerald-950/80 border border-emerald-800/60 backdrop-blur-md">
              Destacado
            </span>
            <h2 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
              {currentProject.title}
            </h2>
            <p className="text-xs md:text-sm text-zinc-300 max-w-xl line-clamp-2">
              {currentProject.subtitle || currentProject.description}
            </p>
            {currentProject.projectSlug && (
              <Link
                href={`/project/${currentProject.projectSlug}`}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-colors shadow-lg"
              >
                <span>{currentProject.actionText || "Explorar"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>

        {projects.length > 1 && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); prevProject(); }}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl bg-black/60 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md"
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); nextProject(); }}
              disabled={currentIndex === projects.length - 1}
              className="p-2 rounded-xl bg-black/60 border border-zinc-800 text-zinc-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed backdrop-blur-md"
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConsumerHomePage() {
  const { user } = useAuth();
  const [leadModal, setLeadModal] = useState(false);
  const [conciergeItem, setConciergeItem] = useState<CatalogItemDto | null>(null);

  // Active Main Navigation Tab
  const [activeNavTab, setActiveNavTab] = useState<'explore' | 'vault' | 'partners'>('explore');

  // Featured and Notifications data from bootstrap
  const [bootstrapData, setBootstrapData] = useState<{
    featuredProjects: any[];
    notifications?: any[];
    loading: boolean;
  }>({
    featuredProjects: [],
    loading: true
  });

  // Dedicated Catalog state querying GET /api/v1/catalog
  const [catalogItems, setCatalogItems] = useState<CatalogItemDto[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterState>({
    vertical: 'ALL',
    productNature: 'ALL',
    onlyVerified: false,
    searchQuery: '',
  });

  // 1. Fetch bootstrap data for carousel & notifications
  useEffect(() => {
    const controller = new AbortController();
    const loadBootstrap = async () => {
      try {
        const walletParam = user?.address ? `?wallet=${user.address}` : '';
        const res = await fetch(`/api/bootstrap${walletParam}`, { signal: controller.signal });
        if (!res.ok) throw new Error("bootstrap failed");
        const data = await res.json();
        const rawProjects = data.featuredProjects || [];
        setBootstrapData({
          featuredProjects: rawProjects,
          notifications: data.notifications || [],
          loading: false
        });
      } catch (e: any) {
        if (e.name === "AbortError") return;
        setBootstrapData({
          featuredProjects: [],
          notifications: [],
          loading: false
        });
      }
    };
    loadBootstrap();
    return () => controller.abort();
  }, [user?.address]);

  // 2. Fetch canonical catalog items from GET /api/v1/catalog
  useEffect(() => {
    const controller = new AbortController();
    const loadCatalog = async () => {
      setIsCatalogLoading(true);
      setCatalogError(null);
      try {
        const res = await fetch('/api/v1/catalog', { signal: controller.signal });
        if (!res.ok) throw new Error("No fue posible consultar el catálogo.");
        const data: CatalogResponseDto = await res.json();
        if (data.success && Array.isArray(data.items)) {
          setCatalogItems(data.items);
        } else {
          setCatalogItems([]);
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setCatalogError("Error de sincronización con la red de proyectos.");
      } finally {
        setIsCatalogLoading(false);
      }
    };
    loadCatalog();
    return () => controller.abort();
  }, []);

  // Filtered Catalog Items Memo
  const filteredItems = useMemo(() => {
    return catalogItems.filter((item) => {
      if (filters.vertical !== 'ALL' && item.vertical !== filters.vertical) {
        return false;
      }
      if (filters.productNature !== 'ALL' && item.productNature !== filters.productNature) {
        return false;
      }
      if (filters.onlyVerified && !item.verificationFlags.includes('TENANT_AUTHENTICATED')) {
        return false;
      }
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTenant = item.tenantName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesTenant) return false;
      }
      return true;
    });
  }, [catalogItems, filters]);

  return (
    <div className="min-h-screen bg-[#050508] text-zinc-100 flex flex-col">
      {/* Header & Pitch Hero */}
      <div className="pt-8 px-5 md:px-8 max-w-7xl w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-900">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-semibold">
              Pandora&apos;s Sovereign Portal
            </span>
            <TypewriterText
              text="La Infraestructura para el Acceso Digital y Activos Reales."
              className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mt-1"
              delay={400}
            />
            <p className="text-xs md:text-sm text-zinc-400 mt-2 max-w-2xl leading-relaxed">
              Descubre proyectos, títulos notarizados en RWA, pases de membresía y soluciones empresariales con liquidación verificada.
            </p>
          </div>

          {!user && (
            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => setLeadModal(true)}
                className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/40"
              >
                Comenzar
              </Button>
              <Link href="/growth-os">
                <Button
                  variant="outline"
                  className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 font-medium text-xs px-4 py-2.5 rounded-xl"
                >
                  Conocer Más
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Featured Showcase Carousel & Notifications Panel */}
      <div className="px-5 md:px-8 max-w-7xl w-full mx-auto mt-6">
        {bootstrapData.loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 aspect-[16/10] md:aspect-[21/9] rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-800/80" />
            <div className="hidden lg:block lg:col-span-1 rounded-2xl bg-zinc-900/60 animate-pulse border border-zinc-800/80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 w-full aspect-[16/10] lg:aspect-[16/9] 2xl:aspect-[21/9]">
              <FeaturedCarousel projects={bootstrapData.featuredProjects} />
            </div>

            <div className="lg:col-span-1 w-full h-[360px] lg:h-full">
              <NotificationsPanel
                hasAccess={catalogItems.length > 0}
                notifications={bootstrapData.notifications}
              />
            </div>
          </div>
        )}
      </div>

      {/* Unified Tab Navigation Bar */}
      <div className="px-5 md:px-8 max-w-7xl w-full mx-auto mt-10">
        <div className="flex items-center gap-3 border-b border-zinc-800/90 pb-3">
          <button
            onClick={() => setActiveNavTab('explore')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeNavTab === 'explore'
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Explorar Ofertas</span>
          </button>

          <button
            onClick={() => setActiveNavTab('vault')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeNavTab === 'vault'
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Mi Bóveda Soberana</span>
          </button>

          <button
            onClick={() => setActiveNavTab('partners')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              activeNavTab === 'partners'
                ? "bg-zinc-800 text-emerald-400 border border-zinc-700 shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Directorio de Partners</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="px-5 md:px-8 max-w-7xl w-full mx-auto mt-6 pb-24 flex-1">
        {/* TAB 1: EXPLORAR */}
        {activeNavTab === 'explore' && (
          <div className="flex flex-col gap-6">
            <CatalogFilterBar
              filters={filters}
              onChange={setFilters}
              totalCount={filteredItems.length}
            />

            {isCatalogLoading ? (
              <CatalogSkeletonGrid />
            ) : catalogError ? (
              <div className="p-8 rounded-2xl bg-red-950/20 border border-red-900/40 text-center flex flex-col items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-sm font-semibold text-red-300">{catalogError}</p>
                <p className="text-xs text-zinc-500">Por favor, recargue la página en unos momentos.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-16 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800/80 text-center flex flex-col items-center">
                <Compass className="w-8 h-8 text-zinc-600 mb-2" />
                <h4 className="text-sm font-semibold text-zinc-200">No se encontraron ofertas con los filtros actuales</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">
                  Intenta cambiar la vertical seleccionada o desmarcar el filtro de verificación.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    onConciergeClick={(it) => {
                      setConciergeItem(it);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MI BÓVEDA */}
        {activeNavTab === 'vault' && (
          <UserSpaceVault walletAddress={user?.address || null} />
        )}

        {/* TAB 3: PARTNERS DIRECTORY */}
        {activeNavTab === 'partners' && (
          <PartnersDirectory items={catalogItems} />
        )}
      </div>

      {/* Hermes AI Concierge Drawer */}
      <HermesConciergeDrawer
        item={conciergeItem}
        isOpen={Boolean(conciergeItem)}
        onClose={() => setConciergeItem(null)}
      />

      <LeadCaptureModal
        isOpen={leadModal}
        onClose={() => setLeadModal(false)}
        source="dashboard-home"
      />
    </div>
  );
}
