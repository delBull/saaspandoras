"use client";
import React from "react";
import { cn } from "~/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { IconBrandYoutubeFilled, IconShieldCheck, IconGavel, IconEye, IconFileCheck } from "@tabler/icons-react";
import Image from "next/image";

interface SkeletonOneItem {
  title: string;
  image?: string;
}

interface SkeletonTwoItem {
  title: string;
}

interface BenefitsMarketDict {
  main_title: string;
  main_description: string;
  ventajas_title0: string;
  ventajas_description0: string;
  ventajas_title1: string;
  ventajas_description1: string;
  ventajas_title2: string;
  ventajas_description2: string;
  ventajas_title3: string;
  ventajas_description3: string;
  skeleton_one?: {
    items: SkeletonOneItem[];
  };
  skeleton_two?: {
    items: SkeletonTwoItem[];
  };
}

export function FeaturesSectionDemo({ 
  main_title,
  main_description,
  ventajas_title0,
  ventajas_description0,
  ventajas_title1,
  ventajas_description1,
  ventajas_title2,
  ventajas_description2,
  ventajas_title3,
  ventajas_description3,
  skeleton_one,
  skeleton_two,
 }: BenefitsMarketDict) {
  const features = [
    {
      title: ventajas_title0,
      description: ventajas_description0,
      skeleton: skeleton_one ? <SkeletonOne {...skeleton_one} /> : null,
      className:
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800 min-h-[300px] lg:min-h-[400px]",
    },
    {
      title: ventajas_title1,
      description: ventajas_description1,
      skeleton: skeleton_two ? <SkeletonTwo {...skeleton_two} /> : null,
      className: "border-b col-span-1 lg:col-span-2 dark:border-neutral-800",
    },
    {
      title: ventajas_title2,
      description: ventajas_description2,
      skeleton: <SkeletonThree />,
      className:
        "col-span-1 lg:col-span-3 lg:border-r  dark:border-neutral-800",
    },
    {
      title: ventajas_title3,
      description: ventajas_description3,
      skeleton: <SkeletonFour />,
      className: "col-span-1 lg:col-span-3 border-b lg:border-none",
    },
  ];
  return (
    <div className="relative z-20 py-10 lg:py-40 max-w-7xl mx-auto">
      <div className="px-8">
        <h4 className="text-4xl sm:text-5xl text-neutral-800 dark:text-neutral-200 max-w-5xl mx-auto text-center">
          {main_title}
        </h4>

        <p className="text-neutral-600 dark:text-neutral-100 text-md font-mono leading-relaxed max-w-2xl my-4 mx-auto text-center">
          {main_description}
        </p>
      </div>

      <div className="relative ">
        <div className="grid grid-cols-1 lg:grid-cols-6 mt-12 rounded-md gap-1 dark:border-neutral-800">
          {features.map((feature, index) => (
            <FeatureCard key={`feature-${index}`} className={feature.className}>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
              <div className=" h-full w-full">{feature.skeleton}</div>
            </FeatureCard>
          ))}
        </div>
      </div>
    </div>
  );
}

const FeatureCard = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative z-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-6",
        className
      )}
    >
      {children}
    </div>
  );
};

const FeatureTitle = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="text-3xl font-semibold mb-4 text-neutral-800 dark:text-neutral-200">
      {children}
    </p>
  );
};

const FeatureDescription = ({ children }: { children?: React.ReactNode }) => {
  return (
    <p className="text-neutral-600 dark:text-neutral-100 text-md font-mono leading-relaxed">
      {children}
    </p>
  );
};

export const SkeletonOne = ({ items = [] }: { items?: SkeletonOneItem[] }) => {
  return (
    <div className="relative w-full h-full flex justify-start items-start pt-4 overflow-hidden">
      {/* Background animated elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/6 w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-0.5 h-0.5 bg-pink-400 rounded-full animate-pulse delay-300"></div>
        <div className="absolute bottom-1/3 left-1/3 w-0.5 h-0.5 bg-blue-400 rounded-full animate-pulse delay-700"></div>
        <div className="absolute top-2/3 right-1/6 w-1 h-1 bg-cyan-400 rounded-full animate-pulse delay-1000"></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 lg:gap-6 px-2 pt-2 pb-6 md:pt-4 md:pb-4">
        {items.map((item, idx) => (
          <div
            key={"skeleton-item-" + idx}
            className="group relative w-full aspect-square max-w-[120px] sm:max-w-[140px] md:max-w-[160px] lg:max-w-[180px] xl:max-w-[200px] mx-auto flex-shrink-0"
          >
            {/* Main orb */}
            <div
              className="relative w-full h-full rounded-full flex items-center justify-center text-center p-2 md:p-3 transition-all duration-500 ease-out
                         hover:scale-110 hover:rotate-12 group-hover:shadow-2xl group-hover:shadow-purple-500/25"
              style={{
                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.9), rgba(219, 39, 119, 0.6), rgba(59, 130, 246, 0.4))",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.2)",
                boxShadow: "inset 0 0 30px rgba(139, 92, 246, 0.3)",
              }}
            >
              {/* Animated rings */}
              <div className="absolute inset-0 rounded-full border border-purple-400/40 group-hover:border-purple-300/60 transition-colors duration-300"></div>
              <div className="absolute inset-1 rounded-full border border-pink-400/30 group-hover:border-pink-300/50 transition-colors duration-300 delay-100"></div>
              <div className="absolute inset-2 rounded-full border border-blue-400/20 group-hover:border-blue-300/40 transition-colors duration-300 delay-200"></div>

              {/* Ripple effect on hover */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 rounded-full border-2 border-purple-300/60 animate-ping"></div>
                <div className="absolute inset-1 rounded-full border border-pink-300/40 animate-ping delay-75"></div>
              </div>

              {/* Hover shine effect */}
              <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500
                              bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-45 transform -skew-x-12
                              animate-pulse"></div>

              {/* Floating particles */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full opacity-70 group-hover:opacity-100 group-hover:animate-bounce"></div>
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-cyan-300 rounded-full opacity-50 group-hover:opacity-80 group-hover:animate-bounce delay-300"></div>
              <div className="absolute top-1/3 -left-2 w-1 h-1 bg-pink-300 rounded-full opacity-60 group-hover:opacity-90 group-hover:animate-bounce delay-700"></div>

              {/* Content */}
              <p className="relative z-10 text-white/90 group-hover:text-white font-mono text-[10px] md:text-xs lg:text-sm
                           font-semibold leading-tight drop-shadow-lg transition-colors duration-300">
                {item.title}
              </p>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-purple-500/20 group-hover:bg-purple-400/30
                              blur-xl scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500 -z-10"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Connecting lines animation */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(219, 39, 119, 0.3)" />
          </linearGradient>
        </defs>
        {/* Horizontal connections */}
        <line x1="25%" y1="50%" x2="75%" y2="50%" stroke="url(#lineGradient)" strokeWidth="1"
              className="hidden lg:block animate-pulse" style={{animationDuration: '4s'}} />
        {/* Vertical connections */}
        <line x1="50%" y1="25%" x2="50%" y2="75%" stroke="url(#lineGradient)" strokeWidth="1"
              className="hidden lg:block animate-pulse delay-1000" style={{animationDuration: '4s'}} />
      </svg>
    </div>
  );
};

export const SkeletonThree = () => {
  return (
    <a
      href="https://www.youtube.com/watch?v=n5UMmgs7E6Y"
      target="__blank"
      className="relative flex gap-10  h-auto group/image"
    >
      <div className="w-full  mx-auto bg-transparent dark:bg-transparent group h-full">
        <div className="flex flex-1 w-full h-full flex-col space-y-2  relative">
          {/* TODO */}
          <IconBrandYoutubeFilled className="h-20 w-20 absolute z-10 inset-0 text-red-500 m-auto " />
          <Image
            src="/images/min-area.jpg"
            alt="header"
            width={800}
            height={800}
            className="h-full w-full aspect-square object-cover object-center rounded-sm blur-none group-hover/image:blur-md transition-all duration-200"
          />
        </div>
      </div>
    </a>
  );
};

export const SkeletonTwo = ({ items = [] }: { items?: SkeletonTwoItem[] }) => {
  const icons = [
    {
      icon: <IconGavel className="h-10 w-10 text-neutral-500" />,
    },
    {
      icon: <IconShieldCheck className="h-10 w-10 text-neutral-500" />,
    },
    {
      icon: <IconFileCheck className="h-10 w-10 text-neutral-500" />,
    },
    {
      icon: <IconEye className="h-10 w-10 text-neutral-500" />,
    },
  ];
  return (
    <div className="relative flex flex-col items-start p-4 gap-4 h-full">
      {items.map((item, idx) => (
        <div key={"icons-first" + idx} className="flex items-center gap-2">
          {icons[idx]?.icon}
          <p className="text-neutral-600 dark:text-neutral-100 text-md font-mono">
            {item.title}
          </p>
        </div>
      ))}
    </div>
  );
};

export const SkeletonFour = () => {
  return (
    <div className="h-auto w-full flex justify-center items-end overflow-hidden">
      <Globe />
    </div>
  );
};

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let phi = 0;

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: 1200,
      height: 1200,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        // longitude latitude
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        state.phi = phi;
        phi += 0.01;
      },
    });

    return () => {
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: 600, height: 600, aspectRatio: 1 }}
      className={cn("w-auto h-auto", className)}
    />
  );
};
