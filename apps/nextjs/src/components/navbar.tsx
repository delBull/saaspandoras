"use client";

import React from "react";
import Link from "next/link";
import type { User } from "next-auth";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "@saasfly/ui";
import { Button } from "@saasfly/ui/button";

import * as Tooltip from "@radix-ui/react-tooltip";
import { MainNav } from "./main-nav";
import { LocaleChange } from "~/components/locale-change";
import { UserAccountNav } from "./user-account-nav";
import { useSigninModal } from "~/hooks/use-signin-modal";
import useScroll from "~/hooks/use-scroll";
import type { MainNavItem, MarketingDictionary } from "~/types";

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
  user: Pick<User, "name" | "image" | "email"> | undefined;
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
  user,
  items,
  children,
  rightElements,
  scroll = false,
  params: { lang },
  marketing,
  dropdown,
}: NavBarProps) {
  const scrolled = useScroll(50);
  const signInModal = useSigninModal();
  const segment = useSelectedLayoutSegment();

  return (
    <Tooltip.Provider>
      <header
        className={cn(
          "sticky top-0 z-40 flex w-full justify-center border-border bg-background/60 backdrop-blur-xl transition-all",
          scroll ? (scrolled ? "border-b" : "bg-background/0") : "border-b",
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
                {items.map((item, index) => {
                  if (item.external) {
                    return (
                      <a
                        key={index}
                        href={item.href}
                        target="_blank"
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
                          "text-lime-300 font-semibold",
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            ) : null}
            <div className="w-[1px] h-8 bg-accent" />
            {rightElements}
            <LocaleChange url={"/"} />
            {/*
            {!user ? (
              <Link href={`/${lang}/login`}>
                <Button variant="outline" size="sm">
                  {typeof marketing.login === "string"
                    ? marketing.login
                    : "Default Login Text"}
                </Button>
              </Link>
            ) : null}

            {user ? (
              <UserAccountNav
                user={user}
                params={{ lang: `${lang}` }}
                dict={dropdown}
              />
            ) : (
              <Button
                className="px-3"
                variant="default"
                size="sm"
                onClick={signInModal.onOpen}
              >
                {typeof marketing.signup === "string"
                  ? marketing.signup
                  : "Default Signup Text"}
              </Button>
            )}
              */}
          </div>
        </div>
      </header>
    </Tooltip.Provider>
  );
}
