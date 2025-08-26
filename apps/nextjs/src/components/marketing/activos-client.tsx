'use client';

import { motion, type Variants } from "framer-motion";
import { KeyRound } from 'lucide-react';

// --- Card Component ---
function MarketplaceCard({ 
  tag,
  title,
  description 
}: {
  tag: string;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col justify-between p-6 overflow-hidden rounded-md 
                 border border-gray-800/80 shadow-lg h-96 font-sans"
    >
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-transparent via-lime-100/10 to-transparent 
                          transform -rotate-45 -translate-x-full transition-transform duration-700 ease-in-out 
                          group-hover:translate-x-full group-hover:blur-lg"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-grow">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-lime-300 font-shadows">
            {tag}
          </p>
          <h3 className="mb-4 text-3xl font-mono font-bold text-white leading-tight">{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
        <div className="mt-auto flex justify-end">
          <KeyRound className="h-10 w-10 text-lime-200/50" />
        </div>
      </div>
    </motion.div>
  );
}

// --- Main Client Component ---
export function ActivosClient({ dict }: { dict: any }) {
  const assetKeys = Object.keys(dict.activos.assets);

  return (
    <div className="min-h-screen w-full text-white">
      <div className="container mx-auto px-4 py-16 max-w-xs md:max-w-5xl">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-300 to-gray-100">
            {dict.activos.title}
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            {dict.activos.subtitle}
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {assetKeys.map((key) => {
            const asset = dict.activos.assets[key as keyof typeof dict.activos.assets];
            if (!asset) return null;
            return (
              <MarketplaceCard 
                key={key} 
                tag={asset.tag} 
                title={asset.title} 
                description={asset.description} 
              />
            )
          })}
        </motion.div>
      </div>
    </div>
  );
}

// --- Animation Variants ---
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 },
  },
};
