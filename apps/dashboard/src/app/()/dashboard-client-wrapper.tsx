'use client';

import React, { Suspense, useEffect, useState } from "react";
import { DashboardShell } from "@/components/shell";
import { NFTGate } from "@/components/nft-gate";

import { TokenPriceProvider } from "@/contexts/TokenPriceContext";
import { TermsModalProvider, useTermsModal } from "@/contexts/TermsModalContext";
import { TermsModal } from "@/components/ui/terms-modal";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from 'next/navigation';
import { usePersistedAccount } from "@/hooks/usePersistedAccount";
import { AutoLoginGate } from "@/components/AutoLoginGate";
import { RewardModal } from "@/components/RewardModal";
import type { Reward } from "@/components/RewardModal";
// Mobile Navigation Component
import { MobileNavMenu } from "@/components/MobileNavMenu";
// 🎁 AGREGAR DETECCIÓN AUTOMÁTICA DE REFERIDOS
import { useReferralDetection } from "@/hooks/useReferralDetection";
// TopNavbar para el perfil superior
import { TopNavbar } from "@/components/TopNavbar";
import { useProfile } from "@/hooks/useProfile";
// Reward modal manager inside dashboard wrapper
// 🎮 TODO: IMPORTAR HUD cuando esté funcional en páginas específicas
// import { GamificationHUD } from "@pandoras/gamification";
// import { GamificationHUD } from "@pandoras/gamification";
// import { useGamificationContext } from "@pandoras/gamification";
import { GamificationListener } from "@/components/gamification/GamificationListener";
import { TourEngine } from "@/components/onboarding/TourEngine";

// Removed: fetchUserName was a mock function for Vitalik's address
// that was unsafe (hardcoded dependencies) and inefficient (300ms delay)
// The app now works without username fetching for better performance

// Component that uses the terms modal context
function TermsModalRenderer() {
  const { isOpen, closeModal } = useTermsModal();
  return <TermsModal isOpen={isOpen} onClose={closeModal} />;
}

// CAMBIO: Renombra la función (antes era DashboardLayout)
export function DashboardClientWrapper({
  children,
  isAdmin,
  isSuperAdmin,
  serverSession, // <- agregamos la sesión del servidor
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  serverSession?: { address?: string; hasSession: boolean } | null; // <- tipo de sesión server-side
}) {
  const pathname = usePathname();
  const { account } = usePersistedAccount();
  const { profile } = useProfile();
  const [userName, setUserName] = useState<string | null>(null);

  // Estados de loading para controlar UI
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);

  // 🎁 ACTIVAR DETECCIÓN AUTOMÁTICA DE REFERIDOS
  useReferralDetection();

  useEffect(() => {
    // Esperar un poco para que se carguen los datos del perfil antes de mostrar navbar
    if (account?.address) {
      // Esperar 300ms para datos de perfil
      setTimeout(() => {
        setIsLoadingUserData(false);
      }, 300);
      // Ensure wallet information is available in cookies for server-side requests
      if (typeof window !== 'undefined') {
        document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
        document.cookie = `thirdweb:wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
      }
    } else {
      setIsLoadingUserData(false); // Si no hay wallet, no esperamos
    }

    // Username always null for simpler architecture
    setUserName(null);
  }, [account?.address]);

  // 🔴 PANTALLA COMPLETA DE LOADING - OCULTA TODO HASTA 300ms
  if (isLoadingUserData && account?.address) {
    return (
      <TokenPriceProvider>
        <TermsModalProvider>
          {/* LOADING FULLSCREEN PARA TODAS LAS PÁGINAS */}
          <div className="min-h-screen bg-zinc-900 animate-pulse">
            {/* HEADER SIMULADO */}
            <div className="flex items-center justify-center p-4 border-b border-zinc-800">
              <div className="max-w-7xl w-full flex items-center justify-between">
                {/* SIDEBAR SIMULADA */}
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-zinc-700 rounded"></div>
                  <div className="space-y-2">
                    <div className="w-24 h-4 bg-zinc-700 rounded"></div>
                    <div className="w-16 h-3 bg-zinc-700 rounded"></div>
                  </div>
                </div>
                {/* TOPNAVBAR SIMULADA */}
                <div className="w-32 h-8 bg-zinc-700 rounded"></div>
              </div>
            </div>
            {/* CONTENIDO PRINCIPAL SIMULADO */}
            <div className="max-w-7xl mx-auto px-4 py-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="w-48 h-6 bg-zinc-700 rounded"></div>
                    <div className="w-32 h-4 bg-zinc-700 rounded"></div>
                  </div>
                  <div className="w-24 h-8 bg-zinc-700 rounded"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="h-32 bg-zinc-700 rounded"></div>
                  <div className="h-32 bg-zinc-700 rounded"></div>
                  <div className="h-32 bg-zinc-700 rounded"></div>
                </div>
                {/* TABLA O CONTENIDO PRINCIPAL */}
                <div className="space-y-4">
                  <div className="w-full h-8 bg-zinc-700 rounded"></div>
                  <div className="w-full h-64 bg-zinc-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>

          <TermsModalRenderer />
          <RewardModalManager />
        </TermsModalProvider>
      </TokenPriceProvider>
    );
  }

  return (
    <TokenPriceProvider>
      <TermsModalProvider>
        <TourEngine>

          <AutoLoginGate serverSession={serverSession}>
            <DashboardShell
              wallet={account?.address}
              userName={userName ?? undefined}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              sidebarDefaultOpen={pathname === '/applicants' ? false : undefined}
            >
              {/* Top Navbar with Profile - Superior derecha - OK */}
              <div className="relative md:block hidden">
                <TopNavbar
                  wallet={account?.address}
                  userName={userName ?? undefined}
                  isAdmin={isAdmin}
                  isSuperAdmin={isSuperAdmin}
                />
              </div>

              {/* Admin Bypass: Admins skip NFT Gate check only if wallet is connected */}
              {(isAdmin || isSuperAdmin) && account?.address ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="pb-4 md:pb-0 h-full"
                  >
                    {!isLoadingUserData && (
                      <Suspense
                        fallback={
                          <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-100px)] p-8 animate-pulse space-y-6">
                            <div className="h-8 w-64 rounded bg-zinc-800/50" />
                            <div className="h-64 w-full max-w-4xl rounded-2xl bg-zinc-800/30 border border-zinc-800" />
                          </div>
                        }
                      >
                        {children}
                      </Suspense>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : (
                <NFTGate>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pathname || "root"}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="pb-4 md:pb-0 h-full"
                    >
                      {!isLoadingUserData && (
                        <Suspense
                          fallback={
                            <div className="flex flex-col items-center justify-center w-full h-[calc(100vh-100px)] p-8 animate-pulse space-y-6">
                              <div className="h-8 w-64 rounded bg-zinc-800/50" />
                              <div className="h-64 w-full max-w-4xl rounded-2xl bg-zinc-800/30 border border-zinc-800" />
                            </div>
                          }
                        >
                          {children}
                        </Suspense>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </NFTGate>
              )}
            </DashboardShell>
          </AutoLoginGate>

          {/* Mobile Navigation Menu - Fijo al bottom pero solo si no está cargando */}
          {!isLoadingUserData && <MobileNavMenu profile={profile} />}

          <TermsModalRenderer />
          <GamificationListener />

          {/* 🎮 Reward Modal - Mock implementation */}
          <RewardModalManager />
        </TourEngine>
      </TermsModalProvider>
    </TokenPriceProvider>
  );
}

// Interface for referrals data
interface ReferralData {
  status: string;
  referredWalletAddress: string;
}

// Component to manage reward modals globally across the dashboard
function RewardModalManager() {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const { account } = usePersistedAccount();

  const checkForReferralRewards = React.useCallback(async () => {
    if (!account?.address) return;

    try {
      // Check if user has any successful referrals that haven't been rewarded with modal yet
      const referrerWallet = account.address.toLowerCase();
      const referrerResponse = await fetch(`/api/referrals/my-referrals?wallet=${referrerWallet}`);

      if (referrerResponse.ok) {
        const referrerData = (await referrerResponse.json()) as { referrals: ReferralData[] };
        const referrals = referrerData.referrals ?? [];

        // Find referrals that completed but modal not shown yet
        const completedReferrals = referrals.filter((r: ReferralData) =>
          r.status === 'completed' &&
          localStorage.getItem(`referrer_reward_modal_shown_${account.address}_${r.referredWalletAddress}`) !== 'true'
        );

        if (completedReferrals.length > 0) {
          console.log('🎯 Found completed referrals to reward:', completedReferrals.length);

          // Show modal for first unrewarded referral
          const firstReferral = completedReferrals[0]!;

          const referrerReward: Reward = {
            type: 'bonus',
            title: '🎉 ¡Primer referido exitoso!',
            description: `Felicitaciones! Has conseguido tu primer referido exitoso y ganado 200 tokens extra`,
            tokens: 200,
            icon: '🐋',
            rarity: 'epic'
          };

          // Mark as shown to prevent double rewards
          localStorage.setItem(`referrer_reward_modal_shown_${account.address}_${firstReferral.referredWalletAddress}`, 'true');

          // Show modal after welcome modal closes (if any)
          setTimeout(() => {
            setCurrentReward(referrerReward);
            setShowRewardModal(true);
          }, 1000);

        } else {
          console.log('ℹ️ No unrewarded completed referrals found for modal');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error checking referral rewards:', error);
    }
  }, [account?.address, setCurrentReward, setShowRewardModal]);

  useEffect(() => {
    // 🎮 REAL GAMIFICATION LOGIC - Check for first login reward
    if (account?.address) {
      // Check if this specific modal was already shown (prevent double modal bug)
      const modalShownKey = `pandoras_welcome_modal_shown_${account.address}`;
      const modalAlreadyShown = localStorage.getItem(modalShownKey);

      // Show welcome modal only once per user, with anti-double-modal protection
      if (!modalAlreadyShown) {
        console.log('🎉 Showing welcome modal for first-time user:', account.address);

        const welcomeReward: Reward = {
          type: 'achievement',
          title: '¡Bienvenido a Pandoras!',
          description: 'Has conectado exitosamente tu wallet y recibido 10 puntos de gamificación',
          tokens: 10,
          icon: '🎉',
          rarity: 'common'
        };

        // Anti-double-modal: Mark as shown BEFORE showing modal
        localStorage.setItem(modalShownKey, 'true');
        console.log('🔒 Modal marked as shown in localStorage immediately');

        // Show modal with slight delay for better UX
        setTimeout(() => {
          setCurrentReward(welcomeReward);
          setShowRewardModal(true);
        }, 2000); // Increased delay for better UX

      } else {
        // 🎉 CHECK FOR REFERRAL REWARDS - Show modal when user has successful referrals
        void checkForReferralRewards();
      }
    }
  }, [account?.address, checkForReferralRewards]);



  const handleCloseRewardModal = async () => {
    setShowRewardModal(false);
    setCurrentReward(null);

    // Mark reward as shown in localStorage when user closes modal
    if (account?.address) {
      const firstLoginKey = `pandoras_first_login_reward_${account.address}`;
      localStorage.setItem(firstLoginKey, 'true');
      console.log('💾 First login reward marked as shown in localStorage');

      // 🎯 CALL API TO REGISTER THE EVENT AND AWARD POINTS
      try {
        console.log('🎯 Activando evento de primer login para:', account.address);
        const response = await fetch('/api/gamification/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Wallet-Address': account.address,
          },
          body: JSON.stringify({
            walletAddress: account.address,
            eventType: 'DAILY_LOGIN',
            metadata: {
              source: 'first_login_modal',
              points: 10
            }
          })
        });

        if (response.ok) {
          const result = await response.json() as { success: boolean; event?: unknown; pointsAwarded?: number };
          console.log('✅ Evento DAILY_LOGIN registrado exitosamente:', result);
        } else {
          console.error('❌ Error al registrar evento DAILY_LOGIN:', await response.text());
        }
      } catch (error) {
        console.error('❌ Error calling gamification API:', error);
      }
    }
  };

  return (
    <div id="gamification-reward-modal">
      <RewardModal
        isOpen={showRewardModal}
        onClose={handleCloseRewardModal}
        reward={currentReward}
      />
    </div>
  );
}
