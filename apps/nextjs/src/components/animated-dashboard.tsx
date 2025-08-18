"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import type { MarketingDictionary } from "~/types";
import { PinContainer } from "./ui/3d-pin";

interface AnimatedDashboardProps {
  dict: MarketingDictionary["dashboard"];
}

export function AnimatedDashboard({ dict: _dict }: AnimatedDashboardProps) {
  const { scrollY } = useScroll();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const opacity = useTransform(
    scrollY,
    isMobile ? [0, 300, 500, 800] : [0, 200, 300, 500],
    isMobile ? [1, 1, 0.8, 0] : [1, 1, 0.5, 0],
  );

  const y = useTransform(
    scrollY,
    isMobile ? [0, 300, 500, 800] : [0, 200, 300, 500],
    isMobile ? [0, 0, 50, 150] : [0, 0, 100, 200],
  );

  return (
    <div className="relative w-full">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ opacity, y }}
        className="relative group"
      >
        {/* Left side annotation 
        <div className="absolute -left-96 top-0 z-20">
          <Annotation
            direction="right"
            label={dict.config_panel}
            lineLength={180}
            dotSpacing={6}
            dotSize={3}
            startOffset={-20}
          />
        </div>
        */}
        {/* Right side annotation 
        <div className="absolute -right-6 top-96 z-20">
          <Annotation
            direction="left"
            label={dict.investments_panel}
            lineLength={120}
            dotSpacing={6}
            dotSize={3}
            startOffset={20}
          />
        </div>
        */}

        
        <div className="pt-80 xs:pt-0">
          <PinContainer title="Pandoras Dashboard" href="/dashboard">
            <div className="flex flex-col items-center justify-center w-80 h-60">
              <span className="text-xl font-bold text-white mb-2">Pandoras Dashboard</span>
              <span className="text-sm text-zinc-300">Visualiza tus inversiones y métricas aquí</span>
              <Image src="/images/onlybox2.png" width={120} height={120} alt="Dashboard Preview" className="mt-4 rounded-lg" />
            </div>
          </PinContainer>
        </div>
        <Image
          src="/images/smoke.png"
          width={800}
          height={1200}
          alt="Pandoras Dashboard"
          className="absolute bottom-0 right-0 -z-10 opacity-70"
          priority
        />
      </motion.div>
    </div>
  );
}
