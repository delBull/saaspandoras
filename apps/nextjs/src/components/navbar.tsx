"use client";

import React from "react";
import Link from "next/link";
import type { User } from "next-auth";
import { useSelectedLayoutSegment } from "next/navigation";

import { cn } from "@saasfly/ui";

import { MainNav } from "./main-nav";
import { LocaleChange } from "~/components/locale-change";
//import { GitHubStar } from "~/components/github-star";
import { UserAccountNav } from "./user-account-nav";

import useScroll from "~/hooks/use-scroll";
import type { MainNavItem } from "~/types";

import { ConnectButton } from "thirdweb/react";
import { client } from "../lib/client";
import { generatePayload, isLoggedIn, login, logout } from "./actions/auth";
import { defineChain } from "thirdweb";

type Dictionary = Record<string, string>;

interface NavBarProps {
  user: Pick<User, "name" | "image" | "email"> | undefined;
  items?: MainNavItem[];
  children?: React.ReactNode;
  rightElements?: React.ReactNode;
  scroll?: boolean;
  params: {
    lang: string;
  };
  marketing: Dictionary;
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

  return (
    <header
      className={`sticky top-0 z-40 flex w-full justify-center border-border bg-background/60 backdrop-blur-xl transition-all ${
        scroll ? (scrolled ? "border-b" : "bg-background/0") : "border-b"
      }`}
    >
      <div className="container flex h-16 items-center justify-between py-4">
        <MainNav items={items} params={{ lang: `${lang}` }} marketing={marketing}>
          {children}
        </MainNav>

        <div className="flex items-center space-x-3">
          {items?.length ? (
            <nav className="hidden gap-6 md:flex">
              {items?.map((item, index) => (
                <Link
                  key={index}
                  href={item.disabled ? "#" : `/${lang}${item.href}`}
                  className={cn(
                    "flex items-center text-lg font-medium transition-colors hover:text-foreground/80 sm:text-sm",
                    item.href.startsWith(`/${segment}`)
                      ? "text-blue-500 font-semibold"
                      : "",
                    item.disabled && "cursor-not-allowed opacity-80",
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          ) : null}

          <div className="w-[1px] h-8 bg-accent"></div>

          {rightElements}
          {/*
          <div className="hidden md:flex lg:flex xl:flex">
            <GitHubStar />
          </div>
          */}
          <LocaleChange url={"/"} /> 
            {user ? (
            <UserAccountNav
              user={user}
              params={{ lang: `${lang}` }}
              dict={dropdown}
            />
          ) : (
            <ConnectButton
                  client={client}
                  accountAbstraction={{
                    chain: defineChain(17000),
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
                    },
                    getLoginPayload: async ({ address }) => generatePayload({ address, chainId: 17000 }),
                    doLogout: async () => {
                      console.log("logging out!");
                      await logout();
                    },
                  }}
                />
          )}
        </div>
      </div>
    </header>
  );
}
