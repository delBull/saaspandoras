'use client';

import React from "react";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@saasfly/ui";
import * as Tooltip from "@radix-ui/react-tooltip";
import { MainNav } from "./main-nav";
import { LocaleChange } from "~/components/locale-change";
import { useScrollDirection } from "~/hooks/use-scroll-direction";
import type { MainNavItem, MarketingDictionary } from "~/types";
import { ConnectWalletButton } from "./connect-wallet-button";
import { Shadows_Into_Light } from "next/font/google";

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
});

interface MarketingType {
  main_nav_assets: string;
  main_nav_invest: string;
  main_nav_documentation: string;
  main_nav_business: string;
  main_nav_products: string;
  main_nav_blog: string;
  login: string;
  signup: string;
}

interface NavBarProps {
  items?: MainNavItem[];
  children?: React.ReactNode;
  rightElements?: React.ReactNode;
  scroll?: boolean;
  params: {
    lang: string;
  };
  marketing: (MarketingType & Record<string, string>) | MarketingDictionary;
  dropdown: Record<string, string>;
}

export function NavBar({
  items,
  children,
  rightElements,
  scroll = false,
  params: { lang },
  marketing,
}: NavBarProps) {
  const scrollDirection = useScrollDirection();
  const [scrolled, setScrolled] = React.useState(false);
  const pathname = usePathname();

  const getBasePath = () => {
    if (!pathname) return "";
    const segments = pathname.split('/');
    if (segments[1] === lang) {
      return segments.slice(2).join('/');
    }
    return segments.slice(1).join('/');
  };

  const basePath = getBasePath();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.pageYOffset > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const segment = useSelectedLayoutSegment();

  return (
    <Tooltip.Provider>
      <header
        className={cn(
          "sticky top-0 z-40 flex w-full justify-center border-border bg-background/60 backdrop-blur-xl transition-all duration-300",
          scroll ? (scrolled ? "border-b" : "bg-background/0") : "border-b",
          scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav
            items={items}
            params={{ lang }}
            marketing={marketing as Record<string, string>}
          >
            {children}
          </MainNav>

          <div className="flex items-center space-x-3">
            {items?.length ? (
              <nav className="hidden gap-6 md:flex">
                {items
                  .filter((item) => !item.hidden)
                  .map((item, index) => {
                  if (item.external) {
                    return (
                      <a
                        key={index}
                        href={item.href}
                        target=""
                        rel="noopener noreferrer"
                        className={cn(
                          "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                        )}
                      >
                        {item.title}
                      </a>
                    );
                  }
                  if (item.disabled) {
                    return (
                      <Tooltip.Root key={index} delayDuration={50}>
                        <Tooltip.Trigger asChild>
                          <span className="cursor-default text-muted-foreground opacity-60">
                            {item.title}
                          </span>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="z-50 rounded-md bg-neutral-900 px-3 py-1.5 text-xs text-white animate-in fade-in-0 zoom-in-95 shadow-md"
                            sideOffset={5}
                            side="top"
                            align="center"
                            avoidCollisions
                          >
                            {item.tooltip}
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    );
                  }
                  const linkHref = `/${lang}${item.href}`;
                  return (
                    <Link
                      key={index}
                      href={linkHref}
                      className={cn(
                        "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                        item.href.startsWith(`/${segment}`) &&
                          "text-lime-300 font-semibold"
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
            {rightElements}
            <div className="hidden md:block w-[1px] h-8 bg-accent" />
            <div className="hidden md:flex items-center">
              <LocaleChange url={basePath} />
            </div>
            <ConnectWalletButton />
            <Link
              href="https://dash.pandoras.finance"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center text-lg font-bold transition-colors hover:text-foreground/80 sm:text-sm text-lime-300"
              >
              dApp
            </Link>
          </div>
        </div>
      </header>
    </Tooltip.Provider>
  );
}
