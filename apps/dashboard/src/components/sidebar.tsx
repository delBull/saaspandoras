"use client";


import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronDoubleRightIcon,
  ChartPieIcon,
  UserIcon,
  ChartBarIcon,
  FolderIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@saasfly/ui";
import { useActiveAccount, useDisconnect, useActiveWallet, ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { client } from "@/lib/thirdweb-client";

interface SidebarProps {
  wallet?: string;
  userName?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export function Sidebar({
  wallet: walletProp,
  userName,
  isAdmin: isAdminProp, // This is the server-side rendered value
  isSuperAdmin: isSuperAdminProp,
}: SidebarProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  // State for client-side admin status, initialized with server-side props
  const [adminStatus, setAdminStatus] = useState({
    isAdmin: isAdminProp ?? false,
    isSuperAdmin: isSuperAdminProp ?? false,
  });

  // Store wallet address in cookie when connected and fetch admin status
  useEffect(() => {
    if (!account?.address) {
      // Clear cookie when disconnected
      document.cookie = `wallet-address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      setAdminStatus({ isAdmin: false, isSuperAdmin: false }); // Reset on disconnect
      return;
    }

    // Store wallet address in cookie when connected
    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // Cookie expires in 30 days
    document.cookie = `wallet-address=${account.address}; path=/; expires=${expires.toUTCString()}; Secure; SameSite=Strict`;

    (async () => {
      try {
        const res = await fetch("/api/admin/verify");
        if (res.ok) {
          const data = (await res.json()) as { isAdmin: boolean; isSuperAdmin: boolean };
          setAdminStatus(data);
        }
      } catch (e) {
        console.error("Error verifying admin status:", e);
      }
    })().catch(console.error);

    // Fetch user profile data using the regular profile API
    const fetchProfile = async () => {
      if (account?.address) {
        try {
          const response = await fetch('/api/profile');
          if (response.ok) {
            const userData = await response.json();
            setUserProfile(userData);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    void fetchProfile();
  }, [account?.address]);

  // Handle click outside anywhere on screen and escape key to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Only close if dropdown is open and click is not on the dropdown
      if (!profileDropdown) return;

      const target = event.target as Element;

      // Check if click is inside the dropdown overlay
      if (sidebarRef.current?.contains(target)) {
        return; // Don't close if click is inside dropdown
      }

      // Close dropdown if click is anywhere else on the page
      setProfileDropdown(false);
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && profileDropdown) {
        setProfileDropdown(false);
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
  }, [profileDropdown]);

  // The final isAdmin status is a combination of regular admin and super admin
  const isAdmin = adminStatus.isAdmin || adminStatus.isSuperAdmin;

  const links = useMemo(
    () => [
      {
        label: "Overview",
        href: "/",
        icon: <HomeIcon className="h-5 w-5 shrink-0 text-gray-400" />,
        disabled: false,
      },

      {
        label: "Invest",
        href: "/applicants",
        icon: (
          <UserGroupIcon className="h-5 w-5 shrink-0 text-gray-400" />
        ),
        disabled: false,
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
              label: "Dashboard",
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
                    e.stopPropagation(); // Prevent event bubbling
                    setProfileDropdown(!profileDropdown);
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
                      void navigator.clipboard.writeText(fullAddress);
                      // You could add a toast notification here
                    }}
                    title={`${account?.address ?? userName ?? walletProp ?? ''} - Click to copy entire wallet address`}
                  >
                    <span
                      className="overflow-hidden whitespace-nowrap font-mono text-xs text-gray-400 flex-shrink-0"
                    >
                      {open ? "C:\\USER\\" : ""}
                    </span>
                    <span
                      className="truncate font-mono text-xs text-lime-400 group-hover:text-lime-300 transition-colors"
                    >
                      {isClient
                        ? (account?.address ?? walletProp ?? userName ?? "...").substring(0, 8) + '...' + (account?.address ?? walletProp ?? userName ?? "...").substring(36, 42)
                        : "..." }
                    </span>
                    {/* Copy icon */}
                    <svg
                      className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </motion.div>
              </div>

              {/* Profile Dropdown - Fixed width to prevent compression */}
              <AnimatePresence>
                {profileDropdown && (
                  <>
                    {/* Invisible overlay to position dropdown fixed to viewport */}
                    <div className="fixed inset-0 z-50 pointer-events-none" ref={sidebarRef}>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-4 top-[152px] w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50 pointer-events-auto"
                      >
                        <div className="p-3 space-y-2">
                          {/* Profile */}
                          <Link
                            href="/profile"
                            onClick={() => setProfileDropdown(false)}
                            className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <UserIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-white text-sm">Perfil</div>
                              <div className="text-gray-400 text-xs">Información personal</div>
                            </div>
                          </Link>

                          {/* Dashboard */}
                          <Link
                            href="/profile/dashboard"
                            onClick={() => setProfileDropdown(false)}
                            className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <ChartBarIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-white text-sm">Dashboard</div>
                              <div className="text-gray-400 text-xs">Métricas e inversiones</div>
                            </div>
                          </Link>

                          {/* Projects */}
                          <Link
                            href="/profile/projects"
                            onClick={() => setProfileDropdown(false)}
                            className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                          >
                            <FolderIcon className="w-5 h-5 text-gray-400" />
                            <div>
                              <div className="text-white text-sm">Proyectos</div>
                              <div className="text-gray-400 text-xs">
                                {userProfile?.projectCount ? `${userProfile.projectCount} proyectos` : 'Gestionar proyectos'}
                              </div>
                            </div>
                          </Link>

                          <div className="border-t border-zinc-700 my-2"></div>

                          {/* Thirdweb ConnectButton - Maneja automáticamente conectar vs gestionar */}
                          <div className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                            <ConnectButton
                              client={client}
                              wallets={[
                                // Same wallets as NFT-gate for consistent session management
                                inAppWallet({
                                  auth: {
                                    options: ["email", "google", "apple", "facebook", "passkey"],
                                  },
                                  executionMode: {
                                    mode: "EIP7702",
                                    sponsorGas: true,
                                  },
                                }),
                                createWallet("io.metamask"),
                              ]}
                              theme="dark"
                              onDisconnect={() => {
                                setProfileDropdown(false);
                              }}
                              onConnect={() => {
                                setProfileDropdown(false);
                              }}
                            />
                          </div>


                        </div>
                      </motion.div>
                    </div>
                  </>
                )}
              </AnimatePresence>
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
                  "relative flex items-center rounded-lg py-5 text-gray-400 transition-all duration-200 border-b border-gray-800",
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
                  className="whitespace-nowrap font-medium"
                >
                  {link.label}
                </motion.span>
                {link.comingSoon && open && (
                  <motion.span
                    animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }}
                    className="ml-auto text-xs text-gray-500"
                  >
                    coming soon
                  </motion.span>
                )}
              </Link>
            ))}
          </div>

          <div className="mb-4 flex flex-col gap-2">
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
                    className="whitespace-nowrap font-medium"
                  >
                    Disconnect
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
                          e.stopPropagation(); // Prevent event bubbling
                          setProfileDropdown(!profileDropdown);
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
                            void navigator.clipboard.writeText(fullAddress);
                            // You could add a toast notification here
                          }}
                          title={`${account?.address ?? userName ?? walletProp ?? ''} - Click to copy entire wallet address`}
                        >
                          <span className="font-mono text-xs text-gray-400 flex-shrink-0">
                            C:\USER\
                          </span>
                          <span className="truncate font-mono text-xs text-lime-400 group-hover:text-lime-300 transition-colors">
                            {isClient
                              ? (account?.address ?? walletProp ?? userName ?? "...").substring(0, 8) + '...' + (account?.address ?? walletProp ?? userName ?? "...").substring(36, 42)
                              : "..." }
                          </span>
                          {/* Copy icon */}
                          <svg
                            className="w-3 h-3 text-gray-500 group-hover:text-gray-300 transition-colors flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
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
                          className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50"
                        >
                          <div className="p-3 space-y-2">
                            {/* Profile */}
                            <Link
                              href="/profile"
                              onClick={() => {
                                setProfileDropdown(false);
                                setMobileOpen(false);
                              }}
                              className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                            >
                              <UserIcon className="w-5 h-5 text-gray-400" />
                              <div>
                                <div className="text-white text-sm">Perfil</div>
                                <div className="text-gray-400 text-xs">Información personal</div>
                              </div>
                            </Link>

                            {/* Dashboard */}
                            <Link
                              href="/profile/dashboard"
                              onClick={() => {
                                setProfileDropdown(false);
                                setMobileOpen(false);
                              }}
                              className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                            >
                              <ChartBarIcon className="w-5 h-5 text-gray-400" />
                              <div>
                                <div className="text-white text-sm">Dashboard</div>
                                <div className="text-gray-400 text-xs">Métricas e inversiones</div>
                              </div>
                            </Link>

                        {/* Projects (always show like desktop) */}
                        <Link
                          href="/profile/projects"
                          onClick={() => {
                            setProfileDropdown(false);
                            setMobileOpen(false);
                          }}
                          className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors"
                        >
                          <FolderIcon className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-white text-sm">Proyectos</div>
                            <div className="text-gray-400 text-xs">
                              {userProfile?.projectCount ? `${userProfile.projectCount} proyectos` : 'Gestionar proyectos'}
                            </div>
                          </div>
                        </Link>

                        <div className="border-t border-zinc-700 my-2"></div>

                        {/* Thirdweb ConnectButton - Maneja automáticamente conectar vs gestionar */}
                        <div className="flex items-center gap-3 p-2 rounded hover:bg-zinc-800 transition-colors w-full">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <ConnectButton
                            client={client}
                            wallets={[
                              // Same wallets as NFT-gate for consistent session management
                              inAppWallet({
                                auth: {
                                  options: ["email", "google", "apple", "facebook", "passkey"],
                                },
                                executionMode: {
                                  mode: "EIP7702",
                                  sponsorGas: true,
                                },
                              }),
                              createWallet("io.metamask"),
                            ]}
                            theme="dark"
                            onDisconnect={() => {
                              setProfileDropdown(false);
                              setMobileOpen(false);
                            }}
                            onConnect={() => {
                              setProfileDropdown(false);
                              setMobileOpen(false);
                            }}
                          />
                        </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                      <span className="ml-3 whitespace-nowrap font-medium">
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
                        <span className="ml-3 whitespace-nowrap font-medium">
                          Disconnect
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
