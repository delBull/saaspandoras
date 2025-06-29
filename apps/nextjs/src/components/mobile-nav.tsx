import * as React from "react";
import Link from "next/link";

import { cn } from "@saasfly/ui";
import * as Icons from "@saasfly/ui/icons";

import { siteConfig } from "~/config/site";
import { useLockBody } from "~/hooks/use-lock-body";
import type { MainNavItem } from "~/types";

interface MobileNavProps {
  items: MainNavItem[];
  children?: React.ReactNode;
  menuItemClick?: () => void;
}

export function MobileNav({ items, children, menuItemClick }: MobileNavProps) {
  useLockBody();
  return (
    <div
      className={cn(
        "fixed inset-0 top-16 z-50 grid h-[calc(100vh-4rem)] grid-flow-row auto-rows-max overflow-auto p-6 pb-32 shadow-md animate-in slide-in-from-bottom-80 md:hidden",
      )}
    >
      <div className="relative z-20 grid gap-6 rounded-md bg-popover p-4 text-popover-foreground shadow-md">
        <Link href="/" className="flex items-center space-x-2">
          <Icons.Logo />
          <span className="font-bold">{siteConfig.name}</span>
        </Link>
        <nav className="grid grid-flow-row auto-rows-max text-sm">
          {items.map((item, idx) =>
            item.external ? (
              <a
                key={idx}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "p-2 rounded-md hover:underline",
                  item.disabled && "opacity-50",
                )}
                onClick={menuItemClick}
              >
                {item.title}
              </a>
            ) : (
              <Link
                key={idx}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "p-2 rounded-md hover:underline",
                  item.disabled && "opacity-50",
                )}
                onClick={menuItemClick}
              >
                {item.title}
              </Link>
            ),
          )}
        </nav>
        {children}
      </div>
    </div>
  );
}
