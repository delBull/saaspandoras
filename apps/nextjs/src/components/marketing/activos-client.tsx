'use client';

import { motion, type Variants } from "framer-motion";
import { Info } from 'lucide-react';
import Framer3dIcon from './Framer3dIcon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@saasfly/ui/dialog";

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
      className="group relative flex flex-col justify-between p-6 overflow-hidden rounded-xl 
                 border border-gray-700/80 shadow-lg h-96 font-sans"
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
          <h3 className="mb-4 text-4xl font-mono font-bold text-white leading-tight">{title}</h3>
          <p className="text-gray-300 text-sm">{description}</p>
        </div>
        <div className="mt-auto flex justify-end">
          <Framer3dIcon width={64} height={64} heading="" text="" />
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
          className="mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-start md:gap-x-8">
            <div className="w-full md:w-2/3">
              <h1 className="text-4xl md:text-6xl uppercase font-bold tracking-tighter text-left md:text-right font-mono relative md:-top-2 text-white">
                {dict.activos.title}
              </h1>
            </div>
            <div className="w-full md:w-1/3 mt-4 md:mt-0">
              <p className="text-lg text-left text-gray-200">
                {dict.activos.subtitle}
              </p>
               <div className="flex mt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="transition-transform duration-200 ease-in-out hover:scale-95 active:scale-90 flex-shrink-0">
                      <Info className="h-5 w-5 text-gray-400 hover:text-gray-200" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="fixed left-[50%] top-[50%] max-h-[85vh] w-[90vw] max-w-[800px] translate-x-[-50%] translate-y-[-50%] rounded-2xl bg-white dark:bg-neutral-900 p-8 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] overflow-y-auto">
                    <DialogTitle className="sr-only">{dict.activos.info_modal.title}</DialogTitle>
                    <div className="space-y-8">
                      <div>
                        <DialogDescription className="text-md text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {dict.activos.info_modal.paragraph1}
                        </DialogDescription>
                      </div>
                      <div>
                        <DialogDescription className="text-md text-neutral-600 dark:text-neutral-300 leading-relaxed">
                          {dict.activos.info_modal.paragraph2}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
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

        <div className="my-44 space-y-24">
          <InfoSection 
            title={dict.activos.info_sections.section1.title}
            content={dict.activos.info_sections.section1.content}
            alignment="left"
          />
          <InfoSection 
            title={dict.activos.info_sections.section2.title}
            content={dict.activos.info_sections.section2.content}
            alignment="right"
          />
        </div>

      </div>
    </div>
  );
}

// --- Info Section Component ---
function InfoSection({ title, content, alignment = 'left' }: { title: string, content: string, alignment?: 'left' | 'right' }) {
  const variants: Variants = {
    hidden: { opacity: 0, x: alignment === 'left' ? -50 : 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const textAlignClass = alignment === 'left' ? 'text-left' : 'text-right';
  const alignItemsClass = alignment === 'left' ? 'items-start' : 'items-end';

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      variants={variants}
      className={`flex flex-col ${alignItemsClass}`}>
      <h2 className={`text-4xl font-bold mb-4 text-white max-w-2xl ${textAlignClass}`}>{title}</h2>
      <p className={`text-lg text-gray-200 font-mono max-w-2xl ${textAlignClass}`}>{content}</p>
    </motion.div>
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