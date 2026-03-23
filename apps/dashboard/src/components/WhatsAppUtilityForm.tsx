"use client";

import { useState, useEffect } from "react";
import { getWhatsAppUrl } from "@/lib/whatsapp/config/landingConfig";

export default function WhatsAppUtilityForm() {
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    let fp = localStorage.getItem("growth_fp");
    if (!fp) {
      fp = crypto.randomUUID();
      localStorage.setItem("growth_fp", fp);
    }
    setFingerprint(fp);
  }, []);

  const trackSilentLead = async () => {
    try {
      await fetch("/api/v1/marketing/leads/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint,
          origin: window.location.href,
          intent: "invest",
          consent: true,
          metadata: { 
            type: "whatsapp_click_utility", 
            silent: true,
            tags: ["B2B_UTILITY_PROTOCOL", "ARCHITECT"] 
          },
          scope: "b2b",
          projectId: 1
        }),
      });
    } catch (e) {
      console.warn("[Growth OS] Silent track utility failed:", e);
    }
  };

  const handleStartUtilityFlow = async () => {
    setLoading(true);

    try {
      // 1. Silent Lead Capture
      trackSilentLead();

      // 2. WhatsApp Redirection
      const whatsappUrl = getWhatsAppUrl('utility-protocol');
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error iniciando flujo utility WhatsApp:", error);
      alert("Error al abrir WhatsApp.");
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