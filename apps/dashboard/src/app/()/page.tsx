'use client';

import React, { useState, useMemo, useEffect } from "react";
import { useReadContract, TransactionButton, useActiveAccount } from "thirdweb/react";
import Link from "next/link";
import { config } from "@/config";
import { getContract, prepareContractCall } from "thirdweb";
import { governanceABI as PANDORAS_GOVERNANCE_ABI } from "@/lib/governance-abi";
import { PANDORAS_POOL_ABI } from "@/lib/pandoras-pool-abi"; // Keeping for compatibility if needed
import { UserGroupIcon, ArrowPathIcon, BanknotesIcon, LockClosedIcon, Squares2X2Icon, ShieldCheckIcon, ChevronRightIcon, ChevronLeftIcon, CurrencyDollarIcon, RocketLaunchIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { client } from "@/lib/thirdweb-client";
import { base } from "thirdweb/chains";
import { createWallet } from "thirdweb/wallets";
import { NotificationsPanel } from "@/components/dashboard/notifications-panel";
import { GovernanceParticipationModal } from "@/components/governance/GovernanceParticipationModal";
import { LeadCaptureModal } from "@/components/marketing/LeadCaptureModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";
import { resolveAccessState, AccessState } from "@/lib/access/state-machine";
import { Loader2, ShieldAlert } from "lucide-react";
import { NFTGate } from "@/components/nft-gate";
import { useRouter } from "next/navigation";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const FALLBACK_PROJECTS = [
  {
    id: "fallback-1",
    title: "Pandora's Hub",
    subtitle: "La infraestructura descentralizada para el acceso digital soberano.",
    actionText: "Explorar",
    imageUrl: "/images/dhub3.png",
    projectSlug: "pandoras-protocol"
  }
];

// --- Sub-componentes ---
interface Profile {
  image?: string | null;
  name?: string | null;
}


function TypewriterText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentIndex < text.length) {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, text, delay]);

  return (
    <h1 className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </h1>
  );
}

// --- FEATURED CAROUSEL SECTION (DYNAMIC) ---
function FeaturedCarousel({ projects }: { projects: any[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Safety check: if no projects, render nothing (or helper text if preferred)
  if (!projects || projects.length === 0) return null;

  const currentProject = projects[currentIndex];

  // Navigation handlers
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
      <div className="relative h-full w-full rounded-2xl overflow-hidden group cursor-pointer border border-white/10 shadow-2xl shadow-purple-900/20 aspect-[16/10] md:aspect-auto">
        {/* Background Image */}
        <Image
          src={currentProject.imageUrl || currentProject.coverPhotoUrl}
          alt={currentProject.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Content */}
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full z-10">
          <div className="flex flex-col items-start gap-2">
            <span className="px-2 py-1 bg-white/10 backdrop-blur-md rounded text-[10px] uppercase font-bold text-white tracking-widest border border-white/20">
              Destacado
            </span>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight drop-shadow-lg">{currentProject.title}</h3>
            <p className="text-sm md:text-base text-gray-200 line-clamp-2 max-w-[90%] opacity-90 drop-shadow-md mb-4">{currentProject.subtitle || currentProject.description}</p>

            <Link
              href={`/projects/${currentProject.projectSlug || currentProject.slug}`}
              className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-black bg-white px-5 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg"
            >
              {currentProject.actionText || "Ver Proyecto"} <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Left Arrow - appears only if not at start */}
        {currentIndex > 0 && (
          <button
            onClick={(e) => { e.preventDefault(); prevProject(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all z-20 group/nav"
          >
            <ChevronLeftIcon className="w-5 h-5 group-hover/nav:scale-110 transition-transform" />
          </button>
        )}

        {/* Right Arrow - appears only if not at end */}
        {currentIndex < projects.length - 1 && (
          <button
            onClick={(e) => { e.preventDefault(); nextProject(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all z-20 group/nav"
          >
            <ChevronRightIcon className="w-5 h-5 group-hover/nav:scale-110 transition-transform" />
          </button>
        )}

        {/* Pagination Dots */}
        <div className="absolute top-4 right-4 flex gap-1.5 z-20">
          {projects.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/30'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


// New list item component for Access/Artifacts

// New list item component for Access/Artifacts
function ListItem({ item, isArtifact }: { item: any, isArtifact: boolean }) {
  return (
    <Link href={`/projects/${item.slug}`} className="block">
      <div className="bg-zinc-900/80 border border-zinc-800/50 rounded-xl p-3 flex gap-4 items-center hover:bg-zinc-800 transition-all duration-300 active:scale-[0.98]">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-black border border-zinc-800">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
          {isArtifact && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm px-2 py-1 text-center border-t border-white/10">
              <span className="text-[10px] font-mono font-bold text-cyan-400">{item.price}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 h-full justify-center">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-base text-white truncate">{item.title}</h4>
            {!isArtifact && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 font-bold tracking-wide">GRATIS</span>}
          </div>

          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed opacity-90">
            {item.description}
          </p>

          {isArtifact && <div className="flex items-center gap-2 mt-auto">
            <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">Tier #{item.phaseId}</span>
            <span className="text-[10px] text-cyan-300 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">Utility</span>
          </div>}
        </div>

        {/* Action Icon */}
        <div className="flex-shrink-0 text-gray-600 pr-2">
          <ChevronRightIcon className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}

function AccessArtifactsSection({ accessCards, artifacts }: { accessCards: any[]; artifacts: any[] }) {
  const [activeTab, setActiveTab] = useState<'access' | 'artifact'>('access');

  // Check local arrays provided by prop
  const list = activeTab === 'access' ? accessCards : artifacts;

  return (
    <div id="access-section" className="mt-8 px-5 pb-24">
      {/* Tabs Header */}
      <div className="flex items-center gap-8 border-b border-zinc-800 mb-6">
        <button
          onClick={() => setActiveTab('access')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'access' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Accesos
          {activeTab === 'access' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.7)]" />}
        </button>
        <button
          onClick={() => setActiveTab('artifact')}
          className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'artifact' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
        >
          Artefactos
          {activeTab === 'artifact' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.7)]" />}
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-4">
        {/* Empty State / List */}
        {list.length > 0 ? (
          list.map((item: any) => (
            <ListItem key={item.id} item={item} isArtifact={activeTab === 'artifact'} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <div className="p-3 bg-zinc-900 rounded-full mb-3">
              <Squares2X2Icon className="w-6 h-6 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">No hay {activeTab === 'access' ? 'accesos' : 'artefactos'} activos.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { status, user, ux, isAuthenticated, hasAccess, remoteState } = useAuth();
  const account = useActiveAccount();
  const { isAdmin } = useAdmin();
  const router = useRouter();

  const [leadModal, setLeadModal] = useState(false);
  const [homeData, setHomeData] = useState<{
    featuredProjects: any[];
    accessCards: any[];
    artifacts: any[];
    notifications?: any[];
    profile?: any;
    loading: boolean
  }>({
    featuredProjects: [],
    accessCards: [],
    artifacts: [],
    loading: true
  });

  const accessState = resolveAccessState({
    status,
    user,
    isAdmin,
    remoteState
  });

  useEffect(() => {
    const canBootstrap = !!user?.address && (isAuthenticated || hasAccess);
    const controller = new AbortController();

    const load = async () => {
      if (!canBootstrap) return;
      try {
        const res = await fetch(`/api/bootstrap?wallet=${user.address}`, {
          signal: controller.signal
        });
        if (!res.ok) throw new Error("bootstrap failed");

        const data = await res.json();
        const rawProjects = data.featuredProjects || [];

        setHomeData({
          featuredProjects: rawProjects.length > 0 ? rawProjects : FALLBACK_PROJECTS,
          accessCards: data.accessCards || [],
          artifacts: data.artifacts || [],
          notifications: data.notifications || [],
          profile: data.profile || null,
          loading: false
        });
      } catch (e: any) {
        if (e.name === "AbortError") return;

        setHomeData(prev => ({
          ...prev,
          featuredProjects: FALLBACK_PROJECTS,
          loading: false
        }));
      }
    };

    load();

    return () => controller.abort();
  }, [status, user?.address, isAdmin]); // Re-run if user/status/admin changes

  // ⚡ ELITE UX: Preload NFTGate component chunk when we detect a wallet without access
  useEffect(() => {
    if (accessState === AccessState.WALLET_NO_ACCESS) {
      import("@/components/nft-gate").catch(() => {});
    }
  }, [accessState]);

  // 🟢 CASE 1: LOADING STATE
  if (accessState === AccessState.LOADING) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // 🟢 CASE 2: ERROR STATE (Safety First)
  if (accessState === AccessState.ERROR) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <ShieldAlert className="w-12 h-12 text-red-500 mb-6 animate-pulse" />
        <h2 className="text-2xl font-thin tracking-widest uppercase text-white mb-4">Error de Sincronización</h2>
        <p className="text-zinc-500 text-sm max-w-xs mb-8">El protocolo no pudo verificar tu identidad. Esto puede deberse a la red o a una sesión expirada.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all"
        >
          Reintentar Conexión
        </button>
      </div>
    );
  }

  // 🟢 CASE 3: UNAUTHORIZED → Redirect to Specialized Ritual (/access)
  // This eliminates the "double landing" problem and ensures users enter through the unified funnel.
  useEffect(() => {
    const UNAUTHORIZED_STATES = [
      AccessState.NO_WALLET,
      AccessState.NO_SESSION,
      AccessState.WALLET_NO_ACCESS
    ];
    
    if (UNAUTHORIZED_STATES.includes(accessState)) {
      console.log(`🛡️ [DashboardRoot] Unauthorized state (${accessState}), redirecting to /access...`);
      router.push("/access");
    }
  }, [accessState, router]);

  if (
    accessState === AccessState.NO_WALLET || 
    accessState === AccessState.NO_SESSION || 
    accessState === AccessState.WALLET_NO_ACCESS
  ) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">

      <div className="text-left pt-6 ml-5 mb-6 pr-5">
        <TypewriterText
          text="La Infraestructura para el Acceso Digital."
          className="text-2xl md:text-3xl font-bold text-white tracking-tighter leading-tight"
          delay={500}
        />
        {!user && (
          <div className="mt-4 flex gap-4">
            <Button 
              onClick={() => setLeadModal(true)}
              className="bg-white text-black hover:bg-zinc-200 font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl shadow-lg shadow-white/5"
            >
              Get Started Now
            </Button>
            <Link href="/growth-os">
              <Button 
                variant="outline"
                className="border-zinc-800 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-widest h-10 px-6 rounded-xl"
              >
                Learn More
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Dynamic Featured Carousel + Notifications Grid */}
      {homeData.loading ? (
        // Skeleton logic for Banner
        <div className="relative px-5 mt-6 mb-16 w-full md:max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 aspect-[16/10] md:aspect-[21/9] rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
            <div className="hidden lg:block lg:col-span-1 rounded-2xl bg-zinc-900 animate-pulse border border-zinc-800" />
          </div>
        </div>
      ) : (
        <div className="px-5 mt-6 mb-16 w-full">
          {/* Grid layout driven by Aspect Ratio instead of Fixed Height to prevent scrolling/overlap issues */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Carousel: Uses proper aspect ratio to define grid height */}
            <div id="tour-carousel" className="lg:col-span-3 w-full aspect-[16/10] lg:aspect-[16/9] 2xl:aspect-[21/9]">
              <FeaturedCarousel projects={homeData.featuredProjects} />
            </div>

            {/* Notifications Panel: Stretches to match Carousel on Desktop, Fixed height on Mobile */}
            <div id="tour-notifications" className="lg:col-span-1 w-full h-[400px] lg:h-full">
              <NotificationsPanel
                hasAccess={homeData.accessCards.length > 0}
                notifications={homeData.notifications}
              />
            </div>
          </div>
        </div>
      )}

      {/* Access & Artifacts Tabs Section */}
      {homeData.loading ? (
        <div className="mt-8 px-5 pb-24 flex flex-col gap-4">
          <div className="h-10 w-40 bg-zinc-900 animate-pulse rounded-lg" />
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-zinc-900 animate-pulse rounded-xl" />)}
        </div>
      ) : (
        <div id="tour-assets">
          <AccessArtifactsSection accessCards={homeData.accessCards} artifacts={homeData.artifacts} />
        </div>
      )}
      <LeadCaptureModal 
        isOpen={leadModal} 
        onClose={() => setLeadModal(false)} 
        source="dashboard-home"
      />
    </div>
  );
}
