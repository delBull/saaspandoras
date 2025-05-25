"use client";

import { motion } from "framer-motion";
import React, { useRef, useState } from "react";
import { cn } from "~/lib/utils";

interface BannerProps {
  title: string;
  subtitle: string;
  actionText: string;
  variant: 'purple' | 'green' | 'red';
}

interface RelativeCoordinates {
  x: number;
  y: number;
}

function getRelativeCoordinates(event: React.MouseEvent, referenceElement: HTMLDivElement): RelativeCoordinates {
  const position = {
    x: event.pageX,
    y: event.pageY
  };

  const offset = {
    left: referenceElement.offsetLeft,
    top: referenceElement.offsetTop,
    width: referenceElement.clientWidth,
    height: referenceElement.clientHeight
  };

  let reference = referenceElement.offsetParent as HTMLElement;

  while (reference) {
    offset.left += reference.offsetLeft;
    offset.top += reference.offsetTop;
    reference = reference.offsetParent as HTMLElement;
  }

  return {
    x: position.x - offset.left,
    y: position.y - offset.top
  };
}

const buttonVariantStyles: Record<BannerProps['variant'], string> = {
  purple: 'from-purple-400 to-indigo-400',
  green: 'from-lime-400 to-emerald-400',
  red: 'from-rose-400 to-red-400'
};

export function PromotionalBanner({ title, subtitle, actionText, variant }: BannerProps) {
  const [showGradient, setShowGradient] = useState(false);
  const [mousePosition, setMousePosition] = useState<RelativeCoordinates>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const variantStyles: Record<BannerProps['variant'], string> = {
    purple: 'from-purple-500/50 to-indigo-500/50',
    green: 'from-green-500/50 to-emerald-500/50',
    red: 'from-red-500/50 to-rose-500/50'
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      setMousePosition(getRelativeCoordinates(e, containerRef.current));
    }
  };

  const contentContainerClasses = [
    "relative h-full w-full rounded-xl p-6",
    "bg-zinc-900/90 backdrop-blur-sm",
    "flex flex-col justify-between",
    "transition-all duration-300"
  ] as const;

  const gradientOverlayClasses = [
    "absolute inset-0 opacity-0 transition-opacity duration-300 rounded-xl",
    "bg-gradient-to-r",
    variantStyles[variant],
    showGradient ? "opacity-10" : ""
  ] as const;

  return (
    <motion.div
      ref={containerRef}
      onHoverStart={() => setShowGradient(true)}
      onHoverEnd={() => setShowGradient(false)}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-[1.1/1] rounded-xl overflow-hidden"
    >
      {/* Glow Effect Layer */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: showGradient ? 1 : 0,
          backgroundImage: `radial-gradient(
            600px at ${mousePosition.x}px ${mousePosition.y}px,
            rgba(255, 255, 255, 0.15),
            transparent 40%
          )` as React.CSSProperties['backgroundImage']
        }}
      />

      {/* Gradient Border */}
      <div className="absolute inset-0 p-[2px] rounded-xl bg-gradient-to-r from-white/10 to-white/5">
        {/* Content Container */}
        <div className={cn(contentContainerClasses.join(' ')) as unknown as string}>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-300/90 mb-4">{subtitle}</p>
          </div>
          
          {/* Gradient Overlay */}
          <div className={cn(gradientOverlayClasses.join(' ')) as unknown as string}/>

          <button 
        className={cn(
          "relative z-10 text-sm font-medium",
          "px-4 py-2 rounded-lg",
          "bg-gradient-to-r",
          buttonVariantStyles[variant],
          "text-black font-semibold",
          "hover:opacity-90 hover:scale-105",
          "transform transition-all duration-200",
          "shadow-lg backdrop-blur-sm"
        ) as unknown as string}
      >
        {actionText}
      </button>
        </div>
      </div>
    </motion.div>
  );
}