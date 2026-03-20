'use client';

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
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

export function MobileSidebar({ isOpen, onClose, isAdmin }: MobileSidebarProps) {
  const pathname = usePathname();

  const links = [
    { label: "Hub", href: "/", icon: <HomeIcon className="w-5 h-5" /> },
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-zinc-950 border-r border-white/5 z-[80] md:hidden flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold tracking-tighter text-white">Pandora's</span>
              <button 
                onClick={onClose}
                className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.label}
                  href={link.comingSoon ? '#' : link.href}
                  onClick={(e) => {
                    if (link.comingSoon) e.preventDefault();
                    else onClose();
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                    pathname === link.href 
                      ? "bg-lime-400/10 text-lime-400 border border-lime-400/20 shadow-[0_0_15px_rgba(163,230,53,0.1)]" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                    link.comingSoon && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg",
                    pathname === link.href ? "bg-lime-400/20" : "bg-zinc-900"
                  )}>
                    {link.icon}
                  </div>
                  <span className="font-medium">{link.label}</span>
                  {link.comingSoon && (
                    <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-600 font-bold">Soon</span>
                  )}
                </Link>
              ))}
            </nav>

            {/* Footer Area inside Drawer */}
            <div className="mt-auto pt-6 border-t border-white/5">
              <div className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5">
                <p className="text-[10px] text-gray-500 font-mono mb-2 uppercase tracking-widest">Growth Engine</p>
                <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 bg-lime-400" />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
