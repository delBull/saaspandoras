"use client";

import { useState } from "react";

export default function WhatsAppLeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Llamada a tu backend
      const res = await fetch("/api/leads/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });

      const data = await res.json();

      if (data?.whatsappUrl) {
        window.location.href = data.whatsappUrl;
      } else {
        alert(data?.error || "Hubo un error registrando el lead.");
      }
    } catch (error) {
      console.error("WhatsApp form error:", error);
      alert("Error de conexión. Verifica tu conexión a internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Tu nombre"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
          className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none md:order-1"
        />
        <input
          type="tel"
          placeholder="Tu WhatsApp (10 dígitos)"
          value={phone}
          required
          onChange={(e) => setPhone(e.target.value)}
          className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none md:order-2"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !name || !phone}
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {loading ? "Procesando..." : "📱 Recibir instrucciones por WhatsApp"}
      </button>
    </div>
  );
}
