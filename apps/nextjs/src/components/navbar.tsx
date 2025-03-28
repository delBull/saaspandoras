"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { User } from "next-auth";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@saasfly/ui";
import * as Tooltip from "@radix-ui/react-tooltip";
import Image from "next/image";

import { MainNav } from "./main-nav";
import { LocaleChange } from "~/components/locale-change";
import { UserAccountNav } from "./user-account-nav";
import useScroll from "~/hooks/use-scroll";
import type { MainNavItem } from "~/types";
import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { generatePayload, isLoggedIn, login, logout } from "./actions/auth";
import { defineChain } from "thirdweb";


interface MarketingType {
  main_nav_assets: string;
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
  marketing: MarketingType & Record<string, string>;
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
  const segment = useSelectedLayoutSegment();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const loggedIn = await isLoggedIn();
        setIsAuthenticated(loggedIn);
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setIsAuthenticated(false); // En caso de error, se establece como no autenticado
      }
    };
    checkAuthStatus().catch((error) => {
      console.error("Error during auth status check:", error); // Aquí se maneja cualquier error en la promesa
    });
  }, []);

  return (
    <Tooltip.Provider>
      <header
        className={cn(
          "sticky top-0 z-40 flex w-full justify-center border-border bg-background/60 backdrop-blur-xl transition-all",
          scroll ? (scrolled ? "border-b" : "bg-background/0") : "border-b"
        )}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav
            items={items}
            params={{ lang }}
            marketing={marketing}
          >
            {children}
          </MainNav>

          <div className="flex items-center space-x-3">
            {items?.length ? (
              <nav className="hidden gap-6 md:flex">
                {items.map((item, index) => (
                  <React.Fragment key={index}>
                    {item.disabled ? (
                      <Tooltip.Root delayDuration={50}>
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
                    ) : (
                      <Link
                        href={`/${lang}${item.href}`}
                        className={cn(
                          "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                          item.href.startsWith(`/${segment}`) && "text-lime-300 font-semibold"
                        )}
                      >
                        {item.title}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : null}

            <div className="w-[1px] h-8 bg-accent" />

            {rightElements}

            <LocaleChange url="/" />

            {isAuthenticated && user ? (
              <div className="flex items-center space-x-4">
                {/* Aquí va el ícono de perfil y el dropdown para Dashboard y Logout */}
                <div className="relative">
                  <button className="text-lg font-medium text-foreground hover:text-foreground/80">
                    <Image
                      src={user.image ?? "/default-avatar.png"} // Agregar imagen de perfil
                      alt="User Profile"
                      className="w-8 h-8 rounded-full"
                    />
                  </button>
                  <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md">
                    <Link href={`/${lang}/dashboard`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200">
                      Dashboard
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        setIsAuthenticated(false); // Limpiar el estado después de logout
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 w-full text-left"
                    >
                      Logout
                    </button>
                  </div>
                </div>
                <UserAccountNav
                  user={user}
                  params={{ lang }}
                  dict={dropdown}
                />
              </div>
            ) : (
              <ConnectButton
                client={client}
                connectModal={{
                  size: "wide",
                  showThirdwebBranding: false,
                }}
                accountAbstraction={{
                  chain: defineChain(8453),
                  sponsorGas: true,
                }}
                auth={{
                  isLoggedIn: async (address) => {
                    console.log("checking if logged in!", { address });
                    return await isLoggedIn();
                  },
                  doLogin: async (params) => {
                    console.log("logging in!");
                    await login(params);
                    setIsAuthenticated(true); // Actualizar el estado después de login
                  },
                  getLoginPayload: async ({ address }) => generatePayload({ address, chainId: 17000 }),
                  doLogout: async () => {
                    console.log("logging out!");
                    await logout();
                    setIsAuthenticated(false); // Limpiar el estado después de logout
                  },
                }}
              />
            )}
          </div>
        </div>
      </header>
    </Tooltip.Provider>
  );
}
