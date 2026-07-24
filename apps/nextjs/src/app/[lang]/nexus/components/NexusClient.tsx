"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import { 
  Network, 
  Rocket, 
  BookOpen, 
  LogOut,
  ChevronRight,
  Globe,
  Zap,
  Users,
  Shield,
  Briefcase
} from "lucide-react";

const categories = [
  {
    id: "protocol",
    title: "Core Protocol",
    icon: <Network className="w-5 h-5" />,
    color: "from-blue-500/20 to-purple-500/20",
    border: "border-blue-500/30",
    links: [
      { name: "Protocol Overview", path: "/protocol" },
      { name: "Utility Protocol", path: "/utility-protocol" },
      { name: "Protocol Story", path: "/protocol-story" },
      { name: "Litepaper", path: "/litepaper" },
      { name: "Whitepaper", path: "/whitepaper" },
      { name: "Roadmap", path: "/roadmap" },
    ]
  },
  {
    id: "growth",
    title: "Growth & Community",
    icon: <Rocket className="w-5 h-5" />,
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    links: [
      { name: "Asset Capitalization", path: "/asset-capitalization" },
      { name: "Growth OS", path: "/growth-os" },
      { name: "Ambassadors", path: "/ambassadors" },
      { name: "Founders", path: "/founders" },
      { name: "Bitcoin Initiative", path: "/bitcoin-initiative" },
      { name: "Events", path: "/events" },
      { name: "Apply", path: "/apply" },
      { name: "Join", path: "/join" },
      { name: "Waitlist Success", path: "/waitlist-success" },
    ]
  },
  {
    id: "access",
    title: "Platform & Access",
    icon: <Shield className="w-5 h-5" />,
    color: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
    links: [
      { name: "Login / Start", path: "/access" },
      { name: "App Dashboard", path: "/dashboard" },
      { name: "User Profile", path: "/dashboard/profile" },
      { name: "Business Profile", path: "/dashboard/profile/projects" },
      { name: "Main Home", path: "/" },
    ]
  },
  {
    id: "resources",
    title: "Resources",
    icon: <BookOpen className="w-5 h-5" />,
    color: "from-zinc-500/20 to-gray-500/20",
    border: "border-zinc-500/30",
    links: [
      { name: "General Resources", path: "/resources" },
      { name: "Materials", path: "/materials" },
    ]
  }
];

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

export default function NexusClient() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden bg-background">
      {/* Abstract Background Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[100px] mix-blend-screen" />
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-secondary/10 rounded-full blur-[80px] mix-blend-screen" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-7xl h-full max-h-[900px] flex flex-col"
      >
        <header className="flex flex-col items-center text-center mb-8 md:mb-12 shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl"
          >
            <Globe className="w-8 h-8 text-primary" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50"
          >
            Pandora's Nexus
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-3 text-sm md:text-base text-muted-foreground max-w-xl mx-auto"
          >
            Centralized access to the entire ecosystem. Navigate through protocol documentation, growth initiatives, and platform access.
          </motion.p>
        </header>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {categories.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              onMouseEnter={() => setActiveCategory(category.id)}
              onMouseLeave={() => setActiveCategory(null)}
              className={`relative flex flex-col h-full rounded-3xl border border-white/5 bg-black/40 backdrop-blur-xl overflow-hidden group transition-all duration-500 ease-out ${
                activeCategory === category.id ? "border-white/20 shadow-2xl shadow-white/5" : ""
              }`}
            >
              {/* Category Gradient Background */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              
              <div className="relative z-10 p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-xl bg-white/5 border ${category.border} text-foreground`}>
                    {category.icon}
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    {category.title}
                  </h2>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                  <AnimatePresence>
                    {category.links.map((link, idx) => (
                      <motion.div
                        key={link.path}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Link 
                          href={link.path}
                          className="group/link flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-colors duration-200 border border-transparent hover:border-white/10"
                        >
                          <span className="text-sm font-medium text-foreground/80 group-hover/link:text-foreground transition-colors">
                            {link.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-foreground/40 group-hover/link:text-foreground transform group-hover/link:translate-x-1 transition-all" />
                        </Link>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Global styles for custom scrollbar within cards if needed */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
