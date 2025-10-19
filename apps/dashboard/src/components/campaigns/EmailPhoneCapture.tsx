"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, CheckCircle } from "lucide-react";
import { Button } from "@saasfly/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

interface EmailPhoneCaptureProps {
  title?: string;
  description?: string;
  className?: string;
  onCapture?: (data: { email?: string; phone?: string }) => void;
}

export function EmailPhoneCapture({
  title = "Mantente al Tanto",
  description = "Recibe actualizaciones exclusivas sobre nuevos proyectos y oportunidades de inversión",
  className = "",
  onCapture
}: EmailPhoneCaptureProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [captureMethod, setCaptureMethod] = useState<"both" | "email" | "phone">("both");

  const handleSubscription = () => {
    if (email || phone) {
      setIsSubscribed(true);
      onCapture?.({ email: email || undefined, phone: phone || undefined });
    }
  };

  if (isSubscribed) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={`text-center p-6 ${className}`}
      >
        <GlassCard className="max-w-md mx-auto">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">¡Gracias por suscribirte!</h3>
          <p className="text-zinc-400 text-sm">
            Te mantendremos informado sobre las mejores oportunidades.
          </p>
        </GlassCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-center ${className}`}
    >
      <GlassCard className="max-w-lg mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
          <p className="text-zinc-400">{description}</p>
        </div>

        <div className="space-y-4">
          {/* Selector de método de captura */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setCaptureMethod("both")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                captureMethod === "both"
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Ambos
            </button>
            <button
              onClick={() => setCaptureMethod("email")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                captureMethod === "email"
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Solo Email
            </button>
            <button
              onClick={() => setCaptureMethod("phone")}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                captureMethod === "phone"
                  ? "bg-blue-500 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Solo SMS
            </button>
          </div>

          {/* Formulario de Email */}
          {(captureMethod === "both" || captureMethod === "email") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <Button
                  onClick={handleSubscription}
                  disabled={!email}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white px-4 disabled:opacity-50"
                >
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Formulario de Teléfono */}
          {(captureMethod === "both" || captureMethod === "phone") && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="text-center text-zinc-500 text-sm mb-2">
                {captureMethod === "both" ? "O recibe notificaciones por SMS" : "Recibe notificaciones por SMS"}
              </div>

              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="+52 55 1234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-green-500 focus:outline-none transition-colors"
                />
                <Button
                  onClick={handleSubscription}
                  disabled={!phone}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-400 hover:to-blue-400 text-white px-4 disabled:opacity-50"
                >
                  <Phone className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Información de privacidad */}
          <p className="text-xs text-zinc-500 mt-4">
            No compartimos tu información. Solo te enviaremos contenido relevante sobre oportunidades de inversión.
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}