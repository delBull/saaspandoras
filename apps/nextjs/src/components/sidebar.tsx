"use client";

import { 
  HomeIcon, 
  BanknotesIcon, 
  ArrowPathIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import Link from "next/link";

interface SidebarProps {
  wallet?: string; 
  totalBalance?: number;
}

export function Sidebar({ wallet = "0x1344543534...", totalBalance = 1267.45 }: SidebarProps) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    {
      label: "HOME",
      href: "/dashboard",
      icon: <HomeIcon className="h-5 w-5 shrink-0 text-gray-400" />
    },
    {
      label: "INVEST",
      href: "/dashboard",
      icon: <ArrowPathIcon className="h-5 w-5 shrink-0 text-gray-400" />
    },
    {
      label: "POOL",
      href: "#",
      icon: <BanknotesIcon className={cn(
        "h-5 w-5 shrink-0",
        "text-gray-400",
        !open && "mx-auto"
      )} />,
      comingSoon: true
    },
    {
      label: "BILLING",
      href: "/dashboard/billing",
      icon: <CreditCardIcon className="h-5 w-5 shrink-0 text-gray-400" />
    },
    {
      label: "SETTINGS",
      href: "/dashboard/settings",
      icon: <Cog6ToothIcon className="h-5 w-5 shrink-0 text-gray-400" />
    }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        animate={{ width: open ? "20rem" : "6rem" }}
        className={cn(
          "relative h-screen bg-zinc-900",
          "border-r border-gray-800",
          "flex flex-col",
          "px-2 pt-20",
          "hidden md:flex" 
        )}
      >
        {/* Logo Section with Animation */}
        <Link href="/" className="z-50">
          <div className="absolute top-12 left-0 right-0 flex justify-center">
            <motion.div
              animate={{ 
                opacity: open ? 1 : 0,
                display: open ? "block" : "none"
              }}
            >
              <Image 
                src="/images/logo_finance.png" 
                width={256}
                height={64} 
                alt="Logo Finance"
              />
            </motion.div>
            <motion.div
              animate={{ 
                opacity: open ? 0 : 1,
                display: open ? "none" : "block"
              }}
            >
              <Image 
                src="/images/logo_green.png" 
                width={32}
                height={32} 
                alt="Logo"
                className="h-8 w-8" 
              />
            </motion.div>
          </div>
        </Link>

        {/* Toggle Button */}
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "absolute -right-3 z-50",
            "top-1/2 -translate-y-1/2",
            "flex h-20 w-5 items-center justify-center",
            "rounded-md border-2 border-gray-800 border-l-0",
            "bg-zinc-900",
            "text-gray-400",
            "hover:text-white",
            "transition-colors duration-200"
          )}
        >
          {open ? (
            <ChevronLeftIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {/* Wallet Section */}
        <div className="bg-gray-800/50 rounded-lg p-2 mx-2 mt-6 border border-gray-700">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-1">
              <motion.span 
                animate={{ 
                  width: open ? "auto" : "2rem",
                }}
                className="text-xs text-gray-400 font-mono overflow-hidden whitespace-nowrap"
              >
                {open ? "C:\\PANDORAS\\" : "C:\\"}
              </motion.span>
              <motion.span 
                animate={{ 
                  opacity: open ? 1 : 0,
                  width: open ? "auto" : 0
                }}
                className="text-xs text-lime-400 font-mono truncate"
              >
                {wallet}
              </motion.span>
            </div>
          </div>
        </div>

        {/* Balance Section */}
        <motion.div 
          animate={{ 
            opacity: open ? 1 : 0,
            height: open ? "auto" : 0,
            marginTop: open ? "1rem" : 0,
            marginBottom: open ? "0.5rem" : 0,
          }}
          className="border-b border-gray-800 w-full px-4 pb-2 overflow-hidden"
        >
          <div className="flex flex-col items-center">
            <Image 
              src="/images/logo.png"
              width={32}
              height={32} 
              alt="Logo" 
              className="h-8 w-8 mb-2" 
            />
            <div className="flex flex-col items-center">
              <h3 className="text-xs font-medium text-lime-500">BALANCE</h3>
              <p className="text-xl font-bold font-mono text-lime-300">
                ${totalBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Navigation Links */}
        <div className="mt-8 flex flex-col gap-2 flex-1">
          {links.map((link, idx) => (
            <motion.a
              key={idx}
              href={link.href}
              className={cn(
                "flex items-center py-2 text-gray-400 relative",
                "hover:text-white hover:bg-gray-800/50 rounded-lg",
                "transition-all duration-200",
                open ? "px-4" : "justify-center w-full"
              )}
            >
              {link.icon}
              <motion.span
                animate={{ 
                  opacity: open ? 1 : 0,
                  width: open ? "auto" : 0,
                  marginLeft: open ? "0.75rem" : "0"
                }}
                className="font-medium whitespace-nowrap"
              >
                {link.label}
              </motion.span>
              {link.comingSoon && open && (
                <motion.span
                  animate={{ 
                    opacity: open ? 1 : 0,
                    width: open ? "auto" : 0 
                }}
                  className="ml-auto text-xs text-gray-500"
                >
                  coming soon
                </motion.span>
              )}
            </motion.a>
          ))}
        </div>

        {/* Services Section */}
        <motion.div 
          animate={{ opacity: open ? 1 : 0 }}
          className="px-4 mb-4"
        >
          <div className="border-t border-gray-800 pt-4">
            <h3 className="text-gray-300 mb-2 px-4">SERVICES</h3>
            <div className="space-y-2 px-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">+ Incubation</span>
                <span className="text-xs text-gray-500">coming soon</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">+ Tokenize</span>
                <span className="text-xs text-gray-500">coming soon</span>
              </div>
            </div>
          </div>

          {/* Bottom Logo */}
          <div className="flex justify-center mt-8">
            <Image 
              src="/images/onlybox2.png" 
              width={54} 
              height={54} 
              alt="Logo" 
              className="h-36 w-36" 
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          "md:hidden fixed",
          "top-2 left-2", 
          "p-2 rounded-lg",
          "text-gray-400 hover:text-white",
          "transition-colors duration-200",
          "z-10",
          "shadow-lg"
        )}
      >
        <Bars3Icon className="h-8 w-8" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            
            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.3 }}
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-full",
                "bg-zinc-900 md:hidden",
                "flex flex-col",
                "px-2 pt-20"
              )}
            >
              {/* Close Button */}
              <button
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "absolute top-4 left-4",
                  "p-2 rounded-lg",
                  "text-gray-400 hover:text-white",
                  "transition-colors duration-200"
                )}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>

              {/* Mobile Content - Same as Desktop but always expanded */}
              {/* Your existing content but forced to expanded state */}
              <div className="bg-gray-800/50 rounded-lg p-2 mx-2 mt-6 border border-gray-700">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-400 font-mono overflow-hidden whitespace-nowrap">
                      C:\PANDORAS\
                    </span>
                    <span className="text-xs text-lime-400 font-mono truncate">
                      {wallet}
                    </span>
                  </div>
                </div>
              </div>

              {/* Balance Section */}
              <div className="border-b border-gray-800 w-full px-4 pb-2 overflow-hidden">
                <div className="flex flex-col items-center">
                  <Image 
                    src="/images/logo.png"
                    width={32}
                    height={32} 
                    alt="Logo" 
                    className="h-8 w-8 mb-2" 
                  />
                  <div className="flex flex-col items-center">
                    <h3 className="text-xs font-medium text-lime-500">BALANCE</h3>
                    <p className="text-xl font-bold font-mono text-lime-300">
                      ${totalBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="mt-8 flex flex-col gap-2 flex-1">
                {links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    className={cn(
                      "flex items-center py-2 text-gray-400 relative",
                      "hover:text-white hover:bg-gray-800/50 rounded-lg",
                      "transition-all duration-200",
                      "px-4"
                    )}
                  >
                    {link.icon}
                    <span className="font-medium whitespace-nowrap">
                      {link.label}
                    </span>
                    {link.comingSoon && (
                      <span className="ml-auto text-xs text-gray-500">
                        coming soon
                      </span>
                    )}
                  </a>
                ))}
              </div>

              {/* Services Section */}
              <div className="px-4 mb-4">
                <div className="border-t border-gray-800 pt-4">
                  <h3 className="text-gray-300 mb-2 px-4">SERVICES</h3>
                  <div className="space-y-2 px-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">+ Incubation</span>
                      <span className="text-xs text-gray-500">coming soon</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">+ Tokenize</span>
                      <span className="text-xs text-gray-500">coming soon</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Logo */}
                <div className="flex justify-center mt-8">
                  <Image 
                    src="/images/onlybox2.png" 
                    width={54} 
                    height={54} 
                    alt="Logo" 
                    className="h-36 w-36" 
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}