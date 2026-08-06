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
  Briefcase,
  Radio,
  Cpu
} from "lucide-react";
import { IPRegisterModal } from "./IPRegisterModal";

const categories = [
  {
    id: "protocol",
    title: "Core Protocol",
    icon: <Network className="w-5 h-5" />,
    color: "from-blue-500/20 to-purple-500/20",
    border: "border-blue-500/30",
    links: [
      { name: "Protocol Overview", path: "https://dash.pandoras.finance/protocol" },
      { name: "Utility Protocol", path: "https://dash.pandoras.finance/utility-protocol" },
      { name: "Protocol Story", path: "https://dash.pandoras.finance/protocol-story" },
      { name: "Litepaper", path: "https://dash.pandoras.finance/litepaper" },
      { name: "Whitepaper", path: "https://dash.pandoras.finance/whitepaper" },
      { name: "Roadmap", path: "https://dash.pandoras.finance/roadmap" },
    ]
  },
  {
    id: "growth",
    title: "Growth & Platform Infrastructure",
    icon: <Rocket className="w-5 h-5" />,
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    links: [
      { name: "Growth OS (Ecosystem Portal)", path: "https://dash.pandoras.finance/growth-os" },
      { name: "Hermes AI Platform (AI-OS)", path: "https://dash.pandoras.finance/growth-os/hermes" },
      { name: "Pandora's Media Co (Demand Engine)", path: "https://dash.pandoras.finance/media" },
      { name: "Asset Capitalization", path: "https://dash.pandoras.finance/asset-capitalization" },
      { name: "Ambassadors", path: "https://dash.pandoras.finance/ambassadors" },
      { name: "Founders", path: "https://dash.pandoras.finance/founders" },
      { name: "Bitcoin Initiative", path: "https://dash.pandoras.finance/bitcoin-initiative" },
      { name: "Events", path: "https://dash.pandoras.finance/events" },
      { name: "Apply", path: "https://dash.pandoras.finance/apply" },
      { name: "Join", path: "https://dash.pandoras.finance/join" },
      { name: "Waitlist Success", path: "https://dash.pandoras.finance/waitlist-success" },
    ]
  },
  {
    id: "access",
    title: "Platform & Access",
    icon: <Shield className="w-5 h-5" />,
    color: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/30",
    links: [
      { name: "Login / Start", path: "https://dash.pandoras.finance/access" },
      { name: "App Dashboard", path: "https://dash.pandoras.finance/dashboard" },
      { name: "User Profile", path: "https://dash.pandoras.finance/dashboard/profile" },
      { name: "Business Profile", path: "https://dash.pandoras.finance/dashboard/profile/projects" },
      { name: "Main Home", path: "/" },
    ]
  },
  {
    id: "resources",
    title: "Resources & Institutional Books",
    icon: <BookOpen className="w-5 h-5" />,
    color: "from-zinc-500/20 to-gray-500/20",
    border: "border-zinc-500/30",
    links: [
      { name: "🏛️ Pandoras Institutional Framework (Libros 0–VIII)", path: "/libros" },
      { name: "⚙️ IOM System & Architecture (5 Layers)", path: "/libros/constitucion" },
      { name: "📜 Pandoras Asset Standard (PAS v1.0)", path: "/libros/libro-iv" },
      { name: "🔑 Licensing Framework (Libro V)", path: "/libros/libro-v" },
      { name: "💻 Tech Platform & Capital Engine (Libro VI)", path: "/libros/libro-vi" },
      { name: "🤖 Hermes Agent OS & Kernel Architecture (Libro IX)", path: "/libros/libro-ix" },
      { name: "🚀 Growth & Expansion Roadmap (Libro VII)", path: "/libros/libro-vii" },
      { name: "⚖️ Institutional Doctrine (Libro VIII)", path: "/libros/libro-viii" },
      { name: "🛠️ Institutional Execution Manual", path: "/libros" },
      { name: "Institutional Book", path: "/institutional-book" }
    ]
  },
  {
    id: "hermes",
    title: "Hermes Cognitive OS",
    icon: <Cpu className="w-5 h-5" />,
    color: "from-purple-500/20 to-indigo-500/20",
    border: "border-purple-500/30",
    links: [
      { name: "Vision", path: "/libros/libro-ix#vision" },
      { name: "🔒 Constitution (ADRs 000-011)", path: "https://github.com/Pandoras/dApps/tree/main/saaspandoras/apps/dashboard/docs/adr" },
      { name: "Architecture", path: "/libros/libro-ix#architecture" },
      { name: "Contracts", path: "/libros/libro-ix#contracts" },
      { name: "SDK", path: "/libros/libro-ix#sdk" },
      { name: "APIs", path: "/libros/libro-ix#apis" },
      { name: "Tutorials", path: "/libros/libro-ix#tutorials" },
      { name: "Examples", path: "/libros/libro-ix#examples" },
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
  const [isIpModalOpen, setIsIpModalOpen] = useState(false);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 overflow-hidden bg-background">
      <IPRegisterModal isOpen={isIpModalOpen} onClose={() => setIsIpModalOpen(false)} />

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
            className="text-3xl md:text-5xl font-light tracking-tight text-foreground mb-2"
          >
            PANDORA'S <span className="font-semibold text-primary">NEXUS</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm md:text-base text-muted-foreground max-w-lg font-light"
          >
            Unified Index of Public Platform Infrastructure, Growth OS, Hermes & Media Engine
          </motion.p>
        </header>

        {/* Category Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 overflow-y-auto pr-1 pb-4"
        >
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              variants={itemVariants}
              className={`flex flex-col rounded-3xl border ${cat.border} bg-card/40 backdrop-blur-xl p-6 transition-all duration-300 hover:bg-card/60 hover:shadow-2xl hover:shadow-primary/5 group relative overflow-hidden`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              <div className="flex items-center gap-3 mb-6 shrink-0 relative z-10">
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-primary">
                  {cat.icon}
                </div>
                <h2 className="text-lg font-medium text-foreground tracking-tight">{cat.title}</h2>
              </div>

              <div className="flex flex-col space-y-2 flex-1 relative z-10">
                {cat.links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.path}
                    target={link.path.startsWith("http") ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-xs text-muted-foreground hover:text-foreground transition-all duration-200 group/link"
                  >
                    <span className="truncate pr-2">{link.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 text-primary transition-all -translate-x-1 group-hover/link:translate-x-0 shrink-0" />
                  </a>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer info & CTA */}
        <footer className="mt-6 pt-4 border-t border-border/40 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground shrink-0 gap-4">
          <div>
            <span>Pandora's Growth OS & Platform Ecosystem</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsIpModalOpen(true)}
              className="hover:text-primary transition-colors text-xs underline font-mono"
            >
              IP & Patent Registry
            </button>
            <span className="font-mono text-[10px] text-muted-foreground/60">v2.5 Live</span>
          </div>
        </footer>
      </motion.div>
    </div>
  );
}
