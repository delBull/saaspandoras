'use client';

import React, { useState, useMemo, useEffect } from "react";
import { useReadContract, TransactionButton } from "thirdweb/react";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";
import { useProfile } from "@/hooks/useProfile";
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

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

// --- FALLBACK PROJECTS (Hardcoded as requested) ---
const FALLBACK_PROJECTS = [
  {
    id: "fallback-1",
    title: "Pandora's Hub",
    subtitle: "La infraestructura descentralizada para el acceso digital soberano.",
    actionText: "Explorar",
    imageUrl: "/images/dhub3.png",
    projectSlug: "pandoras-protocol"
  },
  {
    id: "fallback-2",
    title: "BlockBunny",
    subtitle: "Ecosistema de gamificación y recompensas.",
    actionText: "Ver Proyecto",
    imageUrl: "/images/blockbunny.jpg",
    projectSlug: "blockbunny"
  }
];

// --- Sub-componentes ---
interface Profile {
  image?: string | null;
  name?: string | null;
}

function MobileHeader({ userName, walletAddress, profile }: { userName: string | null; walletAddress?: string; profile?: Profile }) {
  return (
    <div className="flex md:hidden items-center justify-between w-full mt-5 ml-5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
          <Image
            src={profile?.image ?? '/images/avatars/onlybox2.png'}
            width={24}
            height={24}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-mono text-sm font-semibold text-white">
          {userName ?? (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Not Connected")}
        </span>
      </div>
    </div>
  );
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

function GovernanceSection({ onParticipate }: { onParticipate: () => void }) {
  // Contract Interaction Setup removed from here as it moved to Modal (or unused for the trigger button)
  const isSepolia = config.chain.id !== base.id; // Any testnet/sepolia

  return (
    <div className="flex flex-col gap-4 px-5">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">Gobernanza Pandora&#39;s</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Governance Participation Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent group-hover:from-purple-900/20 transition-all duration-500" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <ShieldCheckIcon className="w-8 h-8 text-purple-400" />
              </div>
              <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full uppercase border border-purple-500/30">
                {isSepolia ? 'Testnet' : 'Oficial'}
              </span>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-1">Participación Gobernanza</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Adquiere participación en la gobernanza de Pandora&#39;s.
                Los fondos impulsan el crecimiento de la plataforma.
              </p>
            </div>

            <div className="mt-2">
              <button
                onClick={onParticipate}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg py-3 px-4 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
              >
                <ShieldCheckIcon className="w-5 h-5" />
                {isSepolia ? 'Participar (0.001 ETH)' : 'Participar (50 USDC)'}
              </button>
              <p className="text-[10px] text-center text-gray-500 mt-2 uppercase tracking-wide">
                {isSepolia ? 'Red Base Sepolia • ETH' : 'Red Base • Min 50 USDC'}
              </p>
            </div>
          </div>
        </div>

        {/* PBOX Coming Soon Card - NEW */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 relative overflow-hidden group flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 to-transparent group-hover:from-indigo-900/20 transition-all duration-500" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-500/20 rounded-lg">
                <RocketLaunchIcon className="w-8 h-8 text-indigo-400" />
              </div>
              <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full uppercase border border-blue-500/30 animate-pulse">
                Coming Soon
              </span>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-1">PBOX Governance Token</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                El token principal de gobernanza del ecosistema. Público y transferible.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded border border-white/5 text-gray-300">ICO Loading...</span>
                <span className="text-xs bg-zinc-800 px-2 py-1 rounded border border-white/5 text-gray-300">ERC-20</span>
              </div>
            </div>

            <button disabled className="w-full bg-zinc-800 text-gray-500 cursor-not-allowed py-2 px-4 rounded-lg font-bold text-sm mt-2 border border-white/5">
              Próximamente
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

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
  const { account } = usePersistedAccount();
  const { profile } = useProfile();
  const [isGovernanceModalOpen, setIsGovernanceModalOpen] = useState(false);

  // Hoist data fetching here to prevent layout shift/empty states
  const [homeData, setHomeData] = useState<{
    featuredProjects: any[];
    accessCards: any[];
    artifacts: any[];
    notifications?: any[]; // optional
    loading: boolean
  }>({
    featuredProjects: [],
    accessCards: [],
    artifacts: [],
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const query = account?.address ? `?wallet=${account.address}` : '';
        const res = await fetch(`/api/home-data${query}`);
        if (res.ok) {
          const json = await res.json();
          // Use DB projects if available, otherwise FALLBACK
          const rawProjects = json.featuredProjects || [];
          setHomeData({
            featuredProjects: rawProjects.length > 0 ? rawProjects : FALLBACK_PROJECTS,
            accessCards: json.accessCards || [],
            artifacts: json.artifacts || [],
            notifications: json.notifications || [], // Add notifications
            loading: false
          });
        } else {
          setHomeData(prev => ({
            ...prev,
            featuredProjects: FALLBACK_PROJECTS,
            loading: false
          }));
        }
      } catch (e) {
        console.error("Failed to fetch data", e);
        setHomeData(prev => ({
          ...prev,
          featuredProjects: FALLBACK_PROJECTS,
          loading: false
        }));
      }
    };
    fetchData();
  }, [account?.address]);

  return (
    <div className="min-h-screen bg-black text-white">
      <MobileHeader userName={null} walletAddress={account?.address} profile={profile} />

      <div className="text-left pt-6 ml-5 mb-6 pr-5">
        <TypewriterText
          text="La Infraestructura para el Acceso Digital."
          className="text-3xl md:text-5xl font-bold text-white tracking-tighter leading-tight"
          delay={500}
        />
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

      {/* Governance Section */}
      <div id="tour-governance" className="mt-8">
        <GovernanceSection onParticipate={() => setIsGovernanceModalOpen(true)} />
      </div>

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

      {/* Governance Participation Modal */}
      <GovernanceParticipationModal
        isOpen={isGovernanceModalOpen}
        onClose={() => setIsGovernanceModalOpen(false)}
      />

    </div>
  );
}
