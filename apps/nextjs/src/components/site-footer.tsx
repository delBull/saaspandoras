import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@saasfly/ui";

import { ModeToggle } from "~/components/mode-toggle";

export function SiteFooter({
  className,
}: {
  className?: string;
  params: {
    lang: string;
  };
  dict: Record<string, string | Record<string, string>>;
}) {
  return (
    <footer className={cn(className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Image
            src="/images/avatars/logop.svg"
            width="26"
            height="26"
            alt=""
          />
          <p className="text-center text-sm leading-loose md:text-left">
            ® Pandora&apos;s Foundation
          </p>
        </div>
        <Link href="/terms">
          <p className="text-center text-sm leading-loose md:text-right right-1">
            Terms of Service | Privacy Policy
          </p>
          </Link>
        <ModeToggle />
      </div>
    </footer>
  );
}
