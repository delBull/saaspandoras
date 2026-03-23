"use client";

import { useState, useEffect } from "react";
import { getWhatsAppUrl } from "@/lib/whatsapp/config/landingConfig";

export default function WhatsAppFoundersForm() {
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
            type: "whatsapp_click_founders", 
            silent: true,
            tags: ["B2B_FOUNDER", "HIGH_TICKET"] 
          },
          scope: "b2b",
          projectId: 1
        }),
      });
    } catch (e) {
      console.warn("[Growth OS] Silent track founders failed:", e);
    }
  };

  const handleStartFoundersFlow = async () => {
    setLoading(true);

    try {
      // 1. Silent Lead Capture
      trackSilentLead();

      // 2. WhatsApp Redirection
      const whatsappUrl = getWhatsAppUrl('founders');
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error iniciando flujo founders WhatsApp:", error);
      alert("Error al abrir WhatsApp.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-zinc-400 text-sm mb-4">
        Inicia una conversación premium con un estratega para evaluar tu capacidad de capital y experiencia como founder.
      </p>

      <button
        onClick={handleStartFoundersFlow}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">♛</span>
        {loading ? "Iniciando..." : "🔥 Conectar con Estratega Premium"}
      </button>

      <p className="text-zinc-500 text-xs">
        Exclusivo para Founders • Capital Requerido • Evaluación Premium
      </p>
    </div>
  );
}
