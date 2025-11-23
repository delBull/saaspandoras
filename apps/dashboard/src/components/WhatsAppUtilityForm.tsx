"use client";

import { useState } from "react";
import { getWhatsAppUrl } from "@/lib/whatsapp/config/landingConfig";

export default function WhatsAppUtilityForm() {
  const [loading, setLoading] = useState(false);

  const handleStartUtilityFlow = () => {
    setLoading(true);

    try {
      // Usar configuración específica para landing /utility-protocol (utility flow)
      const whatsappUrl = getWhatsAppUrl('utility-protocol');

      console.log("🔗 WhatsApp Utility URL:", whatsappUrl);

      // Redirigir directamente a WhatsApp
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error iniciando flujo utility WhatsApp:", error);
      alert("Error al abrir WhatsApp. Verifica tu conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-zinc-400 text-sm mb-4">
        Conecta con nuestro equipo de arquitectura para diseñar tu Protocolo de Utilidad Work-to-Earn (W2E).
      </p>

      <button
        onClick={handleStartUtilityFlow}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">🔧</span>
        {loading ? "Iniciando..." : "🏗️ Consultoría Arquitectura W2E"}
      </button>

      <p className="text-zinc-500 text-xs">
        Especializado en Loom Protocol • Análisis técnico • Dual-Treasury design
      </p>
    </div>
  );
}