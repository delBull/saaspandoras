"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Building2, TrendingUp, DollarSign } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@saasfly/ui/button";

interface AssetSimulatorProps {
  title?: string;
  description?: string;
  className?: string;
}

export function AssetSimulator({
  title = "Simulador de Tokenización",
  description = "Ve cómo cualquier activo se convierte en oportunidades digitales",
  className = ""
}: AssetSimulatorProps) {
  const [selectedAsset, setSelectedAsset] = useState<string>("casa");
  const [assetValue, setAssetValue] = useState<number>(500000);
  const [isSimulating, setIsSimulating] = useState(false);

  const assets = [
    {
      id: "casa",
      name: "Casa Residencial",
      value: 500000,
      icon: <Building2 className="w-6 h-6" />,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "edificio",
      name: "Edificio Comercial",
      value: 2000000,
      icon: <TrendingUp className="w-6 h-6" />,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "startup",
      name: "Startup Tech",
      value: 1000000,
      icon: <DollarSign className="w-6 h-6" />,
      color: "from-green-500 to-emerald-500"
    }
  ];

  const tokenCount = assetValue;
  const tokenPrice = 1;

  const handleSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 2000);
  };

  return (
    <GlassCard className={`text-center ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm">{description}</p>
      </div>

      {/* Selector de activos */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {assets.map((asset) => (
          <button
            key={asset.id}
            onClick={() => {
              setSelectedAsset(asset.id);
              setAssetValue(asset.value);
            }}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              selectedAsset === asset.id
                ? "bg-blue-500/20 border-blue-500 text-white"
                : "bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:bg-zinc-700/50"
            }`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${asset.color}`}>
                {asset.icon}
              </div>
              <span className="text-xs font-medium">{asset.name}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Valor del activo */}
      <div className="mb-6">
        <label htmlFor="asset-value" className="block text-sm text-zinc-400 mb-2">Valor del Activo</label>
        <div className="relative">
          <input
            id="asset-value"
            type="range"
            min="100000"
            max="5000000"
            step="50000"
            value={assetValue}
            onChange={(e) => setAssetValue(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-zinc-500 mt-1">
            <span>$100K</span>
            <span className="font-bold text-green-400">${assetValue.toLocaleString()}</span>
            <span>$5M</span>
          </div>
        </div>
      </div>

      {/* Botón de simulación */}
      <Button
        onClick={handleSimulation}
        disabled={isSimulating}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white font-medium mb-6"
      >
        {isSimulating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
          />
        ) : (
          <Play className="w-4 h-4 mr-2" />
        )}
        {isSimulating ? "Procesando..." : "Simular Tokenización"}
      </Button>

      {/* Resultados */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: isSimulating ? 0 : 1,
          scale: isSimulating ? 0.9 : 1
        }}
        className="space-y-4"
      >
        <div className="p-4 bg-zinc-800/50 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Tu activo se convierte en:</p>
          <p className="text-2xl font-bold text-blue-400">
            {tokenCount.toLocaleString()} tokens
          </p>
          <p className="text-sm text-zinc-500">de ${tokenPrice} cada uno</p>
        </div>

        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Accesibilidad creada:</p>
          <p className="text-lg font-bold text-green-400">
            Desde ${tokenPrice} por token
          </p>
          <p className="text-xs text-zinc-500">cualquiera puede invertir</p>
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-sm text-zinc-400 mb-1">Liquidez generada:</p>
          <p className="text-lg font-bold text-purple-400">
            Mercado 24/7
          </p>
          <p className="text-xs text-zinc-500">compra y venta instantánea</p>
        </div>
      </motion.div>

      {/* Información adicional */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-3 bg-zinc-800/30 rounded-lg"
      >
        <p className="text-xs text-zinc-400 italic">
          &ldquo;Así de simple es convertir valor real en oportunidades digitales accesibles para todos.&rdquo;
        </p>
      </motion.div>
    </GlassCard>
  );
}