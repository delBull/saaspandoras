'use client';

import { Suspense, useEffect, useState } from "react";
import { DashboardShell } from "@/components/shell";
import { NFTGate } from "@/components/nft-gate";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from 'next/navigation';
import { useActiveAccount } from "thirdweb/react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

async function fetchUserName(address: string): Promise<string | null> {
  if (address.toLowerCase() === "0xdd2fd4581271e230360230f9337d5c0430bf44c0") {
    await new Promise(resolve => setTimeout(resolve, 300));
    return "vitalik.eth";
  }
  return null;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const account = useActiveAccount();
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

  useEffect(() => {
    const timer = setTimeout(() => {
      toast(
        <div className="flex font-mono items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-zinc-900 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-zinc-900 font-semibold">Alerta: ¡Verifica que estás en dash.pandoras.finance!</span>
            <span className="text-gray-800 text-sm">Para operar, conéctate a la red de Base.</span>
          </div>
        </div>,
        { style: { background: 'linear-gradient(to bottom right, #D9F99D, #4D7C0F)', border: '1px solid #A3E635' }, duration: 5000 }
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DashboardShell wallet={account?.address} userName={userName ?? undefined}>
      <NFTGate>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Suspense fallback={<div className="p-8 animate-pulse space-y-4"><div className="h-8 w-1/3 rounded bg-zinc-800" /><div className="h-64 w-full rounded bg-zinc-800" /></div>}>
              {children}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </NFTGate>
    </DashboardShell>
  );
}