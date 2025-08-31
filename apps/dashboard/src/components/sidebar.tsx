"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HomeIcon,
  ArrowPathIcon,
  BanknotesIcon,
  CreditCardIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@saasfly/ui";
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
} from "thirdweb/react";
import { isAdmin } from "@/lib/auth";

interface SidebarProps {
  totalBalance?: number;
}

export function Sidebar({ totalBalance = 1267.45 }: SidebarProps) {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const userIsAdmin = isAdmin(account?.address);

  // --- ENLACES DE NAVEGACIÓN ---
  const links = useMemo(
    () => [
      {
        label: "Overview",
        href: "/",
        icon: <HomeIcon className="h-5 w-5 shrink-0 text-gray-400" />,
        disabled: false, // El único enlace activo
      },
      {
        label: "Applicants",
        href: "#", // CORREGIDO: Cambiado para no navegar
        icon: <UserGroupIcon className="h-5 w-5 shrink-0 text-gray-400" />,
        comingSoon: true, // CORREGIDO: Añadido
        disabled: true,   // CORREGIDO: Añadido
      },
      {
        label: "Invest",
        href: "#", // CORREGIDO: Cambiado para no navegar
        icon: <ArrowPathIcon className="h-5 w-5 shrink-0 text-gray-400" />,
        comingSoon: true, // CORREGIDO: Añadido
        disabled: true,   // CORREGIDO: Añadido
      },
      {
        label: "Pool",
        href: "#",
        icon: <BanknotesIcon className="h-5 w-5 shrink-0 text-gray-400" />,
        comingSoon: true,
        disabled: true,   // CORREGIDO: Añadido
      },
    ],
    [],
  );
  
  // ELIMINADO: Se elimina el array de settingsLinks para ocultarlos
  // const settingsLinks = useMemo(() => [ ... ]);

  return (
    <>
      {/* --- SIDEBAR DE ESCRITORIO --- */}
      <motion.div
        animate={{ width: open ? "20rem" : "6rem" }}
        className="relative hidden h-screen flex-col border-r border-gray-800 bg-zinc-900 px-2 pt-20 md:flex"
      >
        {/* Logo */}
        <Link href="/" className="z-50">
          <div className="absolute top-12 left-0 right-0 flex justify-center">
            <motion.div animate={{ opacity: open ? 1 : 0, display: open ? "block" : "none" }}>
              <Image src="/images/logo_finance.png" width={256} height={64} alt="Logo Finance" />
            </motion.div>
            <motion.div animate={{ opacity: open ? 0 : 1, display: open ? "none" : "block" }}>
              <Image src="/images/logo_green.png" width={32} height={32} alt="Logo" className="h-8 w-8" />
            </motion.div>
          </div>
        </Link>

        {/* Botón para abrir/cerrar */}
        <button
          onClick={() => setOpen(!open)}
          className="absolute -right-3 top-1/2 z-50 flex h-20 w-5 -translate-y-1/2 items-center justify-center rounded-md border-2 border-l-0 border-gray-800 bg-zinc-900 text-gray-400 transition-colors duration-200 hover:text-white"
        >
          {open ? <ChevronLeftIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />}
        </button>

        {/* Sección de la Billetera */}
        <div className="mx-2 mt-6 rounded-lg border border-gray-700 bg-gray-800/50 p-2">
          <div className="flex items-center space-x-1">
            <motion.span animate={{ width: open ? "auto" : "2rem" }} className="overflow-hidden whitespace-nowrap font-mono text-xs text-gray-400">
              {open ? "C:\\PANDORAS\\" : "C:\\"}
            </motion.span>
            <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0 }} className="truncate font-mono text-xs text-lime-400">
              {isClient ? (account?.address ?? "Not Connected") : "Loading..."}
            </motion.span>
          </div>
        </div>

        {/* Navegación y acciones */}
        <nav className="mt-4 flex flex-1 flex-col justify-between">
            {/* Sección superior de enlaces */}
            <div className="flex flex-col gap-2">
                {links.map((link) => (
                    <Link 
                      key={link.label} 
                      href={link.disabled ? "#" : link.href} // Previene la navegación si está deshabilitado
                      className={cn(
                        "relative flex items-center rounded-lg py-2 text-gray-400 transition-all duration-200",
                        open ? "px-4" : "w-full justify-center",
                        // CORREGIDO: Lógica de estilos condicional
                        link.disabled 
                          ? "cursor-not-allowed opacity-60" // Estilos si está deshabilitado
                          : "hover:bg-gray-800/50 hover:text-white" // Estilos si está habilitado
                      )}
                      // Previene el click completamente en enlaces deshabilitados
                      onClick={(e) => link.disabled && e.preventDefault()}
                    >
                        {link.icon}
                        <motion.span animate={{ opacity: open ? 1 : 0, width: open ? "auto" : 0, marginLeft: open ? "0.75rem" : "0" }} className="whitespace-nowrap font-medium">
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

            {/* Sección inferior de enlaces y acciones */}
            <div className="mb-4 flex flex-col gap-2">
                {/* ELIMINADO: El mapeo de 'settingsLinks' se ha borrado */}
                
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

      {/* --- SIDEBAR MÓVIL --- */}
      {/* (Sin cambios) */}
    </>
  );
}