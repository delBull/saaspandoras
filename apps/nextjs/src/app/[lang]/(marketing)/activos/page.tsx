"use client";

import { motion, type Variants } from "framer-motion";
import { KeyRound } from 'lucide-react';

// La data de los activos
const assets = [
  {
    title: "Casa Bella",
    description: "Una villa de lujo con vista al mar y acabados de alta gama.",
    tag: "REAL ESTATE",
  },
  {
    title: "Vista Horizonte",
    description: "La mejor vista de la Bahía en un lugar maravilloso.",
    tag: "REAL ESTATE",
  },
  {
    title: "Narai",
    description: "Condominios con vista al mar, comodidad y lujo.",
    tag: "REAL ESTATE",
  },
  {
    title: "Startup de IA",
    description: "Revolucionando el mercado con inteligencia artificial.",
    tag: "STARTUP",
  },
  {
    title: "Fintech Innovadora",
    description: "Ofreciendo soluciones de pago radicalmente nuevas.",
    tag: "STARTUP",
  },
  {
    title: "E-commerce Sostenible",
    description: "Moda sostenible con un gran potencial de crecimiento.",
    tag: "STARTUP",
  },
];

// --- Variants para las animaciones de Framer Motion ---
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

// --- Componente de la Tarjeta Rediseñada ---
function MarketplaceCard({ asset }: { asset: typeof assets[0] }) {
  return (
    <motion.div
      variants={cardVariants}
      className="group relative flex flex-col justify-between p-6 overflow-hidden rounded-xl 
                 border border-gray-700/80 shadow-lg h-96"
    >
      {/* Efecto de reflejo diagonal en hover con nuevo color */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-xl">
          <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-transparent via-lime-100/10 to-transparent 
                          transform -rotate-45 -translate-x-full transition-transform duration-700 ease-in-out 
                          group-hover:translate-x-full group-hover:blur-lg"></div>
      </div>

      {/* Contenedor principal del contenido de la tarjeta */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Contenido de texto agrupado */}
        <div className="flex-grow">
          <p className="mb-2 text-sm font-semibold tracking-wider text-lime-300 font-shadows">
            {asset.tag}
          </p>
          <h3 className="mb-4 text-3xl font-mono font-bold text-white leading-tight">{asset.title}</h3>
          <p className="text-gray-300 text-sm">{asset.description}</p>
        </div>
        
        {/* Icono al final */}
        <div className="mt-auto flex justify-end">
          <KeyRound className="h-10 w-10 text-lime-200/50" />
        </div>
      </div>
    </motion.div>
  );
}

// --- Página de Activos Reconstruida ---
export default function ActivosPage() {
  return (
    <div className="min-h-screen w-full text-white">
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-mono font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-lime-300 to-green-500">
            Activos Digitales
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Explora oportunidades de inversión únicas en el mundo digital.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {assets.map((asset) => (
            <MarketplaceCard key={asset.title} asset={asset} />
          ))}
        </motion.div>

      </div>
    </div>
  );
}
