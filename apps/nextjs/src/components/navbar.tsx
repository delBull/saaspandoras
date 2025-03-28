"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import type { User } from "next-auth";
import { useSelectedLayoutSegment } from "next/navigation";
import { cn } from "@saasfly/ui";
import * as Tooltip from "@radix-ui/react-tooltip";
import { MainNav } from "./main-nav";
import { LocaleChange } from "~/components/locale-change";
import { UserAccountNav } from "./user-account-nav";
import useScroll from "~/hooks/use-scroll";
import type { MainNavItem } from "~/types";
import { Button } from "@saasfly/ui/button";
import { client } from "../lib/client";
import { generatePayload, isLoggedIn, login, logout } from "./actions/auth";
import {
  type SiweAuthOptions,
  useConnectModal,
  useActiveWallet,
  useSiweAuth,
} from "thirdweb/react";

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

const authOptions: SiweAuthOptions = {
  isLoggedIn: async (_address) => {
    return await isLoggedIn();
  },
  doLogin: async (params) => {
    await login(params); // Ahora acepta el parámetro correctamente
  },
  getLoginPayload: ({ address }) => generatePayload({ address }),
  doLogout: async () => {
    await logout();
  },
};

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
  // Obtenemos el estado de autenticación de thirdweb (ya como booleano)
  const { isLoggedIn: thirdwebIsLoggedIn } = useSiweAuth(
    useActiveWallet(),
    undefined,
    authOptions
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authStatus = await isLoggedIn();
        setIsAuthenticated(authStatus);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
    };
    
    void checkAuth();
  }, [thirdwebIsLoggedIn]);
  
  const { connect } = useConnectModal();

  const onClick = async () => {
    try {
      if (isAuthenticated) {
        await logout();
      } else {
        await connect({
          client: client,
          auth: authOptions,
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  return (
    <Tooltip.Provider>
      <header
        className={cn(
          "sticky top-0 z-40 flex w-full justify-center border-border bg-background/60 backdrop-blur-xl transition-all",
          scroll ? (scrolled ? "border-b" : "bg-background/0") : "border-b"
        )}
      >
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav items={items} params={{ lang }} marketing={marketing}>
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
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link
                  href={`/${lang}/profile`}
                  className="text-lg font-medium text-foreground hover:text-foreground/80"
                >
                  Perfil
                </Link>
                <Link
                  href={`/${lang}/dashboard`}
                  className="text-lg font-medium text-foreground hover:text-foreground/80"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/${lang}/signout`}
                  className="text-lg font-medium text-foreground hover:text-foreground/80"
                >
                  Signout
                </Link>
                {user && <UserAccountNav user={user} params={{ lang }} dict={dropdown} />}
              </div>
            ) : (
              <Button type="button" onClick={onClick}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>
    </Tooltip.Provider>
  );
}