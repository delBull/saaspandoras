"use client";

import { cn } from "~/lib/utils";
import React from "react";
import { motion } from "framer-motion";

interface AceSidebarProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  animate?: boolean;
}

interface SidebarBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface LinkProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  comingSoon?: boolean;
}

interface SidebarLinkProps {
  link: LinkProps;
  className?: string;
}

export function AceSidebar({
  children,
  open,
  setOpen,
  animate = true,
}: AceSidebarProps) {
  return (
    <motion.div
      animate={animate ? { width: open ? "17rem" : "4rem" } : {}}
      className={cn("relative min-h-screen border-r border-gray-800")}
    >
      {children}
    </motion.div>
  );
}

export function SidebarBody({ children, className }: SidebarBodyProps) {
  return (
    <div className={cn("flex h-full flex-col", className)}>{children}</div>
  );
}

export function SidebarLink({ link, className }: SidebarLinkProps) {
  return (
    <a
      href={link.href}
      className={cn(
        "group flex items-center rounded-lg px-3 py-2",
        "transition-all duration-200",
        className,
      )}
    >
      {link.icon}
      <span className="ml-3">{link.label}</span>
    </a>
  );
}
