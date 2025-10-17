"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon,
  UserIcon,
  ChevronDoubleRightIcon,
  ChartPieIcon,
  ChartBarIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@saasfly/ui";
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { ethereum } from "thirdweb/chains";
import { WalletBalance, NetworkSelector, ConnectWalletButton } from "@/components/wallet";
import { SUPPORTED_NETWORKS, DEFAULT_NETWORK } from "@/config/networks";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { PanelTopIcon } from "lucide-react";
import { useProjectModal } from "@/contexts/ProjectModalContext";

interface SidebarProps {
  wallet?: string;
  userName?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export function Sidebar({
  wallet: walletProp,
  userName,
  isAdmin: isAdminProp,
  isSuperAdmin: isSuperAdminProp,
}: SidebarProps) {

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [networkDropdown, setNetworkDropdown] = useState(false);
  const [dropdownOpenedAt, setDropdownOpenedAt] = useState<number>(0);
  const [copyAnimation, setCopyAnimation] = useState(false);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { open: openProjectModal } = useProjectModal();

  // Multi-chain wallet state
  const [selectedChain, setSelectedChain] = useState(DEFAULT_NETWORK?.chain || ethereum);

  // State for client-side admin status - Only trust server props if they're explicitly true
  const [adminStatus, setAdminStatus] = useState<{
    isAdmin: boolean;
    isSuperAdmin: boolean;
    verified: boolean; // Track if we've verified with API
  }>({
    isAdmin: false, // Start with false, only trust verified API responses
    isSuperAdmin: false,
    verified: false, // Don't trust server props initially for security
  });

  // Track if this is the initial load to avoid resetting admin status
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Auto-open sidebar when user connects wallet (but not on initial page load)
  useEffect(() => {
    if (account?.address && !open) {
      // Auto-open sidebar when user connects wallet for the first time
      setOpen(true);
    }
  }, [account?.address, open]);

  // Debug logging for admin status (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Admin status check:', {
        serverSide: { isAdmin: isAdminProp, isSuperAdmin: isSuperAdminProp },
        clientSide: adminStatus,
        finalIsAdmin: adminStatus.isAdmin || adminStatus.isSuperAdmin,
        account: account?.address?.substring(0, 8)
      });
    }
  }, [adminStatus, isAdminProp, isSuperAdminProp, account?.address]);

  // Admin verification happens in the main useEffect below

  // Fetch admin status and user profile when account changes
  useEffect(() => {
    // Don't reset admin status on initial load
    if (isInitialLoad && !account?.address) {
      setIsInitialLoad(false);
      return;
    }

    // When wallet disconnects, DON'T reset admin status if we have server confirmation
    // This prevents flickering during wallet reconnection
    if (account?.address === undefined && !isInitialLoad) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔌 Wallet disconnected - preserving server admin status");
      }
      // Don't reset admin status - keep server-side confirmation
      return;
    }

    // When wallet connects OR changes, verify admin status
    if (!account?.address) {
      // No wallet connected - only reset if no server admin confirmation
      if (!isAdminProp && !isSuperAdminProp) {
        if (process.env.NODE_ENV === 'development') {
          console.log("🐭 No wallet connected and no server admin, ensuring admin status is false");
        }
        setAdminStatus({ isAdmin: false, isSuperAdmin: false, verified: true });
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log("🔍 Wallet connected/changed, re-verifying admin status for:", account.address);
    }

    (async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log("🔍 Verifying admin status for:", account.address);
        }
        const res = await fetch("/api/admin/verify", {
          headers: {
            'Content-Type': 'application/json',
            'x-thirdweb-address': account.address, // 🔥 Send wallet address header
          }
        });

        if (res.ok) {
          const data = await res.json() as { isAdmin: boolean; isSuperAdmin: boolean };
          setAdminStatus({ ...data, verified: true });
        } else {
          // If API fails, fall back to server-side props but mark as unverified
          setAdminStatus({
            isAdmin: isAdminProp ?? false,
            isSuperAdmin: isSuperAdminProp ?? false,
            verified: false
          });
        }
      } catch (e) {
        console.error("❌ Error verifying admin status:", e);
        // On error, fall back to server-side props but mark as unverified
        setAdminStatus({
          isAdmin: isAdminProp ?? false,
          isSuperAdmin: isSuperAdminProp ?? false,
          verified: false
        });
      }
    })().catch(console.error);

    // Fetch user profile data using the regular profile API
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
            const userData = await response.json();
            setUserProfile(userData);
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching user profile:', error);
          }
        }
      }
    };

    void fetchProfile();
  }, [account?.address, isInitialLoad, isAdminProp, isSuperAdminProp]);

  // Handle click outside anywhere on screen and escape key to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if any dropdown is open and click is not on the dropdown
      if (!profileDropdown && !networkDropdown) return;

      const target = event.target as Element;
      const now = Date.now();

      // For profile dropdown: check if click is outside dropdown content
      if (profileDropdown) {
        // Ignore clicks that happen too soon after opening (prevent accidental closes)
        if (now - dropdownOpenedAt < 150) {
          return;
        }

        const profileDropdownContent = document.querySelector('.profile-dropdown-content');
        const avatarButton = document.querySelector('button[title="Menú de perfil"]');

        const isOnAvatar = avatarButton?.contains(target);
        const isInDropdown = profileDropdownContent?.contains(target);

        // If click is NOT on avatar button AND NOT inside dropdown content, close it
        if (!isOnAvatar && !isInDropdown) {
          setProfileDropdown(false);
          return;
        }
      }

      // For network dropdown: check if click is outside dropdown content
      if (networkDropdown) {
        const networkDropdownContent = document.querySelector('.network-dropdown-content');
        if (!networkDropdownContent?.contains(target)) {
          setNetworkDropdown(false);
          return;
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (profileDropdown || networkDropdown)) {
        setProfileDropdown(false);
        setNetworkDropdown(false);
      }
    };

    if (profileDropdown) {
      document.addEventListener('mousedown', handleClickOutside, false); // Changed from capture to bubble
      document.addEventListener('keydown', handleEscapeKey, true);
    } else {
      document.removeEventListener('mousedown', handleClickOutside, false);
      document.removeEventListener('keydown', handleEscapeKey, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, false);
      document.removeEventListener('keydown', handleEscapeKey, true);
    };
  }, [profileDropdown, networkDropdown, dropdownOpenedAt]);

  // The final isAdmin status - Only trust verified API responses for security
  const isSuperAdminWallet = account?.address?.toLowerCase() === SUPER_ADMIN_WALLET;
  const isAdmin = adminStatus.verified && (adminStatus.isAdmin || adminStatus.isSuperAdmin || isSuperAdminWallet);

  // Use centralized network configuration
  const supportedNetworks = SUPPORTED_NETWORKS;

  // Copy wallet address with animation feedback
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyAnimation(true);
      // Reset animation after 2 seconds
      setTimeout(() => setCopyAnimation(false), 2000);
    } catch (error) {
      console.error('Failed to copy wallet address:', error);
    }
  };

  // Centralized profile dropdown menu items
  const getProfileDropdownItems = (isMobile = false) => {
    const baseItems = [
      {
        href: "/profile",
        icon: <UserIcon className="w-5 h-5 text-gray-400" />,
        label: "Perfil",
        description: "Información personal",
        onClick: () => {
          setProfileDropdown(false);
          if (isMobile) setMobileOpen(false);
        }
      },
      {
        href: "/profile/dashboard",
        icon: <ChartBarIcon className="w-5 h-5 text-gray-400" />,
        label: "Dashboard",
        description: "Métricas e inversiones",
        onClick: () => {
          setProfileDropdown(false);
          if (isMobile) setMobileOpen(false);
        }
      }
    ];

    // Projects link - only show for admins or applicants with projects
    const projectsItem = (isAdmin || (userProfile?.role === 'applicant' && userProfile?.projectCount > 0)) ? [{
      href: "/profile/projects",
      icon: <FolderIcon className="w-5 h-5 text-gray-400" />,
      label: "Proyectos",
      description: userProfile?.projectCount ? `${userProfile.projectCount} proyectos` : 'Gestionar proyectos',
      onClick: () => {
        setProfileDropdown(false);
        if (isMobile) setMobileOpen(false);
      }
    }] : [];

    return [...baseItems, ...projectsItem];
  };

  const links = useMemo(
    () => [
      {
        label: "Hub",
        href: "/",
        icon: <HomeIcon className="h-5 w-5 shrink-0 text-gray-400" />,
        disabled: false,
      },
      {
        label: "Proyectos",
        href: "/applicants",
        icon: (
          <UserGroupIcon className="h-5 w-5 shrink-0 text-gray-400" />
        ),
        disabled: false,
      },
            {
        label: "Feed", 
        type: "path",
        href: "#",
        icon: (
          <PanelTopIcon className="h-5 w-5 shrink-0 text-gray-400" />
        ),
        comingSoon: true,
        disabled: true,
      },
      {
        label: "Pools",
        href: "#",
        icon: (
          <BanknotesIcon className="h-5 w-5 shrink-0 text-gray-400" />
        ),
        comingSoon: true,
        disabled: true,
      },
      // Enlace solo visible para admin
      ...(isAdmin
        ? [
            {
              label: "Admin Dash",
              href: "/admin/dashboard",
              icon: (
                <ChartPieIcon className="h-5 w-5 shrink-0 text-lime-400" />
              ),
              disabled: false,
              admin: true,
            },
          ]
        : []),
    ],
    [isAdmin]
  );

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };



  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <motion.div
        transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
        animate={{ width: open ? "20rem" : "6rem" }}
        className="relative hidden h-screen flex-col border-r border-gray-800 bg-zinc-900 px-2 pt-20 md:flex"
      >
        <Link href="/" className="z-50">
          <div className="absolute top-12 left-0 right-0 flex justify-center items-center h-8">
            <AnimatePresence initial={false}>
              {open ? (
                  <motion.div
                    key="logo-largo"
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={logoVariants}
                    transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                  >
                    <Image
                      src="/images/logo_finance.png"
                      width={160}
                      height={40}
                      alt="Logo Finance"
                      priority
                      style={{ width: "auto", height: "auto" }}
                    />
                </motion.div>
              ) : (
                <motion.div
                  key="logo-corto"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={logoVariants}
                  transition={{ type: "tween", ease: "easeInOut", duration: 0.2 }}
                >
                  <Image
                    src="/images/logo_green.png"
                    width={32}
                    height={32}
                    alt="Logo"
                    className="h-8 w-8"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-1/2 z-50 flex h-20 w-5 -translate-y-1/2 items-center justify-center rounded-md border-2 border-l-0 border-gray-800 bg-zinc-900 font-mono text-gray-400 transition-colors duration-200 hover:text-white"
        >
          {open ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        <div className="mt-6 mx-2">
          {/* --- ESTADO NO CONECTADO --- */}
          {isClient && !account ? (
            <div className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-2 flex flex-col items-center gap-2">
              <div className="flex items-center space-x-1 w-full">
                <motion.span
                  animate={{ width: open ? "auto" : "2rem" }}
                  className="overflow-hidden whitespace-nowrap font-mono text-xs text-gray-400 flex-shrink-0"
                >
                  {open ? "C:\\PANDORAS\\" : "C:\\"}
                </motion.span>
                <motion.span
                  animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
                  className="truncate font-mono text-xs text-red-500 min-w-0"
                >
                  Not Connected
                </motion.span>
              </div>
            </div>
          ) : (
            // --- ESTADO CONECTADO - TODO DENTRO DEL RECUADRO CON COLOR ---
            <div className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-2 relative">
              <div className="flex items-center space-x-2">
                {/* Avatar (clickeable para dropdown) */}
                <button
                  onClick={(e) => {
                    e.preventDefault(); // Prevent default behavior
                    e.stopPropagation(); // Prevent event bubbling

                    // Immediately toggle the dropdown
                    const isOpening = !profileDropdown;
                    setProfileDropdown(!profileDropdown);

                    // If opening the dropdown, record the timestamp
                    if (isOpening) {
                      setDropdownOpenedAt(Date.now());
                    }
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent default mousedown behavior
                    e.stopPropagation(); // Prevent mousedown propagation
                  }}
                  className="flex-shrink-0 relative hover:bg-zinc-700/30 p-1 rounded transition-colors"
                  title="Menú de perfil"
                >
                        <Image
                          src={userProfile?.image ?? '/images/avatars/rasta.png'}
                          alt="Profile Avatar"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full border border-lime-400"
                        />
                </button>

                {/* Wallet display - copiar al hacer click */}
                <motion.div
                  animate={{ opacity: open ? 1 : 0 }}
                  className="flex-1 flex items-center gap-2"
                >
                  <button
                    className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800/30 rounded px-2 py-1 transition-colors group w-full text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      const fullAddress = account?.address ?? userName ?? walletProp ?? '';
                      void copyWalletAddress(fullAddress);
                    }}
                    title={`${account?.address ?? userName ?? walletProp ?? ''} - Click to copy entire wallet address`}
                  >
                    <span
                      className="overflow-hidden whitespace-nowrap font-mono text-xs text-gray-400 flex-shrink-0"
                    >
                      {open ? "C:\\USER\\" : ""}
                    </span>
                    <span
                      className={`truncate font-mono text-xs transition-colors ${
                        copyAnimation ? 'text-green-400' : 'text-lime-400 group-hover:text-lime-300'
                      }`}
                    >
                      {isClient
                        ? (account?.address ?? walletProp ?? userName ?? "...").substring(0, 8) + '...' + (account?.address ?? walletProp ?? userName ?? "...").substring(36, 42)
                        : "..." }
                    </span>
                    {/* Copy icon with animation */}
                    <motion.div
                      animate={{
                        scale: copyAnimation ? [1, 1.2, 1] : 1,
                        color: copyAnimation ? '#10b981' : undefined
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      {copyAnimation ? (
                        <svg
                          className="w-3 h-3 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </motion.div>
                  </button>
                </motion.div>
              </div>

              {/* Profile Dropdown - Fixed width to prevent compression */}
              <AnimatePresence>
                {profileDropdown && (
                  <>
                    {/* Invisible overlay to position dropdown fixed to viewport */}
                    <div className="fixed inset-0 z-50 pointer-events-none">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-4 top-[152px] w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 pointer-events-auto profile-dropdown-content"
                      >
                        <div className="p-3 space-y-2">
                          {getProfileDropdownItems().map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={item.onClick}
                              className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                            >
                              {item.icon}
                              <div>
                                <div className="text-white text-sm">{item.label}</div>
                                <div className="text-gray-400 text-xs">{item.description}</div>
                              </div>
                            </Link>
                          ))}

                          <div className="border-t border-zinc-700 my-2"></div>

                          {/* Thirdweb ConnectButton - Maneja automáticamente conectar vs gestionar */}
                          <div className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full">
                            <ConnectWalletButton
                              className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full"
                              onConnect={() => {
                                // Don't close dropdown on connect - let user stay in dropdown
                                console.log('🔗 Wallet connected - keeping dropdown open');
                              }}
                              onDisconnect={() => {
                                // Don't close dropdown on disconnect - let user stay in dropdown
                                console.log('🔌 Wallet disconnected - keeping dropdown open');
                              }}
                            />
                          </div>


                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </AnimatePresence>

              {/* Multi-Chain Wallet Interface - Only show when sidebar is expanded */}
              {isClient && account && open && (
                <div className="mt-3 space-y-2">
                  {/* Network Selector */}
                  <NetworkSelector
                    selectedChain={selectedChain}
                    onChainChange={(chain) => setSelectedChain(chain)}
                    supportedNetworks={supportedNetworks}
                  />

                  {/* Wallet Balances */}
                  <WalletBalance
                    selectedChain={selectedChain}
                    accountAddress={account?.address}
                    supportedNetworks={supportedNetworks}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <nav className="mt-4 flex flex-1 flex-col justify-between">
          <div className="flex flex-col gap-0">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "relative flex items-center rounded-lg py-5 font-light text-gray-400 transition-all duration-200 border-b border-gray-800",
                  open ? "px-4" : "w-full justify-center",
                  link.disabled
                    ? "cursor-not-allowed opacity-60"
                    : "hover:bg-gray-800/50 hover:text-white",
                  link.admin &&
                    "font-bold text-lime-400 hover:bg-lime-900/50 hover:text-lime-300"
                )}
                onClick={(e) => link.disabled && e.preventDefault()}
              >
                {link.icon}
                <motion.span
                  animate={{
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0,
                    marginLeft: open ? "0.75rem" : "0",
                  }}
                  className="whitespace-nowrap"
                >
                  {link.label}
                </motion.span>
                {link.comingSoon && open && (
                  <motion.span
                    animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
                    className="ml-auto text-xs text-gray-500 italic"
                  >
                    coming soon
                  </motion.span>
                )}
              </Link>
            ))}
          </div>

          <div className="mb-4 flex flex-col gap-2">
            {/* Show "Aplicar Proyecto" button only when CONNECTED */}
            {isClient && account && (
              <div
                className={cn(
                  "border-t border-gray-800 pt-2",
                  !open && "mx-auto w-full"
                )}
              >
                <button
                  onClick={() => {
                    // Open the project application modal using context
                    void openProjectModal();
                  }}
                  className={cn(
                    "relative flex w-full items-center rounded-lg py-2 transition-all duration-200 text-gray-400 hover:bg-purple-800/20",
                    open ? "px-4" : "justify-center"
                  )}
                >
                  <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                  <motion.span
                    animate={{
                      opacity: open ? 1 : 0,
                      width: open ? "auto" : 0,
                      marginLeft: open ? "0.75rem" : "0",
                    }}
                    className="whitespace-nowrap text-xs italic"
                  >
                    {open ? "Aplicar Proyecto" : "🔗"}
                  </motion.span>
                </button>
              </div>
            )}

            {isClient && account && (
              <div
                className={cn(
                  "border-t border-gray-800 pt-2",
                  !open && "mx-auto w-full"
                )}
              >
                <button
                  onClick={() => wallet && disconnect(wallet)}
                  disabled={!wallet}
                  className={cn(
                    "relative flex w-full items-center rounded-lg py-2 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50",
                    open ? "px-4" : "justify-center"
                  )}
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                  <motion.span
                    animate={{
                      opacity: open ? 1 : 0,
                      width: open ? "auto" : 0,
                      marginLeft: open ? "0.75rem" : "0",
                    }}
                    className="whitespace-nowrap"
                  >
                    Desconectar
                  </motion.span>
                </button>
              </div>
            )}
            {isClient && isAdmin && (
              <div
                className={cn(
                  "border-t border-gray-800 pt-2",
                  !open && "mx-auto w-full"
                )}
              >
                <span
                  className={cn(
                    "relative flex items-center rounded-lg py-2 text-red-700 transition-all duration-200 cursor-not-allowed opacity-50",
                    open ? "px-4" : "w-full justify-center"
                  )}
                >
                  <ShieldCheckIcon className="h-5 w-5 shrink-0" />
                  <motion.span
                    animate={{
                      opacity: open ? 1 : 0,
                      width: open ? "auto" : 0,
                      marginLeft: open ? "0.75rem" : "0",
                    }}
                    className="whitespace-nowrap font-bold"
                  >
                    Admin
                  </motion.span>
                </span>
              </div>
            )}
          </div>
        </nav>
      </motion.div>

      {/* --- BOTÓN MOBILE --- */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "md:hidden fixed z-10 top-3 left-0 flex items-center justify-center h-16 w-5 bg-zinc-800 border-y border-r border-gray-700 rounded-r-lg shadow-lg text-gray-500 hover:text-white hover:bg-zinc-700 transition-all duration-200"
        )}
      >
        <ChevronDoubleRightIcon className="h-4 w-4" />
      </button>

      {/* --- MOBILE SIDEBAR --- */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col bg-zinc-900 px-2 pt-12 md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 z-50 rounded-lg p-1 text-gray-400 transition-colors duration-200 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              <div className="mt-6 mx-2">
                {isClient && !account ? (
                  <div className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-2 flex flex-col items-center gap-2">
                    <div className="flex items-center space-x-1 w-full">
                      <span className="font-mono text-xs text-gray-400 flex-shrink-0">
                        C:\PANDORAS\
                      </span>
                      <span className="truncate font-mono text-xs text-red-500 min-w-0">
                        Not Connected
                      </span>
                    </div>
                  </div>
                ) : (
                  // --- ESTADO CONECTADO - MISMO FORMATO QUE DESKTOP ---
                  <div className="w-full rounded-lg border border-gray-700 bg-gray-800/50 p-2 relative">
                    <div className="flex items-center space-x-2">
                      {/* Avatar (clickeable para dropdown) */}
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Prevent default behavior
                          e.stopPropagation(); // Prevent event bubbling

                          // Immediately toggle the dropdown
                          const isOpening = !profileDropdown;
                          setProfileDropdown(!profileDropdown);

                          // If opening the dropdown, record the timestamp
                          if (isOpening) {
                            setDropdownOpenedAt(Date.now());
                          }
                        }}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent default mousedown behavior
                          e.stopPropagation(); // Prevent mousedown propagation
                        }}
                        className="flex-shrink-0 relative hover:bg-zinc-700/30 p-1 rounded transition-colors"
                        title="Menú de perfil"
                      >
                        <Image
                          src={userProfile?.image ?? '/images/avatars/rasta.png'}
                          alt="Profile Avatar"
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full border border-lime-400"
                        />
                        {userProfile?.kycLevel === 'basic' && (
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-zinc-900 bg-green-500"></div>
                        )}
                      </button>

                      {/* Wallet display - copiar al hacer click */}
                      <motion.div
                        animate={{ opacity: open ? 1 : 0 }}
                        className="flex-1 flex items-center gap-2"
                      >
                        <button
                          className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800/30 rounded px-2 py-1 transition-colors group w-full text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            const fullAddress = account?.address ?? userName ?? walletProp ?? '';
                            void copyWalletAddress(fullAddress);
                          }}
                          title={`${account?.address ?? userName ?? walletProp ?? ''} - Click to copy entire wallet address`}
                        >
                          <span className="font-mono text-xs text-gray-400 flex-shrink-0">
                            C:\USER\
                          </span>
                          <span
                            className={`truncate font-mono text-xs transition-colors ${
                              copyAnimation ? 'text-green-400' : 'text-lime-400 group-hover:text-lime-300'
                            }`}
                          >
                            {isClient
                              ? (account?.address ?? walletProp ?? userName ?? "...").substring(0, 8) + '...' + (account?.address ?? walletProp ?? userName ?? "...").substring(36, 42)
                              : "..." }
                          </span>
                          {/* Copy icon with animation */}
                          <motion.div
                            animate={{
                              scale: copyAnimation ? [1, 1.2, 1] : 1,
                              color: copyAnimation ? '#10b981' : undefined
                            }}
                            transition={{ duration: 0.3 }}
                            className="flex-shrink-0"
                          >
                            {copyAnimation ? (
                              <svg
                                className="w-3 h-3 text-green-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg
                                className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </motion.div>
                        </button>
                      </motion.div>
                    </div>

                    {/* Profile Dropdown - MOBILE VERSION */}
                    <AnimatePresence>
                      {profileDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 profile-dropdown-content"
                        >
                          <div className="p-3 space-y-2">
                            {getProfileDropdownItems(true).map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={item.onClick}
                                className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                              >
                                {item.icon}
                                <div>
                                  <div className="text-white text-sm">{item.label}</div>
                                  <div className="text-gray-400 text-xs">{item.description}</div>
                                </div>
                              </Link>
                            ))}

                        <div className="border-t border-zinc-700 my-2"></div>

                        {/* Thirdweb ConnectButton - Maneja automáticamente conectar vs gestionar */}
                        <div className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full">
                          <ConnectWalletButton
                            className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full"
                            onConnect={() => {
                              // Don't close dropdown on connect - let user stay in dropdown
                              console.log('🔗 Mobile wallet connected - keeping dropdown open');
                              setMobileOpen(false); // Still close mobile sidebar
                            }}
                            onDisconnect={() => {
                              // Don't close dropdown on disconnect - let user stay in dropdown
                              console.log('🔌 Mobile wallet disconnected - keeping dropdown open');
                              setMobileOpen(false); // Still close mobile sidebar
                            }}
                          />
                        </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Multi-Chain Wallet Interface - Mobile */}
                    {isClient && account && (
                      <div className="mt-3 space-y-2">
                        {/* Network Selector - Mobile */}
                        <NetworkSelector
                          selectedChain={selectedChain}
                          onChainChange={(chain) => setSelectedChain(chain)}
                          supportedNetworks={supportedNetworks}
                        />

                        {/* Wallet Balances - Mobile */}
                        <WalletBalance
                          selectedChain={selectedChain}
                          accountAddress={account?.address}
                          supportedNetworks={supportedNetworks}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <nav className="mt-4 flex flex-1 flex-col justify-between px-2">
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <Link
                      key={`mobile-${link.label}`}
                      href={link.href}
                      className={cn(
                        "relative flex items-center rounded-lg py-2 px-4 text-gray-400 transition-all duration-200",
                        link.disabled
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-gray-800/50 hover:text-white",
                        link.admin &&
                          "font-bold text-lime-400 hover:bg-lime-900/50 hover:text-lime-300"
                      )}
                      onClick={(e) => {
                        if (link.disabled) e.preventDefault();
                        else setMobileOpen(false);
                      }}
                    >
                      {link.icon}
                      <span className="ml-3 whitespace-nowrap">
                        {link.label}
                      </span>
                      {link.comingSoon && (
                        <span className="ml-auto text-xs text-gray-500">
                          coming soon
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                <div className="mb-4 flex flex-col gap-2">
                  {/* Show "Aplicar Proyecto" button only when CONNECTED - MOBILE */}
                  {isClient && account && (
                    <div className="border-t border-gray-800 pt-2">
                      <button
                        onClick={() => {
                          void openProjectModal();
                          setMobileOpen(false);
                        }}
                        className="relative flex w-full items-center rounded-lg py-2 px-4 transition-all duration-200 text-gray-400 hover:bg-purple-800/20"
                      >
                        <ShieldCheckIcon className="h-4 w-4 shrink-0" />
                        <span className="ml-3 whitespace-nowrap text-xs italic">
                          Aplicar Proyecto
                        </span>
                      </button>
                    </div>
                  )}

                  {isClient && account && (
                    <div className="border-t border-gray-800 pt-2">
                      <button
                        onClick={() => {
                          if (wallet) disconnect(wallet);
                          setMobileOpen(false);
                        }}
                        disabled={!wallet}
                        className="relative flex w-full items-center rounded-lg py-2 px-4 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50"
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                        <span className="ml-3 whitespace-nowrap">
                          Desconectar
                        </span>
                      </button>
                    </div>
                  )}
                  {isClient && isAdmin && (
                    <div className="border-t border-gray-800 pt-2">
                      <Link
                        href="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="relative flex items-center rounded-lg py-2 px-4 text-red-500 transition-all duration-200 hover:bg-red-900/50 hover:text-white"
                      >
                        <ShieldCheckIcon className="h-5 w-5 shrink-0" />
                        <span className="ml-3 whitespace-nowrap font-bold">
                          Admin
                        </span>
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
