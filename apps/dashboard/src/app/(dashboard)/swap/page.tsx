'use client';

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@saasfly/ui/sheet";
import { ScrollArea } from "@saasfly/ui/scroll-area";
import { cn } from "@/lib/utils";
//import UniswapClon from "~/components/uniswapclon";

// REINTEGRADO: Definición del componente Disclaimer
function Disclaimer() {
  return (
    <div className="mt-6 text-xs text-center text-gray-500 px-4 leading-relaxed">
      <b>Aviso:</b> Esta funcionalidad es provista por Uniswap Labs. Las transacciones y tarifas están sujetas a sus términos y condiciones.
      </div>
   ); 
 }
      {/*
    // Aviso del customSwap
    <div className="mt-6 text-xs text-center text-gray-500 px-4 leading-relaxed">
      <b>Aviso Legal:</b> Este swap es ejecutado por protocolos y smart contracts externos a través de thirdweb. Las tasas, rutas y tiempos pueden variar. Haz tu propio research. No somos responsables por pérdidas o demoras.
      </div>
      */}
  

// REINTEGRADO: Definición del componente HelpLink
function HelpLink({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="mt-2 text-xs text-center">
      <button onClick={onOpen} className="text-lime-600 underline font-semibold hover:text-lime-500 transition">
        ¿Necesitas ayuda?
      </button>
    </div>
  );
}

// REINTEGRADO: Definición del componente HelpSheet
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
                        <div><h4 className="font-bold text-white">¿Qué es un Swap?</h4><p className="text-xs mt-1">Un &quot;swap&quot; o intercambio te permite cambiar un tipo de criptomoneda por otro, por ejemplo, cambiar tus ETH por USDC. La plataforma busca automáticamente la mejor tasa de cambio disponible.</p></div>
                        <div><h4 className="font-bold text-white">¿Qué es un Bridge?</h4><p className="text-xs mt-1">Un &quot;bridge&quot; o puente te permite mover tus tokens de una blockchain a otra. Por ejemplo, mover USDC desde la red de Ethereum a la red de Base. Esto es útil para usar tus fondos en diferentes ecosistemas.</p></div>
                        <div><h4 className="font-bold text-white">¿Por qué mi transacción tarda?</h4><p className="text-xs mt-1">Los tiempos de transacción dependen de la congestión de la red blockchain. Las transacciones de tipo &quot;bridge&quot; pueden tardar varios minutos, ya que involucran operaciones complejas en dos redes diferentes.</p></div>
                        <div><h4 className="font-bold text-white">¿Quién paga las tarifas de red (Gas)?</h4><p className="text-xs mt-1">El usuario que realiza el swap es quien paga las tarifas de gas. Estas tarifas son un costo de la red blockchain, no de nuestra plataforma. Nuestro sistema busca la ruta más económica para minimizar este costo.</p></div>
                         <div className="md:col-span-2"><h4 className="font-bold text-white">Contacto y Soporte</h4><p className="text-xs mt-1">Si tienes problemas o dudas que no se resuelven aquí, puedes contactarnos en nuestro <a href="/" className="underline text-lime-400">Discord.</a></p></div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}


// --- Página Principal (Ahora con la lógica de ayuda) ---
export default function SwapPage() {
  // REINTEGRADO: Estado para controlar el panel de ayuda
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <section className="flex flex-col items-center justify-start min-h-[70vh] py-32 md:py-32">
      <div className="relative w-full max-w-xl bg-gradient-to-br from-[#18181b] to-[#23272d] rounded-3xl md:rounded-[2.5rem] px-2 md:px-8 py-8 shadow-2xl border-2 border-lime-300/10 mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-white text-center mb-3">
          Exchange
        </h1>
        <p className="text-sm text-center text-gray-400 mb-6">
          Intercambia tokens de forma segura a través del protocolo Uniswap
        </p>
        
        {/*<UniswapClon />*/}
        {/*
        <div className="mt-4 mb-1 text-xs text-center text-gray-400">
          <span>
            Se cobra una comisión de 0.5% por swap, destinada a financiar el desarrollo y liquidez del protocolo.
          </span>
        </div>
        */}
      </div>
       <div className="w-full max-w-xl">
        <Disclaimer />
        <HelpLink onOpen={() => setIsHelpOpen(true)} />
        <HelpSheet open={isHelpOpen} onOpenChange={setIsHelpOpen} />
       </div>
    </section>
  );
}