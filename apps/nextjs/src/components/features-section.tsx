"use client";
import React from "react";
import { cn } from "~/lib/utils";
import createGlobe from "cobe";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IconBrandYoutubeFilled, IconShieldCheck, IconGavel, IconEye, IconFileCheck } from "@tabler/icons-react";
import { Shadows_Into_Light } from "next/font/google";

const shadowsIntoLight = Shadows_Into_Light({
  subsets: ["latin"],
  weight: "400",
});

interface SkeletonOneItem {
  title: string;
  image?: string;
}

interface SkeletonTwoItem {
  title: string;
}

interface Feature {
  title: string;
  description: string;
  skeleton: React.ReactNode;
  className: string;
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
        "col-span-1 lg:col-span-4 border-b lg:border-r dark:border-neutral-800",
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
        <h4 className={cn(shadowsIntoLight.className, "text-4xl sm:text-5xl text-neutral-800 dark:text-neutral-200 max-w-5xl mx-auto text-center")}>
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
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {items.map((item, idx) => (
          <div
            key={"items-first" + idx}
            className="group relative w-48 h-48 rounded-full flex items-center justify-center text-center p-4 overflow-hidden"
            style={{
              background: "linear-gradient(to bottom right, rgba(123, 27, 116, 0.8), rgba(180, 80, 170, 0.2))",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
            >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/10 to-transparent -translate-y-full group-hover:translate-y-0 transition-transform duration-700 ease-out blur-lg"></div>
            <p className="relative z-10 text-neutral-200 text-sm font-mono">
              {item.title}
            </p>
          </div>
        ))}
      </div>
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
          <img
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