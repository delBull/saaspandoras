'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import {
  UserIcon,
  CurrencyDollarIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/24/outline";
import { PackageCheckIcon, PanelTopIcon } from "lucide-react"
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  disabled: boolean;
}

interface ProfileData {
  kycCompleted?: boolean;
  kycLevel?: string;
}

interface MobileNavMenuProps {
  profile?: ProfileData;
}

export function MobileNavMenu({ profile }: MobileNavMenuProps) {
  const pathname = usePathname();

  // Debug KYC data
  console.log('🔍 MobileNavMenu - Profile KYC data:', {
    profile,
    hasKyc: profile?.kycCompleted,
    kycLevel: profile?.kycLevel
  });

  const navItems: NavItem[] = [
    {
      label: 'Feed',
      href: '/feed',
      icon: <PanelTopIcon className="w-6 h-6" />,
      disabled: true,
    },
    {
      label: 'Creaciones',
      href: '/applicants',
      icon: <PackageCheckIcon className="w-6 h-6" />,
      disabled: false,
    },
    {
      label: 'Hub',
      href: '/', 
      icon: <ViewfinderCircleIcon className="w-6 h-6" />,
      disabled: false, 
    },
    {
      label: 'Wallet',
      href: '/wallet', 
      icon: <CurrencyDollarIcon className="w-6 h-6" />,
      disabled: false, 
    },
    {
      label: 'Perfil',
      href: '/mobile-profile',
      icon: <UserIcon className="w-6 h-6" />,
      disabled: false,
    },
  ];

  return (
    <>
      {/* Mobile Navigation - Fixed Bottom Bar with Dashboard Background */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Background matching dashboard gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 to-black border-t border-zinc-700/50" />
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-950/30 to-transparent" />

        {/* Global selected indicator line at icon level */}
        {navItems.find(item => pathname === item.href && !item.disabled) && (
          <div className="absolute top-[8px] left-2 right-2 h-0.5 bg-white rounded-full opacity-90" />
        )}

        {/* KYC Status Badge - Show for debugging */}
        {profile && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-md backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-green-400 font-medium">
              Nivel {profile.kycLevel === 'basic' ? 'Básico' : 'Avanzado'}
            </span>
          </div>
        )}

        <nav className="relative flex items-center justify-center px-2 py-1 min-h-[60px] backdrop-blur-xl safe_area_inset_bottom">
          {navItems.map((item) => (
            <motion.div
              key={item.label}
              whileTap={!item.disabled ? { scale: 0.95 } : {}}
              className="flex-1 flex justify-center"
            >
              <Link
                href={item.disabled ? '#' : item.href}
                onClick={item.disabled ? (e) => e.preventDefault() : undefined}
                className={`
                  flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
                  min-h-[52px] w-full max-w-[80px] relative
                  ${item.disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : pathname === item.href
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
                  }
                `}
              >
                <div className={`
                  relative mb-1 transition-all duration-300
                  ${pathname === item.href ? 'scale-110' : ''}
                `}>
                  {/* Icon with solid white fill when selected */}
                  <div className={pathname === item.href && !item.disabled ? 'text-white [&_svg]:fill-white [&_svg]:stroke-white' : ''}>
                    {item.icon}
                  </div>
                </div>
                <span className="text-xs font-medium leading-none">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </nav>
      </div>

      {/* Spacer for mobile navigation */}
      <div className="md:hidden h-16" />
    </>
  );
}
