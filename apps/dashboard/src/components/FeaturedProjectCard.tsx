"use client";

import { motion } from "framer-motion";
import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface FeaturedProjectCardProps {
  id: string;
  title: string;
  subtitle: string;
  actionText: string;
  imageUrl?: string;
  projectSlug: string;
  onClose?: () => void;
}

interface RelativeCoordinates {
  x: number;
  y: number;
}

function getRelativeCoordinates(
  event: React.MouseEvent,
  referenceElement: HTMLDivElement,
): RelativeCoordinates {
  const position = {
    x: event.pageX,
    y: event.pageY,
  };

  const offset = {
    left: referenceElement.offsetLeft,
    top: referenceElement.offsetTop,
    width: referenceElement.clientWidth,
    height: referenceElement.clientHeight,
  };

  let reference = referenceElement.offsetParent as HTMLElement;

  while (reference) {
    offset.left += reference.offsetLeft;
    offset.top += reference.offsetTop;
    reference = reference.offsetParent as HTMLElement;
  }

  return {
    x: position.x - offset.left,
    y: position.y - offset.top,
  };
}

export function FeaturedProjectCard({
  title,
  subtitle,
  actionText,
  imageUrl,
  projectSlug,
  onClose,
}: FeaturedProjectCardProps) {
  const [showGradient, setShowGradient] = useState(false);
  const [mousePosition, setMousePosition] = useState<RelativeCoordinates>({
    x: 0,
    y: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      setMousePosition(getRelativeCoordinates(e, containerRef.current));
    }
  };

  const contentContainerClasses = [
    "relative h-full w-full rounded-xl p-4",
    "bg-gradient-to-t from-black/70 via-black/40 to-transparent",
    "flex flex-col justify-between items-stretch",
    "transition-all duration-300",
    "min-h-[200px] md:min-h-[220px]",
  ].join(" ");

  return (
    <Link href={`/projects/${projectSlug}`} className="block w-full">
      <motion.div
        ref={containerRef}
        onHoverStart={() => setShowGradient(true)}
        onHoverEnd={() => setShowGradient(false)}
        onMouseMove={handleMouseMove}
        className="relative w-full aspect-[2/1] md:aspect-[1.1/1] rounded-xl overflow-hidden group min-h-[240px] md:min-h-[220px] cursor-pointer"
      >
        {onClose && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 z-20 p-1 bg-black/30 rounded-full text-gray-300 hover:text-white hover:bg-black/50 transition-colors"
            aria-label="Cerrar banner"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}

        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 90vw, 33vw"
            priority
            className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-30"
            style={{ zIndex: 0 }}
          />
        )}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: showGradient ? 1 : 0,
            backgroundImage: `radial-gradient(
              600px at ${mousePosition.x}px ${mousePosition.y}px,
              rgba(255, 255, 255, 0.15),
              transparent 40%
            )`,
          }}
        />
        <div className="absolute inset-0 p-[1px] rounded-xl bg-gradient-to-r from-white/10 to-white/5" style={{ zIndex: 3 }}>
          <div className={cn(contentContainerClasses, "pb-12 md:pb-4")}>
            <div className="flex-1 flex flex-col justify-end min-h-0">
              <h3 className="text-lg font-semibold text-white mb-1 md:mb-2 leading-tight">{title}</h3>
              <p className="text-sm text-gray-300/90 mb-3 md:mb-6 leading-relaxed line-clamp-3 overflow-hidden">
                {/* Mobile: límite muy reducido (60 chars), Desktop: mayor límite (200 chars) */}
                {subtitle.length > (typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 200)
                  ? `${subtitle.substring(0, typeof window !== 'undefined' && window.innerWidth < 768 ? 60 : 200)}...`
                  : subtitle}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                className={
                  cn(
                    "relative z-10 text-xs md:text-sm font-semibold w-full",
                    "px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg",
                    "bg-gradient-to-r from-lime-400 to-emerald-400",
                    "text-black",
                    "hover:opacity-90 hover:scale-105",
                    "transform transition-all duration-200",
                    "shadow-lg backdrop-blur-sm",
                    "flex items-center justify-center",
                    "min-h-[28px] md:min-h-[40px]"
                  ) as unknown as string
                }
              >
                {actionText}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
