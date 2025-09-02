"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HomeIcon, ArrowPathIcon, BanknotesIcon, ChevronLeftIcon, ChevronRightIcon, Bars3Icon, XMarkIcon, UserGroupIcon, ShieldCheckIcon, ArrowLeftOnRectangleIcon, ChevronDoubleRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@saasfly/ui";
import { useActiveAccount, useDisconnect, useActiveWallet } from "thirdweb/react";
import { isAdmin } from "@/lib/auth";

interface SidebarProps {
  wallet?: string;
  userName?: string;
}

export function Sidebar({ wallet: walletProp, userName }: SidebarProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const userIsAdmin = isAdmin(account?.address);
  
  const links = useMemo( () => [ { 
    label: "Overview", 
    href: "/", 
    icon: <HomeIcon className="h-5 w-5 shrink-0 font-mono text-gray-400" />, 
    disabled: false, 
  }, 
  { 
    label: "Applicants", 
    href: "#", 
    icon: <UserGroupIcon className="h-5 w-5 shrink-0 font-mono text-gray-400" />, 
    comingSoon: true, 
    disabled: true, 
  }, 
  { 
    label: "Invest", 
    href: "#", 
    icon: <ArrowPathIcon className="h-5 w-5 shrink-0 font-mono text-gray-400" />, 
    comingSoon: true, 
    disabled: true, 
  }, 
  { 
    label: "Pool", 
    href: "#", 
    icon: <BanknotesIcon className="h-5 w-5 shrink-0 font-mono text-gray-400" />, 
    comingSoon: true, 
    disabled: true, 
  }, 
], [], );

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.95, y: -10 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  return (
    <>
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
                  <Image src="/images/logo_finance.png" width={256} height={64} alt="Logo Finance" />
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
                  <Image src="/images/logo_green.png" width={32} height={32} alt="Logo" className="h-8 w-8" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-1/2 z-50 flex h-20 w-5 -translate-y-1/2 items-center justify-center rounded-md border-2 border-l-0 border-gray-800 bg-zinc-900 font-mono text-gray-400 transition-colors duration-200 hover:text-white"
        >
          {open ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </button>

        <div className="mx-2 mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-2">
          <div className="flex items-center space-x-1">
            <motion.span animate={{ width: open ? "auto" : "2rem" }} className="overflow-hidden whitespace-nowrap font-mono text-xs text-gray-400 flex-shrink-0">
              {open
                ? (isClient && account ? 'C:\\USER\\' : 'C:\\PANDORAS\\')
                : 'C:\\'
              }
            </motion.span>
            <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }} className="truncate font-mono text-xs text-lime-400 min-w-0">
              {isClient ? (userName ?? walletProp ?? account?.address ?? "Not Connected") : "Loading..."}
            </motion.span>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col justify-between">
            <div className="flex flex-col gap-2">
                {links.map((link) => (
                    <Link 
                      key={link.label} 
                      href={link.disabled ? "#" : link.href}
                      className={cn( "relative flex items-center rounded-lg py-2 text-gray-400 transition-all duration-200", open ? "px-4" : "w-full justify-center", link.disabled ? "cursor-not-allowed opacity-60" : "hover:bg-gray-800/50 hover:text-white")}
                      onClick={(e) => link.disabled && e.preventDefault()}
                    >
                        {link.icon}
                        <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0, marginLeft: open ? "0.75rem" : "0" }} className="whitespace-nowrap font-medium font-mono">
                            {link.label}
                        </motion.span>
                        {link.comingSoon && open && (
                            <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }} className="ml-auto text-xs text-gray-500">
                            coming soon
                            </motion.span>
                        )}
                    </Link>
                ))}
            </div>

            <div className="mb-4 flex flex-col gap-2">
                {isClient && (
                    <>
                        {userIsAdmin && (
                            <div className={cn("border-t border-gray-800 pt-2", !open && "mx-auto w-full")}>
                                <Link href="/admin" className={cn("relative flex items-center rounded-lg py-2 text-red-500 transition-all duration-200 hover:bg-red-900/50 hover:text-white", open ? "px-4" : "w-full justify-center")}>
                                    <ShieldCheckIcon className="h-5 w-5 shrink-0" />
                                    <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0, marginLeft: open ? "0.75rem" : "0" }} className="whitespace-nowrap font-bold">
                                        Admin
                                    </motion.span>
                                </Link>
                            </div>
                        )}
                        
                        {account && (
                            <div className={cn("border-t border-gray-800 pt-2", !open && "mx-auto w-full")}>
                                <button
                                    onClick={() => wallet && disconnect(wallet)}
                                    disabled={!wallet}
                                    className={cn("relative flex w-full items-center rounded-lg py-2 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50", open ? "px-4" : "justify-center")}
                                >
                                    <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                                    <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0, marginLeft: open ? "0.75rem" : "0" }} className="whitespace-nowrap font-medium">
                                        Disconnect
                                    </motion.span>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </nav>
      </motion.div>
      
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "md:hidden fixed z-10",
          "top-1/2 -translate-y-1/2 left-0",
          "flex items-center justify-center h-24 w-6",
          "bg-zinc-800 border-y border-r border-gray-700",
          "rounded-r-lg shadow-lg",
          "text-gray-500 hover:text-white hover:bg-zinc-700",
          "transition-all duration-200"
        )}
      >
        <ChevronDoubleRightIcon className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/50 md:hidden" />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 flex w-full max-w-xs flex-col bg-zinc-900 px-2 pt-12 md:hidden"
            >
              <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 z-50 rounded-lg p-1 text-gray-400 transition-colors duration-200 hover:text-white" >
                <XMarkIcon className="h-6 w-6" />
              </button>
              
              <div className="mx-2 mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-2">
                <div className="flex items-center space-x-1">
                  <span className="overflow-hidden whitespace-nowrap font-mono text-xs text-gray-400 flex-shrink-0">
                    {isClient && account ? 'C:\\USER\\' : 'C:\\PANDORAS\\'}
                  </span>
                  <span className="truncate font-mono text-xs text-lime-400 min-w-0">
                    {isClient ? (userName ?? walletProp ?? account?.address ?? "Not Connected") : "Loading..."}
                  </span>
                </div>
              </div>

              <nav className="mt-4 flex flex-1 flex-col justify-between px-2">
                <div className="flex flex-col gap-2">
                  {links.map((link) => (
                    <Link
                      key={`mobile-${link.label}`}
                      href={link.disabled ? "#" : link.href}
                      className={cn( "relative flex items-center rounded-lg py-2 px-4 text-gray-400 transition-all duration-200", link.disabled ? "cursor-not-allowed opacity-60" : "hover:bg-gray-800/50 hover:text-white" )}
                      onClick={(e) => { if (link.disabled) e.preventDefault(); else setMobileOpen(false); }}
                    >
                      {link.icon}
                      <span className="ml-3 whitespace-nowrap font-medium">{link.label}</span>
                      {link.comingSoon && <span className="ml-auto text-xs text-gray-500">coming soon</span>}
                    </Link>
                  ))}
                </div>

                <div className="mb-4 flex flex-col gap-2">
                  {isClient && (
                    <>
                      {userIsAdmin && (
                        <div className="border-t border-gray-800 pt-2">
                          <Link href="/admin" onClick={() => setMobileOpen(false)} className="relative flex items-center rounded-lg py-2 px-4 text-red-500 transition-all duration-200 hover:bg-red-900/50 hover:text-white">
                            <ShieldCheckIcon className="h-5 w-5 shrink-0" />
                            <span className="ml-3 whitespace-nowrap font-bold">Admin</span>
                          </Link>
                        </div>
                      )}
                      {account && (
                        <div className="border-t border-gray-800 pt-2">
                          <button
                            onClick={() => { if (wallet) disconnect(wallet); setMobileOpen(false); }}
                            disabled={!wallet}
                            className="relative flex w-full items-center rounded-lg py-2 px-4 text-gray-400 transition-all duration-200 hover:bg-gray-800/50 hover:text-white disabled:opacity-50"
                          >
                            <ArrowLeftOnRectangleIcon className="h-5 w-5 shrink-0" />
                            <span className="ml-3 whitespace-nowrap font-medium">Disconnect</span>
                          </button>
                        </div>
                      )}
                    </>
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