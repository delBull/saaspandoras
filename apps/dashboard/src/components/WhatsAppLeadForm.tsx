"use client";

import { useState, useEffect } from "react";
import { getWhatsAppUrl } from "@/lib/whatsapp/config/landingConfig";

export default function WhatsAppLeadForm() {
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState("");

  useEffect(() => {
    // Persistent fingerprint for anonymous tracking
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
            type: "whatsapp_click", 
            silent: true,
            dna: "B2B_HUNTER" 
          },
          scope: "b2b", // Forced for this Pandoras landing context
          projectId: 1
        }),
      });
    } catch (e) {
      console.warn("[Growth OS] Silent track failed:", e);
    }
  };

  const handleStartChatBot = async () => {
    setLoading(true);

    try {
      // 1. Silent Lead Capture (Fire and forget, don't block UX)
      trackSilentLead();

      // 2. WhatsApp Redirection
      const whatsappUrl = getWhatsAppUrl('start');
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error iniciando chatbot WhatsApp:", error);
      alert("Error al abrir WhatsApp.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-zinc-400 text-sm mb-4">
        Comienza una conversación personalizada para evaluar tu proyecto y ver si eres elegible.
      </p>

      <button
        onClick={handleStartChatBot}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">🚀</span>
        {loading ? "Iniciando..." : "🤖 Comenzar Evaluación Personalizada"}
      </button>

      <p className="text-zinc-500 text-xs">
        Rápido y confidencial • Solo tomará unos minutos
      </p>
    </div>
  );
}
