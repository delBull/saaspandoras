'use client';

import React, { useMemo, useState } from "react";
import {
  PayEmbed,
  useActiveWalletChain,
} from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { defineChain } from "thirdweb/chains";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@saasfly/ui/sheet";
import { ScrollArea } from "@saasfly/ui/scroll-area";
import { cn } from "@/lib/utils";

const defaultChain = defineChain(8453);

const FEE_BPS = Number(process.env.NEXT_PUBLIC_SWAP_FEE_BPS ?? 50);
const FEE_RECIPIENT = process.env.NEXT_PUBLIC_SWAP_FEE_WALLET ?? "";

function TestnetBanner() {
  const chain = useActiveWalletChain();
  const TESTNET_IDS = [ 11155111, 84532, 421614, 534351, 80001, 5, 97, ];
  const chainName = (() => {
    switch (chain?.id) {
      case 11155111: return "Sepolia";
      case 84532: return "Base Sepolia";
      default: return "Testnet";
    }
  })();
  if (!chain?.id || !TESTNET_IDS.includes(chain.id))
    return null;
  return (
    <div className="bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-lg p-2 mb-4 text-center text-xs font-semibold">
      ⚠️ Estás conectado a una red de prueba ({chainName}). No uses fondos reales.
    </div>
  );
}

function Disclaimer() {
  return (
    <div className="mt-6 text-xs text-center text-gray-500 px-4 leading-relaxed">
      <b>Aviso Legal:</b> Este swap es ejecutado por protocolos y smart contracts externos a través de thirdweb. Las tasas, rutas y tiempos pueden variar. Haz tu propio research. No somos responsables por pérdidas o demoras.
    </div>
  );
}

function HelpLink({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mt-2 text-xs text-center">
      <button onClick={onOpen} className="text-lime-600 underline font-semibold hover:text-lime-500 transition">
        ¿Necesitas ayuda?
      </button>
    </div>
  );
}

function HelpSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent 
                className={cn("flex flex-col", "h-auto max-h-[80vh] md:max-h-[500px]", "p-6", "w-full bg-zinc-900 border-t-lime-300/20 text-white", "inset-x-0 bottom-0 rounded-t-lg", "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-full", "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-full")}
            >
                <SheetHeader className="text-left shrink-0">
                    <SheetTitle className="text-2xl font-bold text-white">Centro de Ayuda</SheetTitle>
                    <SheetDescription className="text-gray-400">
                        Preguntas frecuentes sobre el Swap & Bridge.
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="flex-1 mt-4 -mr-6 pr-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 text-gray-300 pb-6">
                        <div>
                            <h4 className="font-bold text-white">¿Qué es un Swap?</h4>
                            <p className="text-xs mt-1">Un &quot;swap&quot; o intercambio te permite cambiar un tipo de criptomoneda por otro, por ejemplo, cambiar tus ETH por USDC. La plataforma busca automáticamente la mejor tasa de cambio disponible.</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white">¿Qué es un Bridge?</h4>
                            <p className="text-xs mt-1">Un &quot;bridge&quot; o puente te permite mover tus tokens de una blockchain a otra. Por ejemplo, mover USDC desde la red de Ethereum a la red de Base. Esto es útil para usar tus fondos en diferentes ecosistemas.</p>
                        </div>
                        <div><h4 className="font-bold text-white">¿Por qué mi transacción tarda?</h4><p className="text-xs mt-1">Los tiempos de transacción dependen de la congestión de la red blockchain. Las transacciones de tipo "bridge" pueden tardar varios minutos, ya que involucran operaciones complejas en dos redes diferentes.</p></div>
                        <div><h4 className="font-bold text-white">¿Quién paga las tarifas de red (Gas)?</h4><p className="text-xs mt-1">El usuario que realiza el swap es quien paga las tarifas de gas. Estas tarifas son un costo de la red blockchain, no de nuestra plataforma. Nuestro sistema busca la ruta más económica para minimizar este costo.</p></div>
                         <div className="md:col-span-2"><h4 className="font-bold text-white">Contacto y Soporte</h4><p className="text-xs mt-1">Si tienes problemas o dudas que no se resuelven aquí, puedes contactarnos en nuestro <a href="#" className="underline text-lime-400">Discord</a> o enviarnos un email a <a href="mailto:soporte@pandoras.finance" className="underline text-lime-400">soporte@pandoras.finance</a>.</p></div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

export default function SwapPage() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const feeCaption = useMemo(() => {
    if (!FEE_BPS || !FEE_RECIPIENT) return null;
    return (
      <span>
        Se cobra una comisión de{" "}
        {(FEE_BPS / 100).toFixed(2)}% en cada swap.
      </span>
    );
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-white">Swap & Bridge</h1>
          <p className="mt-2 text-gray-400">
            Intercambia y puentea tokens entre redes EVM con la mejor tasa disponible.
          </p>
      </div>
      <TestnetBanner />
      <div className="bg-gradient-to-br from-[#18181b] to-[#23272d] rounded-2xl p-3 md:p-4 shadow-2xl border-2 border-lime-300/10">
        <React.Suspense fallback={ <div className="text-center text-gray-600 py-8"> Cargando swap... </div> }>
          <PayEmbed
            client={client}
            theme="dark"
            connectOptions={{ 
                chain: defaultChain,
                connectModal: { showThirdwebBranding: false }
            }}
          />
        </React.Suspense>
      </div>
      <div className="mt-6 mb-2 text-xs text-center text-gray-400 px-4">
        <span>Se cobra una comisión de 0.5% por swap, configurada en tu dashboard de thirdweb.</span>
      </div>
      <Disclaimer />
      <HelpLink onOpen={() => setIsHelpOpen(true)} />
      <HelpSheet open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </div>
  );
}
