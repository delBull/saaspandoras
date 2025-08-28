'use client';

import { allWhitepapers } from '.contentlayer/generated';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { DashboardTableOfContents } from '~/components/content/toc';
import type { TableOfContents } from '~/lib/toc';
import type { Dictionary } from "~/types";

interface WhitepaperLayoutProps {
  children: React.ReactNode;
  toc: TableOfContents;
  dict: Dictionary["whitepaper"];
}

export function WhitepaperLayout({ children, toc, dict }: WhitepaperLayoutProps) {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] ?? 'en';

  const whitepapersForLang = allWhitepapers.filter((paper) => paper.locale === lang);
  const sortedWhitepapers = whitepapersForLang.sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="container mx-auto flex w-full max-w-screen-2xl gap-12 px-4 py-10 mb-20 sm:px-6 lg:px-8">
      {/* Left Sidebar - Main Navigation */}
      <aside className="hidden w-1/5 shrink-0 lg:block">
        <div className="sticky top-24">
          <h3 className="mb-4 text-base font-semibold tracking-tight text-foreground">{dict.sections}</h3>
          <nav className="flex flex-col gap-1">
            {sortedWhitepapers.map((paper) => {
              const href = `/${lang}/whitepaper/${paper.slugAsParams}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={paper._id}
                  href={href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}>
                  {paper.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="w-full min-w-0 lg:w-4/6">{children}</main>

      {/* Right Sidebar - Search & TOC */}
      <aside className="hidden w-1/g shrink-0 lg:block">
        <div className="sticky top-24">
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold">{dict.search}</h4>
            <input
              type="search"
              placeholder={dict.search_placeholder}
              className="w-full rounded-md border border-border bg-background/50 px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {dict.ai_search_soon}
            </p>
          </div>
          <h4 className="mb-3 text-sm font-semibold">{dict.on_this_page}</h4>
          <DashboardTableOfContents toc={toc} />
        </div>
      </aside>
    </div>
  );
}