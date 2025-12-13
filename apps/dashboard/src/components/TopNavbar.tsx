"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  TrophyIcon,
  ChartBarIcon,
  FolderIcon,
  BookOpenIcon,
  WalletIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { useActiveAccount } from "thirdweb/react";
import { ethereum } from "thirdweb/chains";
import { WalletBalance, NetworkSelector, ConnectWalletButton } from "@/components/wallet";
import { SUPPORTED_NETWORKS } from "@/config/networks";
import { usePathname } from "next/navigation";

interface TopNavbarProps {
  wallet?: string;
  userName?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export function TopNavbar({
  wallet: walletProp,
  userName,
  isAdmin: isAdminProp,
  isSuperAdmin: isSuperAdminProp,
}: TopNavbarProps) {

  const [profileDropdown, setProfileDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<{ image?: string; role?: string; projectCount?: number } | null>(null);
  const [dropdownOpenedAt, setDropdownOpenedAt] = useState<number>(0);
  const [copyAnimation, setCopyAnimation] = useState(false);

  const account = useActiveAccount();
  const pathname = usePathname();

  // Multi-chain wallet state - ensure we have a valid chain
  const [selectedChain, setSelectedChain] = useState(ethereum);

  // State for client-side admin status
  const [adminStatus, setAdminStatus] = useState<{
    isAdmin: boolean;
    isSuperAdmin: boolean;
    verified: boolean;
  }>({
    isAdmin: false,
    isSuperAdmin: false,
    verified: false,
  });

  // Track if this is the initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch admin status and user profile when account changes
  useEffect(() => {
    if (isInitialLoad && !account?.address) {
      setIsInitialLoad(false);
      return;
    }

    if (account?.address === undefined && !isInitialLoad) {
      return;
    }

    if (!account?.address) {
      if (!isAdminProp && !isSuperAdminProp) {
        setAdminStatus({ isAdmin: false, isSuperAdmin: false, verified: true });
      }
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/admin/verify", {
          headers: {
            'Content-Type': 'application/json',
            'x-thirdweb-address': account.address,
          }
        });

        if (res.ok) {
          const data = await res.json() as { isAdmin: boolean; isSuperAdmin: boolean };
          setAdminStatus({ ...data, verified: true });
        } else {
          setAdminStatus({
            isAdmin: isAdminProp ?? false,
            isSuperAdmin: isSuperAdminProp ?? false,
            verified: false
          });
        }
      } catch (e) {
        console.error("Error verifying admin status:", e);
        setAdminStatus({
          isAdmin: isAdminProp ?? false,
          isSuperAdmin: isSuperAdminProp ?? false,
          verified: false
        });
      }
    })().catch(console.error);

    // Fetch user profile data
    const fetchProfile = async () => {
      if (account?.address) {
        try {
          const response = await fetch('/api/profile', {
            headers: {
              'Content-Type': 'application/json',
              'x-thirdweb-address': account.address,
              'x-wallet-address': account.address,
              'x-user-address': account.address,
            }
          });
          if (response.ok) {
            const userData = await response.json() as { image?: string; role?: string; projectCount?: number };
            setUserProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    void fetchProfile();
  }, [account?.address, isInitialLoad, isAdminProp, isSuperAdminProp]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdown) {
        const now = Date.now();
        if (now - dropdownOpenedAt < 150) {
          return;
        }

        const target = event.target as Element;
        const profileDropdownContent = document.querySelector('.topnav-profile-dropdown');
        const profileButton = document.querySelector('button[title="Perfil"]');

        const isOnButton = profileButton?.contains(target);
        const isInDropdown = profileDropdownContent?.contains(target);

        if (!isOnButton && !isInDropdown) {
          setProfileDropdown(false);
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && profileDropdown) {
        setProfileDropdown(false);
      }
    };

    if (profileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [profileDropdown, dropdownOpenedAt]);

  // Copy wallet address
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyAnimation(true);
      setTimeout(() => setCopyAnimation(false), 2000);
    } catch (error) {
      console.error('Failed to copy wallet address:', error);
    }
  };

  // Check if we're on specific pages that need special handling
  const isApplicantsPage = pathname === '/applicants';

  // Get panel state from localStorage for dynamic adjustment
  const [panelCollapsed, setPanelCollapsed] = useState(true);

  // Listen for panel state changes
  useEffect(() => {
    if (!isApplicantsPage) return;

    const checkPanelState = () => {
      const stored = localStorage.getItem('applicants-panel-collapsed');
      const isCollapsed = stored === null ? true : stored === 'true'; // Default to true (collapsed)
      setPanelCollapsed(isCollapsed);
    };

    // Check immediately
    checkPanelState();

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'applicants-panel-collapsed') {
        checkPanelState();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events
    const handlePanelChange = () => checkPanelState();
    window.addEventListener('applicants-panel-changed', handlePanelChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('applicants-panel-changed', handlePanelChange);
    };
  }, [isApplicantsPage]);



  return (
    <div className="absolute w-full z-40 md:block hidden pt-4">
      <div className={`bg-gradient-to-r from-purple-950/0 to-black/0 transition-all duration-500 ${isApplicantsPage ? (panelCollapsed ? 'mr-8 lg:mr-12' : 'mr-[240px] lg:mr-[270px]') : ''
        }`}>
        <div className={`px-4 ${isApplicantsPage ? '' : 'max-w-7xl mx-auto'
          }`}>
          <div className="flex items-center">
            {/* Right side - Profile and other items - Always pushed to the right */}
            <div className="flex items-center gap-4 ml-auto">
              {/* Profile Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  const isOpening = !profileDropdown;
                  setProfileDropdown(!profileDropdown);

                  if (isOpening) {
                    setDropdownOpenedAt(Date.now());
                  }
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                title="Perfil"
              >
                <Image
                  src={userProfile?.image ?? '/images/avatars/onlybox2.png'}
                  alt="Profile Avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-lg border border-lime-400"
                />
                <span className="text-sm text-gray-300 font-medium">Perfil</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {profileDropdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-4 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 topnav-profile-dropdown"
          >
            <div className="p-3 space-y-2">
              {/* Wallet Copy Section - FIRST PRIORITY */}
              <button
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors group"
                onClick={(e) => {
                  e.stopPropagation();
                  const fullAddress = account?.address ?? userName ?? walletProp ?? '';
                  void copyWalletAddress(fullAddress);
                }}
                title={`${account?.address ?? userName ?? walletProp ?? ''} - Click to copy wallet`}
              >
                <span className="font-mono text-xs text-gray-400 flex-shrink-0">
                  C:\USER\
                </span>
                <span
                  className={`truncate font-mono text-xs transition-colors ${copyAnimation ? 'text-green-400' : 'text-lime-400 group-hover:text-lime-300'
                    }`}
                >
                  {account?.address ? account.address.substring(0, 8) + '...' + account.address.substring(36, 42) : '...'}
                </span>
                <motion.div
                  animate={{ scale: copyAnimation ? [1, 1.2, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  {copyAnimation ? (
                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-gray-500 group-hover:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </motion.div>
              </button>

              {/* Network & Balance Section - SECOND PRIORITY */}
              <div className="p-2 rounded hidden">
                <div className="text-white text-sm mb-1">Red & Balance</div>
                <div className="space-y-1">
                  <NetworkSelector
                    selectedChain={selectedChain}
                    onChainChange={(chain) => setSelectedChain(chain)}
                    supportedNetworks={SUPPORTED_NETWORKS}
                  />
                  {account && (
                    <WalletBalance
                      selectedChain={selectedChain}
                      accountAddress={account?.address}
                      supportedNetworks={SUPPORTED_NETWORKS}
                    />
                  )}
                </div>
              </div>

              <div className="border-t border-zinc-700 my-2"></div>

              {/* Navigation Items - REMAINING PRIORITIES */}
              <Link
                href="/profile/dashboard"
                onClick={() => setProfileDropdown(false)}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <ChartBarIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Dashboard</div>
                  <div className="text-gray-400 text-xs">Métricas y gestión</div>
                </div>
              </Link>

              <Link
                href="/profile/achievements"
                onClick={() => setProfileDropdown(false)}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <TrophyIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Gamificación</div>
                  <div className="text-gray-400 text-xs">Logros y objetivos</div>
                </div>
              </Link>

              <Link
                href="/education"
                onClick={() => setProfileDropdown(false)}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <BookOpenIcon className="w-5 h-5 text-lime-300" />
                <div>
                  <div className="text-white text-sm">Aprende y Gana</div>
                  <div className="text-gray-400 text-xs">Cursos Web3 con rewards (+toknes)</div>
                </div>
              </Link>

              {(adminStatus.verified ? (adminStatus.isAdmin || adminStatus.isSuperAdmin) : (isAdminProp ?? isSuperAdminProp) ??
                (userProfile?.role === 'applicant' && (userProfile?.projectCount ?? 0) > 0)) && (
                  <Link
                    href="/profile/projects"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                  >
                    <FolderIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white text-sm">Tus Protocolos</div>
                      <div className="text-gray-400 text-xs">
                        {userProfile?.projectCount ? `${userProfile.projectCount} protocolos` : 'Gestionar protocolos'}
                      </div>
                    </div>
                  </Link>
                )}

              {/* Mis Accesos (Participante) */}
              <Link
                href="/my-protocols"
                onClick={() => setProfileDropdown(false)}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <TicketIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Mis Accesos</div>
                  <div className="text-gray-400 text-xs">Artefactos y DAO</div>
                </div>
              </Link>

              <Link
                href="/profile"
                onClick={() => setProfileDropdown(false)}
                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
              >
                <UserIcon className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white text-sm">Configuración</div>
                  <div className="text-gray-400 text-xs">Información personal</div>
                </div>
              </Link>

              <div className="border-t border-zinc-700 my-2"></div>

              {/* Connect/Disconnect Button */}
              <div className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full">
                <WalletIcon className="w-5 h-5 text-gray-400 md:block" />
                <ConnectWalletButton
                  className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
