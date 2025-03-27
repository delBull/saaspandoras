"use client"

import { useEffect, useState } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import type { MarketingDictionary } from "~/types"

interface AnimatedDashboardProps {
  dict: MarketingDictionary['dashboard']
}

export function AnimatedDashboard({ dict: _dict }: AnimatedDashboardProps) {

  const { scrollY } = useScroll()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const opacity = useTransform(
    scrollY,
    isMobile ? [0, 300, 500, 800] : [0, 200, 300, 500],
    isMobile ? [1, 1, 0.8, 0] : [1, 1, 0.5, 0]
  )

  const y = useTransform(
    scrollY,
    isMobile ? [0, 300, 500, 800] : [0, 200, 300, 500],
    isMobile ? [0, 0, 50, 150] : [0, 0, 100, 200]
  )

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

        {/* Dashboard Image */}
        <div className="relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-4 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl">
          <Image
            src="/images/layout.png"
            width={800}
            height={600}
            alt="Pandoras Dashboard"
            className="rounded-lg w-full h-auto md:opacity-70 opacity-90"
            priority
          />
        </div>
      </motion.div>
    </div>
  )
}
