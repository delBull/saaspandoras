'use client';

import { ConnectButton } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { defineChain } from "thirdweb";
import { Shield, ChevronLeft, Globe } from "lucide-react";

export default function ProjectNavigationHeader() {
  return (
    <nav className="backdrop-blur-xl bg-black/20 border-b border-white/5 sticky top-0 z-[100] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="group flex items-center gap-2 text-zinc-400 hover:text-white transition-all text-sm font-medium"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:border-white/20 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </div>
                <span className="hidden sm:inline">Volver</span>
              </button>
              
              <div className="h-6 w-px bg-white/10 hidden md:block" />
              
              <div className="hidden md:flex items-center gap-6">
                <a href="/applicants" className="text-zinc-400 hover:text-white transition-all text-sm font-medium flex items-center gap-2 group">
                  <Globe className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                  Explorar
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Growth OS Secure</span>
            </div>
            
            <ConnectButton 
              client={client}
              theme="dark"
              connectButton={{
                className: "!bg-white !text-black !font-bold !rounded-xl !px-6 !h-10 !text-sm hover:!bg-zinc-200 !transition-all",
                label: "Conectar"
              }}
              appMetadata={{
                name: "Pandoras Growth",
                url: "https://pandoras.finance"
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}