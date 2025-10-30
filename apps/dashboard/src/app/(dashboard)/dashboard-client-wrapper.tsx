'use client';

import { Suspense, useEffect, useState } from "react";
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
// 🎁 AGREGAR DETECCIÓN AUTOMÁTICA DE REFERIDOS
import { useReferralDetection } from "@/hooks/useReferralDetection";
// Reward modal manager inside dashboard wrapper
// 🎮 TODO: IMPORTAR HUD cuando esté funcional en páginas específicas
// import { GamificationHUD } from "@pandoras/gamification";
// import { useGamificationContext } from "@pandoras/gamification";

async function fetchUserName(address: string): Promise<string | null> {
  if (address.toLowerCase() === "0xdd2fd4581271e230360230f9337d5c0430bf44c0") {
    await new Promise(resolve => setTimeout(resolve, 300));
    return "vitalik.eth";
  }
  return null;
}

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
  const [userName, setUserName] = useState<string | null>(null);

  // 🎁 ACTIVAR DETECCIÓN AUTOMÁTICA DE REFERIDOS
  useReferralDetection();

  useEffect(() => {
    if (account?.address) {
      void fetchUserName(account.address).then(name => {
        setUserName(name);
      });

      // Ensure wallet information is available in cookies for server-side requests
      if (typeof window !== 'undefined') {
        document.cookie = `wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
        document.cookie = `thirdweb:wallet-address=${account.address}; path=/; max-age=86400; samesite=strict`;
      }
    } else {
      setUserName(null);
    }
  }, [account?.address]);

  return (
    <TokenPriceProvider>
      <TermsModalProvider>
        <DashboardShell
          wallet={account?.address}
          userName={userName ?? undefined}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          sidebarDefaultOpen={pathname === '/applicants' ? false : undefined}
        >
          <AutoLoginGate serverSession={serverSession}>
           <NFTGate>
             <AnimatePresence mode="wait">
               <motion.div
                 key={pathname}
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 transition={{ duration: 0.3, ease: "easeInOut" }}
               >
                 <Suspense
                   fallback={
                     <div className="p-8 animate-pulse space-y-4">
                       <div className="h-8 w-1/3 rounded bg-fuchsia-950" />
                       <div className="h-64 w-full rounded bg-fuchsia-950" />
                     </div>
                   }
                 >
                   {children}
                 </Suspense>
               </motion.div>
             </AnimatePresence>
           </NFTGate>
          </AutoLoginGate>
        </DashboardShell>

        <TermsModalRenderer />

        {/* 🎮 Reward Modal - Mock implementation */}
        <RewardModalManager />
      </TermsModalProvider>
    </TokenPriceProvider>
  );
}

// Component to manage reward modals globally across the dashboard
function RewardModalManager() {
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [currentReward, setCurrentReward] = useState<Reward | null>(null);
  const { account } = usePersistedAccount();

  useEffect(() => {
    // 🎮 REAL GAMIFICATION LOGIC - Check for first login reward
    if (account?.address) {
      const firstLoginKey = `pandoras_first_login_reward_${account.address}`;
      const alreadyGotFirstLoginReward = localStorage.getItem(firstLoginKey);

      // Only show reward modal if user hasn't received first login reward yet
      if (!alreadyGotFirstLoginReward) {
        console.log('🎯 Showing first login reward modal for:', account.address);

        const firstLoginReward: Reward = {
          type: 'achievement',
          title: 'Primer Login Exitoso',
          description: 'Has conectado exitosamente tu wallet a Pandoras',
          tokens: 10,
          icon: '🔗',
          rarity: 'common'
        };

        // Show modal after a brief delay for better UX
        setTimeout(() => {
          setCurrentReward(firstLoginReward);
          setShowRewardModal(true);
        }, 1500);

        // Mark as shown immediately (localStorage will be set when API response comes)
        // This prevents showing the modal again on page refresh
      } else {
        console.log('ℹ️ User already received first login reward:', account.address);
      }
    }
  }, [account?.address]); // Only re-run if wallet address changes

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
