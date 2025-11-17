"use client";

import { useState } from "react";

export default function WhatsAppLeadForm() {
  const [loading, setLoading] = useState(false);

  const handleStartChatBot = () => {
    setLoading(true);

    try {
      // URL directa a WhatsApp con mensaje pre-llenado que disparará el bot
      const message = encodeURIComponent("Hola! Soy creador y quiero hacer mi protocolo de utilidad en Pandora's");
      const businessPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE;

      if (!businessPhoneNumber) {
        console.error('❌ Número de WhatsApp Business no configurado');
        alert('Error: Número de WhatsApp no configurado. Contacta soporte.');
        setLoading(false);
        return;
      }

      const whatsappUrl = `https://wa.me/${businessPhoneNumber}?text=${message}`;

      console.log("🔗 WhatsApp URL:", whatsappUrl);

      // Redirigir directamente a WhatsApp
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error iniciando chatbot WhatsApp:", error);
      alert("Error al abrir WhatsApp. Verifica tu conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-zinc-400 text-sm mb-4">
        ¡Nuestro bot conversacional te guiará paso a paso para crear tu protocolo!
      </p>

      <button
        onClick={handleStartChatBot}
        disabled={loading}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">🤖</span>
        {loading ? "Iniciando..." : "🚀 Iniciar Chat Bot Conversacional"}
      </button>

      <p className="text-zinc-500 text-xs">
        Te llevará directamente al chat donde comienza la automatización
      </p>
    </div>
  );
}
