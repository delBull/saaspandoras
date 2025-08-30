'use client';

import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import { Toaster, toast } from "sonner"; 
import { AlertTriangle } from "lucide-react";
import { ThirdwebProvider } from "thirdweb/react";

import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // AVISO: Es una mejor práctica mover este useEffect a una página específica 
  // (como page.tsx) para que no se muestre en TODAS las páginas de tu app.
  useEffect(() => {
    const timer = setTimeout(() => {
      // 1. El contenido ya no tiene las clases de fondo
      toast.info(
        <div className="flex font-mono items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-zinc-900 shrink-0" />
          <div className="flex flex-col text-left">
            <span className="text-zinc-900 font-semibold">
              Alerta: ¡Verifica que estás en dapp.pandoras.finance!
            </span>
            <span className="text-gray-800 text-sm">
              Para operar, conéctate a la red de Base.
            </span>
          </div>
        </div>,
        // 2. Las clases de estilo se pasan como segundo argumento al toast
        {
          className: 'border-none bg-gradient-to-br from-lime-400 to-emerald-500',
          duration: 6000,
        }
      );
    }, 500);

    return () => clearTimeout(timer);
  }, []); 

  return (
    <html lang="en" suppressHydrationWarning>
      {/* Se añade el gradiente de fondo principal a la aplicación */}
      <body className={`${inter.className} bg-gradient-to-b from-zinc-950 to-black text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ThirdwebProvider>
            {children}
            {/* Se añade el Toaster con la configuración correcta */}
            <Toaster theme="dark" richColors position="top-center" />
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}