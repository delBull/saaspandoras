'use client';

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useReadContract } from "thirdweb/react";
import { usePersistedAccount } from "@/hooks/usePersistedAccount";
import { useFeaturedProjects } from "@/hooks/useFeaturedProjects";
import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import { config } from "@/config";
import { FeaturedProjectCard } from "@/components/FeaturedProjectCard";
import { PandorasPoolRows } from "~/components/PandorasPoolRows";
import { getContract } from "thirdweb";
import { PANDORAS_POOL_ABI } from "@/lib/pandoras-pool-abi";
import { QrCodeIcon, UserGroupIcon, ArrowPathIcon, BanknotesIcon, LockClosedIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { client } from "@/lib/thirdweb-client";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from 'embla-carousel-react';

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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

/*
function TotalBalance({ total }: { total: number }) {
  return (
    <div className="text-left mt-2 ml-5 md:my-6">
      <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tighter">
        ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </h1>
      <p className="text-xs font-mono font-semibold text-gray-300 mt-2">Total recompensado</p>
    </div>
  );
}
*/

function ActionButton({ icon, label, disabled = false, href }: { icon: React.ReactNode, label: string, disabled?: boolean, href?: string }) {
  const commonClasses = "w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center transition-colors hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed";
  const content = <>{icon}</>;
  return (
    <div className="flex flex-col items-center">
      {href && !disabled ? ( <Link href={href} className={commonClasses}>{content}</Link> ) : ( <button disabled={disabled} className={commonClasses}>{content}</button> )}
      <span className="text-xs font-semibold text-gray-300 text-center">{label}</span>
    </div>
  );
}

interface FeaturedProjectCardData {
  id: string;
  title: string;
  subtitle: string;
  actionText: string;
  imageUrl?: string;
  projectSlug: string;
}

// Función para obtener proyectos featured directamente desde la API
async function getFeaturedProjects(): Promise<FeaturedProjectCardData[]> {
  console.log('🔍 Getting featured projects directly from API...');

  try {
    // Usar la nueva API /api/projects/featured que obtiene directamente desde DB
    const baseUrl = typeof window !== 'undefined' ? '' : 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/projects/featured`, {
      cache: 'no-store', // Asegurar datos frescos
    });

    if (!response.ok) {
      console.warn(`⚠️ Featured API responded with status ${response.status}, returning empty array`);
      return [];
    }

    const projects = await response.json() as Record<string, unknown>[];
    console.log(`✅ Got ${projects.length} featured projects directly from featured API`);

    // Convertir proyectos featured a formato FeaturedProjectCardData
    return projects.map((project: Record<string, unknown>, index: number) => ({
      id: String(project.id ?? `featured-${index}`),
      title: String(project.title ?? 'Proyecto sin título'),
      subtitle: String(project.description ?? 'Descripción no disponible'),
      actionText: 'Dime más',
      imageUrl: String(project.coverPhotoUrl ?? '/images/default-project.jpg'),
      projectSlug: String(project.slug ?? `project-${String(project.id)}`),
    }));
  } catch (error) {
    console.error('❌ Error fetching featured projects:', error);

    // Si la API falla, retornar array vacío - no necesitamos fallback hardcodeado
    return [];
  }
}

function BannersSection() {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps'
  });
  const [emblaRefDesktop, emblaApiDesktop] = useEmblaCarousel({
    align: 'start',
    skipSnaps: false,
    dragFree: false,
    containScroll: 'trimSnaps'
  });
  const [featuredProjects, setFeaturedProjects] = useState<{id: string; title: string; subtitle: string; actionText: string; imageUrl?: string; projectSlug: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  // Usar el hook global de featured projects
  const { featuredProjectIds } = useFeaturedProjects();

  const scrollPrev = () => emblaApiDesktop?.scrollPrev();
  const scrollNext = () => emblaApiDesktop?.scrollNext();

  // Actualizar estado de navegación cuando cambie el scroll
  const updateScrollState = useCallback(() => {
    if (emblaApiDesktop) {
      setCanScrollPrev(emblaApiDesktop.canScrollPrev());
      setCanScrollNext(emblaApiDesktop.canScrollNext());
    }
  }, [emblaApiDesktop]);

  useEffect(() => {
    if (emblaApiDesktop) {
      updateScrollState();
      emblaApiDesktop.on('select', updateScrollState);
      emblaApiDesktop.on('init', updateScrollState);
    }
  }, [emblaApiDesktop, updateScrollState]);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      try {
        const projects = await getFeaturedProjects();
        setFeaturedProjects(projects);
      } catch (error) {
        console.error('Error in fetchFeaturedProjects:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchFeaturedProjects();
  }, []); // No dependencies needed, fetch once on mount

  // Recargar cuando cambien los featured projects del hook
  useEffect(() => {
    if (featuredProjectIds.size > 0) {
      void getFeaturedProjects().then(projects => setFeaturedProjects(projects));
    } else {
      // Si no hay featured projects, vaciar
      setFeaturedProjects([]);
    }
  }, [featuredProjectIds]);

  const handleClose = (idToClose: string) => {
    setFeaturedProjects(prevProjects => prevProjects.filter(p => p.id !== idToClose));
  };

  if (loading) {
    return (
      <div className="my-5">
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[1.1/1] bg-zinc-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredProjects.length === 0) return null;

  return (
    <div className="my-5">
      {/* Desktop: Scroll horizontal cuando hay más de 3 proyectos */}
      <div className="hidden md:block">
        {featuredProjects.length <= 3 ? (
          // 1-3 proyectos: Grid fijo de 3 columnas (vacías si hay menos)
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => {
              const project = featuredProjects[index];
              return project ? (
                <motion.div
                  key={project.id}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <FeaturedProjectCard {...project} onClose={() => handleClose(project.id)} />
                </motion.div>
              ) : (
                <div key={`empty-${index}`} className="aspect-[1.1/1]" />
              );
            })}
          </div>
        ) : (
          // 4+ proyectos: Scroll horizontal con flechas
          <div className="relative">
            {/* Flecha izquierda - solo visible si puede hacer scroll hacia atrás */}
            {canScrollPrev && (
              <button
                onClick={scrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Contenedor scrollable */}
            <div className="overflow-hidden" ref={emblaRefDesktop}>
              <div className="flex gap-2">
                <AnimatePresence mode="popLayout">
                  {featuredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="flex-none w-[calc(33.333333%-8px)] min-w-0"
                    >
                      <FeaturedProjectCard {...project} onClose={() => handleClose(project.id)} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Flecha derecha - solo visible si puede hacer scroll hacia adelante */}
            {canScrollNext && (
              <button
                onClick={scrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-all shadow-lg backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile: Scroll horizontal mejorado */}
      <div className="md:hidden overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4">
          <AnimatePresence mode="popLayout">
            {featuredProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ scale: 0.9, opacity: 0, x: 50 }}
                animate={{ scale: 1, opacity: 1, x: 0 }}
                exit={{ x: -300, opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex-none w-[85%] pl-4"
              >
                <FeaturedProjectCard {...project} onClose={() => handleClose(project.id)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SecondaryTabs({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  const tabs = ["Accesos", "Artefactos"];
  return ( <div className="flex items-center gap-4"> {tabs.map(tab => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-2 text-sm font-bold transition-colors ${activeTab === tab ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}> {tab} </button> ))} </div> );
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
    }, 100); // Speed of typing

    return () => clearTimeout(timer);
  }, [currentIndex, text, delay]);

  return (
    <h1 className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </h1>
  );
}

export default function DashboardPage() {
  const [secondaryTab, setSecondaryTab] = useState("Access");
  const { account } = usePersistedAccount();
  const { profile } = useProfile();

  // Memoize contract to prevent recreation on every render
  const contract = useMemo(() =>
    getContract({ client, chain: config.chain, address: config.poolContractAddress ?? ZERO_ADDRESS, abi: PANDORAS_POOL_ABI }),
    []
  );

  const { data: poolStats, isLoading: isLoadingPool } = useReadContract({
    contract: contract,
    method: "getUserStats",
    params: [account?.address ?? ZERO_ADDRESS],
    queryOptions: {
      enabled: !!account && !!config.poolContractAddress,
    },
  });

  const ethAmount = poolStats ? Number(poolStats[0]) / 1e18 : 0;
  const usdcAmount = poolStats ? Number(poolStats[1]) / 1e6 : 0;
  // const totalInvestmentValue = usdcAmount + (ethAmount * 3000);

  // Add console.log to track renders (remove in production)
  console.log('DashboardPage render - account:', account?.address?.substring(0, 8));

  return (
    <div className="pb-20 md:pb-6">
      <MobileHeader userName={null} walletAddress={account?.address} profile={profile} />
      <div className="text-left pt-2 md:pt-6 ml-5 md:my-6">
        {/* Typewriter Welcome Title */}
        <TypewriterText
          text="La Infraestructura para el Acceso Digital."
          className="text-2xl md:text-5xl font-bold text-white tracking-tighter"
          delay={800}
        />
      </div>
      <div className="grid grid-cols-4 my-6 md:hidden">
        <ActionButton icon={<QrCodeIcon className="w-8 h-8 text-gray-300"/>} label="Depositar" disabled />
        <ActionButton href="/wallet-pro" icon={<ArrowPathIcon className="w-8 h-8 text-gray-300"/>} label="Wallet" />
        <ActionButton href="/applicants" icon={<UserGroupIcon className="w-8 h-8 text-gray-300"/>} label="Protocolos" />
        <ActionButton icon={<BanknotesIcon className="w-8 h-8 text-gray-300"/>} label="Recompensas" disabled />
      </div>
      <BannersSection />
      <div className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-gray-400 px-4">Gobernanza</h3>
          <div className="flex flex-col gap-1 p-2 rounded-lg bg-zinc-900">
            <PandorasPoolRows ethAmount={ethAmount} usdcAmount={usdcAmount} isLoading={isLoadingPool} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4">
            <SecondaryTabs activeTab={secondaryTab} setActiveTab={setSecondaryTab} />
          </div>
          <div className="p-2">
            {secondaryTab === "Accesos" && ( <div className="p-8 text-center text-gray-500 rounded-lg bg-zinc-900"> <LockClosedIcon className="w-10 h-10 mx-auto mb-2" /> <p className="font-bold">Llaves de Acceso</p> <p className="text-sm">Tus NFTs de acceso se listarán aquí.</p> </div> )}
            {secondaryTab === "Artefactos" && ( <div className="p-8 text-center text-gray-500 rounded-lg bg-zinc-900"> <Squares2X2Icon className="w-10 h-10 mx-auto mb-2" /> <p className="font-bold">Artefactos</p> <p className="text-sm">Tus artefactos de aportación.</p> </div> )}
          </div>
        </div>
      </div>
    </div>
  );
}
