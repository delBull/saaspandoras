'use client';

import { Suspense, useEffect, useState } from "react";
import { DashboardShell } from "@/components/shell";
import { NFTGate } from "@/components/nft-gate";
import { ProjectModalProvider } from "@/contexts/ProjectModalContext";
import { TokenPriceProvider } from "@/contexts/TokenPriceContext";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from 'next/navigation';
import { usePersistedAccount } from "@/hooks/usePersistedAccount";

async function fetchUserName(address: string): Promise<string | null> {
  if (address.toLowerCase() === "0xdd2fd4581271e230360230f9337d5c0430bf44c0") {
    await new Promise(resolve => setTimeout(resolve, 300));
    return "vitalik.eth";
  }
  return null;
}

// CAMBIO: Renombra la función (antes era DashboardLayout)
export function DashboardClientWrapper({
  children,
  isAdmin,
  isSuperAdmin,
}: {
  children: React.ReactNode;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const { account } = usePersistedAccount();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    if (account?.address) {
      void fetchUserName(account.address).then(name => {
        setUserName(name);
      });
    } else {
      setUserName(null);
    }
  }, [account?.address]);

  return (
    <ProjectModalProvider>
      <TokenPriceProvider>
        <DashboardShell
          wallet={account?.address}
          userName={userName ?? undefined}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
        >
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
        </DashboardShell>
      </TokenPriceProvider>
    </ProjectModalProvider>
  );
}
