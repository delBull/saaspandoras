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

  useEffect(() => {
    const timer = setTimeout(() => {
      toast(
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
        {
          style: {
            background: 'linear-gradient(to bottom right, #D9F99D, #4D7C0F)',
            border: '1px solid #A3E635',
          },
          duration: 5000,
        }
      );
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-b from-zinc-950 to-black text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <ThirdwebProvider>
            {children}
            <Toaster theme="dark" richColors position="top-center" />
          </ThirdwebProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}