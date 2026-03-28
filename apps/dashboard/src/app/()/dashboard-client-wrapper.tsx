'use client';

import React, { Suspense, useEffect, useState } from "react";
import { DashboardShell } from "@/components/shell";
import { NFTGate } from "@/components/nft-gate";

import { TokenPriceProvider } from "@/contexts/TokenPriceContext";
import { TermsModalProvider, useTermsModal } from "@/contexts/TermsModalContext";
import { TermsModal } from "@/components/ui/terms-modal";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from 'next/navigation';
import { useActiveAccount } from "thirdweb/react";
import { AutoLoginGate } from "@/components/AutoLoginGate";
import { RewardModal } from "@/components/RewardModal";
import type { Reward } from "@/components/RewardModal";
// Mobile Navigation Component
import { MobileNavMenu } from "@/components/MobileNavMenu";
import { MobileHeader } from "@/components/MobileHeader";
import { MobileSidebar } from "@/components/MobileSidebar";
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
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/hooks/useAdmin";

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
  const account = useActiveAccount();
  const { user, status: authStatus } = useAuth();
  const { isAdmin: isClientAdmin } = useAdmin();
  const { profile } = useProfile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  // Determinar acceso consolidado (Servidor + Cliente + Easter Egg)
  const hasAccess = isAdmin || isSuperAdmin || user?.hasAccess || isClientAdmin;
  const isAuthorized = hasAccess && authStatus === "has_access";
  const isAuthResolving = authStatus === "booting" || authStatus === "checking_session" || authStatus === "checking_access";

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
        document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=lax`;
        document.cookie = `thirdweb:wallet-address=${account.address}; path=/; max-age=86400; samesite=lax`;
      }
    } else {
      setIsLoadingUserData(false); // Si no hay wallet, no esperamos
    }

    // Username always null for simpler architecture
    setUserName(null);
  }, [account?.address]);

  // 🔴 PANTALLA COMPLETA DE LOADING - Oculta el dashboard hasta que auth esté resuelto
  if ((isLoadingUserData && account?.address) || (isAuthResolving && account?.address)) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-lime-500/20 border-t-lime-400 animate-spin rounded-full" />
        <p className="text-[10px] tracking-[0.5em] text-zinc-600 uppercase animate-pulse">Sincronizando Protocolo...</p>
      </div>
    );
  }

  // Determinar si debemos ocultar el sidebar (Narrativa Genesis en Root)
  const isRoot = pathname === '/';
  const hideSidebar = isRoot && !hasAccess;

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
              hideSidebar={hideSidebar}
            >
              {/* Mobile Header - Visible only on mobile */}
              <MobileHeader 
                onMenuClick={() => setIsMobileSidebarOpen(true)} 
                profileImage={profile?.image ?? undefined} 
              />

              {/* Mobile Sidebar (Drawer) */}
              <MobileSidebar 
                isOpen={isMobileSidebarOpen} 
                onClose={() => setIsMobileSidebarOpen(false)} 
                isAdmin={isAdmin || isSuperAdmin}
              />

              {/* Top Navbar with Profile - Superior derecha - OK */}
              <div className="relative md:block hidden">
                <TopNavbar
                  wallet={account?.address}
                  userName={userName ?? undefined}
                  isAdmin={isAdmin}
                  isSuperAdmin={isSuperAdmin}
                />
              </div>

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
  const account = useActiveAccount();

  const checkForMarketingRewards = React.useCallback(async () => {
    if (!account?.address) return;

    try {
      const modalShownKey = `marketing_reward_modal_shown_${account.address}`;
      if (localStorage.getItem(modalShownKey) === 'true') return;

      const response = await fetch('/api/v1/marketing/rewards/summary', {
        headers: { 'X-Wallet-Address': account.address }
      });

      if (response.ok) {
        const json = await response.json();
        const data = json.data;
        if (data && data.totalXp > 0) {
          console.log(`🔥 [Growth OS] Found pre-login rewards: ${data.totalXp} XP`);
          
          const marketingReward: Reward = {
            type: 'achievement',
            title: '🔥 ¡Bono de Bienvenida!',
            description: `¡Increíble! Ya habías acumulado ${data.totalXp} XP antes de unirte. Los hemos sumado a tu cuenta.`,
            tokens: data.totalXp,
            icon: '🔥',
            rarity: 'rare'
          };

          localStorage.setItem(modalShownKey, 'true');
          
          setTimeout(() => {
            setCurrentReward(marketingReward);
            setShowRewardModal(true);
          }, 4000); // Show after other potential welcome modals
        }
      }
    } catch (error) {
      console.warn('⚠️ [Growth OS] Error checking marketing rewards:', error);
    }
  }, [account?.address, setCurrentReward, setShowRewardModal]);

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
        // 🎉 CHECK FOR ALL REWARDS
        void checkForReferralRewards();
        void checkForMarketingRewards();
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
