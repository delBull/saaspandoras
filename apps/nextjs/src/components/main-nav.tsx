"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

import * as Icons from "@saasfly/ui/icons";
//import { DocumentGuide } from "~/components/document-guide";
import { MobileNav } from "~/components/mobile-nav";

import type { MainNavItem } from "~/types";

interface MainNavProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
  params: {
    lang: string;
  };
  marketing: Record<string, string>;
}

export function MainNav({ items, children, params: { lang } }: MainNavProps) {
  const [showMobileMenu, setShowMobileMenu] = React.useState<boolean>(false);
  const toggleMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };
  const handleMenuItemClick = () => {
    toggleMenu();
  };
  return (
    <div className="flex gap-6 md:gap-10">
      <div className="flex items-center">
        <Link
          href={`/${lang}`}
          className="hidden items-center space-x-2 md:flex"
        >
          <Image
            className="hidden"
            src="/images/logo.png"
            alt="Pandora's Logo"
            width={40}
            height={40}
            priority
          />
          <div className="text-xl">
            <span className="text-lime-300">Pandora&apos;s</span>{" "}
            <span className="text-violet-900">Foundation</span>
          </div>
        </Link>
        {/*
        <Link href="https://pandoras.foundation" target="_blank" className="ml-4 hidden md:flex lg:flex xl:flex">
          <DocumentGuide>
            {marketing?.introducing ?? "Introducing Pandora's"}
          </DocumentGuide>
        </Link>
        */}
      </div>

      <button
        className="flex items-center space-x-2 md:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        {showMobileMenu ? (
          <Icons.Close />
        ) : (
          <Image
            src="/images/logo.png"
            alt="Pandora's Logo"
            width={24}
            height={24}
            priority
          />
        )}
        <span className="font-bold">Menu</span>
      </button>
      {showMobileMenu && items && (
        <MobileNav items={items} menuItemClick={handleMenuItemClick}>
          {children}
        </MobileNav>
      )}
    </div>
  );
}
