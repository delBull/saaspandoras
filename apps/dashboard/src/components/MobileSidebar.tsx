import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  HomeIcon, 
  UserGroupIcon, 
  AcademicCapIcon, 
  WalletIcon, 
  TrophyIcon,
  Squares2X2Icon,
  ArrowLeftOnRectangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useActiveAccount, useConnectModal, useDisconnect, useActiveWallet } from "thirdweb/react";
import { client } from "@/lib/thirdweb-client";
import { wallets } from "@/lib/wallets";
import { config } from "@/config";
import { useAdmin } from "@/hooks/useAdmin";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileSidebar({ isOpen, onClose, isAdmin: propIsAdmin }: MobileSidebarProps) {
  const pathname = usePathname();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { connect } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { isAdmin: hookIsAdmin, isSuperAdmin } = useAdmin();

  const effectiveIsAdmin = !!propIsAdmin || hookIsAdmin || isSuperAdmin;

  const links = [
    { label: "Hub", href: "/", icon: <HomeIcon className="w-5 h-5" /> },
    ...(effectiveIsAdmin ? [
      { 
        label: "Panel Admin", 
        href: "/admin/dashboard", 
        icon: <ShieldCheckIcon className="w-5 h-5 text-amber-400" />,
        isAdminLink: true 
      }
    ] : []),
    { label: "Market", href: "/dashboard/market", icon: <Squares2X2Icon className="w-5 h-5" />, comingSoon: true },
    { label: "DAO", href: "/dao", icon: <UserGroupIcon className="w-5 h-5" />, comingSoon: true },
    { label: "Aprende y Gana", href: "/education", icon: <AcademicCapIcon className="w-5 h-5" /> },
    { label: "Wallet Pro", href: "/wallet-pro", icon: <WalletIcon className="w-5 h-5" /> },
    { label: "Achievements", href: "/profile/achievements", icon: <TrophyIcon className="w-5 h-5" /> },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - High z-index to overlay bottom navigation bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] md:hidden"
          />
          
          {/* Drawer - Full overlay above bottom navbar */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[270px] max-w-[85vw] bg-zinc-950/95 backdrop-blur-md border-r border-white/10 z-[1000] md:hidden flex flex-col p-4 sm:p-5 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <span className="text-lg font-bold tracking-tighter text-white">Pandora's</span>
              <button 
                onClick={onClose}
                className="p-1.5 -mr-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                aria-label="Cerrar menú"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.comingSoon ? '#' : link.href}
                  onClick={(e) => {
                    if (link.comingSoon) e.preventDefault();
                    else onClose();
                  }}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200",
                    pathname === link.href 
                      ? (link.isAdminLink 
                          ? "bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                          : "bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-[0_0_15px_rgba(163,230,53,0.1)]")
                      : (link.isAdminLink
                          ? "text-amber-400/90 hover:bg-amber-400/10 hover:text-amber-300 border border-amber-500/20"
                          : "text-gray-400 hover:bg-white/5 hover:text-white"),
                    link.comingSoon && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    pathname === link.href 
                      ? (link.isAdminLink ? "bg-amber-400/20" : "bg-lime-400/20")
                      : (link.isAdminLink ? "bg-amber-950/40" : "bg-zinc-900")
                  )}>
                    {link.icon}
                  </div>
                  <span className="font-medium text-xs sm:text-sm">{link.label}</span>
                  {link.isAdminLink && (
                    <span className="ml-auto text-[9px] uppercase tracking-wider text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded font-bold">
                      Admin
                    </span>
                  )}
                  {link.comingSoon && (
                    <span className="ml-auto text-[9px] uppercase tracking-widest text-gray-600 font-bold">Soon</span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Footer Area inside Drawer: Login/Logout */}
            <div className="mt-auto pt-3 border-t border-white/5 space-y-2">
              {!account ? (
                <button
                  onClick={() => {
                    onClose();
                    connect({
                      client,
                      chain: config.chain,
                      showThirdwebBranding: false,
                      showAllWallets: false,
                      size: "compact",
                      wallets,
                    });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-lime-400 text-gray-900 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-lime-400/20 active:scale-95 transition-all"
                >
                  <WalletIcon className="w-4 h-4" />
                  Iniciar Sesión
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Conectado</span>
                      <span className="text-xs font-mono text-lime-400">
                        {account.address.substring(0, 6)}...{account.address.substring(38)}
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-lime-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(163,230,53,0.5)]" />
                  </div>
                  
                  <button
                    onClick={() => {
                      if (wallet) { disconnect(wallet); fetch("/api/auth/logout", { method: "POST" }).catch(() => {}); }
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900 text-red-400 hover:text-red-300 rounded-xl font-bold text-xs border border-red-500/20 active:scale-95 transition-all"
                  >
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </div>
              )}

              <div className="p-2.5 bg-zinc-900/50 rounded-xl border border-white/5">
                <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono mb-1.5 uppercase tracking-widest">
                  <span>Growth Engine</span>
                  <span className="text-lime-400">v1.5</span>
                </div>
                <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-lime-400 to-emerald-500" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

