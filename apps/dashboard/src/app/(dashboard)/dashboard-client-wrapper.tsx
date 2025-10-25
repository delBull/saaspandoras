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
      </TermsModalProvider>
    </TokenPriceProvider>
  );
}
