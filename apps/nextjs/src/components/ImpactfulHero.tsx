'use client';

import React from 'react';
import { Shadows_Into_Light } from "next/font/google";
import { cn } from '~/lib/utils';

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
});

interface ImpactfulHeroProps {
  dict: {
    marketing: {
      hero_supertitle: string;
      hero_title: string;
      hero_subtitle: string;
      hero_cta1: string;
      hero_cta2: string;
      hero_cta3: string;
    };
  };
}

export const ImpactfulHero = ({ dict }: ImpactfulHeroProps) => {
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (!href?.startsWith('#')) return;

    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - 50;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="relative grid h-screen w-full place-content-center overflow-hidden px-4 md:px-8 xl:px-16">
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 text-md text-center font-mono font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {dict.marketing.hero_supertitle}
        </div>
        <h1 className="max-w-4xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-4xl font-semibold text-transparent dark:text-zinc-100 md:text-5xl xl:text-6xl leading-tight">
          {dict.marketing.hero_title}
        </h1>
        <p className={cn("my-6 max-w-2xl text-center text-2xl text-neutral-500 dark:text-neutral-400 md:text-3xl", shadowsIntoLight.className)}>
          {dict.marketing.hero_subtitle}
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#investment-steps"
            onClick={handleSmoothScroll}
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {dict.marketing.hero_cta1}
          </a>
          <a
            href="#about-pandoras"
            onClick={handleSmoothScroll}
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-md border border-input bg-transparent px-6 py-3 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {dict.marketing.hero_cta2}
          </a>
          <a
            href="#benefits-market"
            onClick={handleSmoothScroll}
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-md border border-input bg-transparent px-6 py-3 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {dict.marketing.hero_cta3}
          </a>
        </div>
      </div>
    </section>
  );
};