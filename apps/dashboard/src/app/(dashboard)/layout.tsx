'use client';

import { Suspense } from "react";
import { NFTGate } from "@/components/nft-gate";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/header"; // Usamos el nombre original para mayor claridad

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    // CORREGIDO: Cambiamos 'flex-col' por 'flex-row' para alinear el sidebar y el contenido principal.
    // Eliminamos la clase 'container' de aquí para permitir que el sidebar ocupe todo el alto.
    <div className="flex min-h-screen flex-row bg-zinc-950 text-white">
      <Sidebar />
      {/* NUEVO: Un div que envuelve el Header y el contenido principal */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {/* CORREGIDO: Pasamos la prop 'heading' requerida. También puedes pasar otras props si son necesarias. */}
        <DashboardHeader heading="Dashboard Overview" />
        <main className="container flex-1 p-4 md:p-8">
          <NFTGate>
            <Suspense
              fallback={
                <div className="animate-pulse space-y-4">
                  <div className="h-8 w-[200px] rounded bg-muted" />
                  <div className="h-[400px] w-full rounded bg-muted" />
                </div>
              }
            >
              {children}
            </Suspense>
          </NFTGate>
        </main>
      </div>
    </div>
  );
}