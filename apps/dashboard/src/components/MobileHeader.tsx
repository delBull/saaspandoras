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
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-[60]">
      {/* Logo Area */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 relative">
          <Image
            src="/images/logo_green.png" // Align with desktop logo if possible
            alt="Pandora's Logo"
            fill
            className="object-contain"
          />
        </div>
        <span className="font-bold text-lg tracking-tighter text-white">Pandora's</span>
      </div>

      {/* Right Area: Profile + Burger */}
      <div className="flex items-center gap-4">
        {account && (
          <div className="w-8 h-8 rounded-full border border-lime-400 overflow-hidden">
            <Image
              src={profileImage || '/images/avatars/onlybox2.png'}
              alt="Profile"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
        )}
        
        <button
          onClick={onMenuClick}
          className="p-2 -mr-2 text-gray-400 hover:text-white transition-colors"
          aria-label="Open Menu"
        >
          <Bars3Icon className="w-7 h-7" />
        </button>
      </div>
    </header>
  );
}
