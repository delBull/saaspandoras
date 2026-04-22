'use client';

import React from 'react';
import Image from 'next/image';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useActiveAccount } from 'thirdweb/react';

interface MobileHeaderProps {
  onMenuClick: () => void;
  profileImage?: string;
}

export function MobileHeader({ onMenuClick, profileImage }: MobileHeaderProps) {
  const account = useActiveAccount();

  return (
    <header className="md:hidden flex items-center justify-between px-6 py-4 bg-black/90 backdrop-blur-xl border-b border-white/5 sticky top-0 z-[60]">
      {/* Logo Area */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 relative">
          <Image
            src="/images/logo_green.png"
            alt="Pandora's Logo"
            fill
            className="object-contain"
          />
        </div>
        <span className="font-bold text-xl tracking-tighter text-white">Pandora's</span>
      </div>

      {/* Right Area: Profile + Burger */}
      <div className="flex items-center gap-5">
        {account && (
          <div className="w-9 h-9 rounded-full border border-lime-400/50 overflow-hidden shadow-lg shadow-lime-400/10">
            <Image
              src={profileImage || '/images/avatars/onlybox2.png'}
              alt="Profile"
              width={36}
              height={36}
              className="object-cover"
            />
          </div>
        )}
        
        <button
          onClick={onMenuClick}
          className="p-1 text-gray-300 hover:text-lime-400 transition-colors"
          aria-label="Open Menu"
        >
          <Bars3Icon className="w-8 h-8" />
        </button>
      </div>
    </header>
  );
}
