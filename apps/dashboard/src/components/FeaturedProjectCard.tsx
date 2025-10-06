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
    "flex flex-col justify-between",
    "transition-all duration-300",
  ].join(" ");

  return (
    <motion.div
      ref={containerRef}
      onHoverStart={() => setShowGradient(true)}
      onHoverEnd={() => setShowGradient(false)}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-[2/1] md:aspect-[1.1/1] rounded-xl overflow-hidden group"
    >
      {onClose && (
        <button
          onClick={onClose}
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
        <div className={cn(contentContainerClasses)}>
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-300/90 mb-4">{subtitle}</p>
          </div>
          <Link href={`/projects/${projectSlug}`}>
            <button
              className={
                cn(
                  "relative z-10 text-sm font-medium",
                  "px-4 py-2 rounded-lg",
                  "bg-gradient-to-r from-lime-400 to-emerald-400",
                  "text-black font-semibold",
                  "hover:opacity-90 hover:scale-105",
                  "transform transition-all duration-200",
                  "shadow-lg backdrop-blur-sm",
                ) as unknown as string
              }
            >
              {actionText}
            </button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}