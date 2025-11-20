"use client";

import { useState } from "react";

export default function WhatsAppFoundersForm() {
  const [loading, setLoading] = useState(false);

  const handleStartFoundersFlow = () => {
    setLoading(true);

    try {
      // Mensaje que activa el high-ticket flow para founders
      const message = encodeURIComponent("Hola, soy founder y quiero aplicar al programa Founders de Pandora's. Tengo capital disponible.");
      const businessPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE;

      if (!businessPhoneNumber) {
        console.error('❌ Número de WhatsApp Business no configurado');
        alert('Error: Número de WhatsApp no configurado. Contacta soporte.');
        setLoading(false);
        return;
      }

      const whatsappUrl = `https://wa.me/${businessPhoneNumber}?text=${message}`;

      console.log("🔗 WhatsApp Founders URL:", whatsappUrl);

      // Redirigir directamente a WhatsApp
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error("Error iniciando flujo founders WhatsApp:", error);
      alert("Error al abrir WhatsApp. Verifica tu conexión.");
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
