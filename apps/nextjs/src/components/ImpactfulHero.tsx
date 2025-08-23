'use client';

import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
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
  return (
    <section className="relative grid h-screen w-full place-content-center overflow-hidden px-4 md:px-8 xl:px-16">
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 text-md font-mono font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {dict.marketing.hero_supertitle}
        </div>
        <h1 className="max-w-4xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-4xl font-semibold text-transparent dark:text-zinc-100 md:text-5xl xl:text-6xl leading-tight">
          {dict.marketing.hero_title}
        </h1>
        <p className={cn("my-6 max-w-2xl text-center text-xl text-neutral-500 dark:text-neutral-400 md:text-2xl", shadowsIntoLight.className)}>
          {dict.marketing.hero_subtitle}
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="#investment-steps"
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {dict.marketing.hero_cta1}
          </Link>
          <Link
            href="#about-pandoras"
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-md border border-input bg-transparent px-6 py-3 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {dict.marketing.hero_cta2}
          </Link>
          <Link
            href="#benefits-market"
            className="inline-flex h-12 items-center justify-center whitespace-nowrap rounded-md border border-input bg-transparent px-6 py-3 text-base font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            {dict.marketing.hero_cta3}
          </Link>
        </div>
      </div>
      <DotGrid />
    </section>
  );
};

const NUM_DOTS = 200;

const DotGrid = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [dots, setDots] = useState<Array<{x: number, y: number}>>([]);

  useEffect(() => {
    const newDots = Array.from({ length: NUM_DOTS }).map(() => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setDots(newDots);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    if (ref.current) {
      const { left, top } = ref.current.getBoundingClientRect();
      const x = clientX - left;
      const y = clientY - top;
      ref.current.style.setProperty('--mouse-x', `${x}px`);
      ref.current.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className="absolute inset-0 z-0">


      {dots.map((dot, i) => (
        <div
          key={i}
          className="absolute h-1 w-1 rounded-full bg-gray-500/20"
          style={{
            left: `${dot.x}vw`,
            top: `${dot.y}vh`,
          }}
        />
      ))}
    </div>
  );
};
