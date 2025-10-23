"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  Zap,
  Globe,
  Users,
  TrendingUp,
  Lock,
  Eye,
  Smartphone,
  Clock,
  CheckCircle
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefits: string[];
  color: string;
  badge?: string;
}

export function PlatformFeatures() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features: Feature[] = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Seguridad Blockchain",
      description: "Cada transacción es inmutable y verificable públicamente",
      benefits: [
        "Contratos inteligentes auditados",
        "Encriptación de extremo a extremo",
        "Backups distribuidos",
        "Cumplimiento regulatorio total"
      ],
      color: "from-green-500 to-emerald-500",
      badge: "Más Seguro"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Liquidez Instantánea",
      description: "Compra y vende tus tokens en cualquier momento",
      benefits: [
        "Mercados 24/7 disponibles",
        "Ejecución inmediata de órdenes",
        "Sin períodos de bloqueo",
        "Precios transparentes siempre"
      ],
      color: "from-yellow-500 to-orange-500",
      badge: "Más Rápido"
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Acceso Global",
      description: "Invierte en activos de todo el mundo sin fronteras",
      benefits: [
        "Diversificación internacional",
        "Sin restricciones geográficas",
        "Múltiples monedas soportadas",
        "Cumplimiento local automático"
      ],
      color: "from-blue-500 to-cyan-500",
      badge: "Más Accesible"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Comunidad Activa",
      description: "Forma parte de una comunidad de inversores inteligentes",
      benefits: [
        "Foros de discusión exclusivos",
        "Eventos y webinars regulares",
        "Networking con profesionales",
        "Soporte comunitario 24/7"
      ],
      color: "from-purple-500 to-pink-500",
      badge: "Más Conectado"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Analytics Avanzados",
      description: "Seguimiento detallado de tu portafolio en tiempo real",
      benefits: [
        "Reportes personalizados",
        "Alertas de rendimiento",
        "Análisis predictivo",
        "Comparativas de mercado"
      ],
      color: "from-indigo-500 to-purple-500",
      badge: "Más Inteligente"
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "Privacidad Protegida",
      description: "Tú controlas tus datos y tu información financiera",
      benefits: [
        "Anonimato opcional",
        "Control granular de privacidad",
        "Encriptación de datos personales",
        "Cumplimiento GDPR y CCPA"
      ],
      color: "from-gray-500 to-zinc-500",
      badge: "Más Privado"
    }
  ];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="mb-20"
    >
      <div className="text-center mb-12">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl font-bold mb-6"
        >
          Características
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {" "}Premium
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Tecnología de vanguardia combinada con experiencia de usuario excepcional
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
          >
            <GlassCard className="h-full hover:scale-105 transition-all duration-300">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center text-white`}
                >
                  {feature.icon}
                </motion.div>

                {feature.badge && (
                  <div className={`px-3 py-1 bg-gradient-to-r ${feature.color} rounded-full`}>
                    <span className="text-white text-xs font-medium">{feature.badge}</span>
                  </div>
                )}
              </div>

              <motion.h3
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="text-xl font-bold text-white mb-3"
              >
                {feature.title}
              </motion.h3>

              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="text-zinc-400 mb-6"
              >
                {feature.description}
              </motion.p>

              {/* Benefits */}
              <div className="space-y-3">
                {feature.benefits.map((benefit, benefitIndex) => (
                  <motion.div
                    key={benefitIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ delay: 1.4 + index * 0.1 + benefitIndex * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Características adicionales destacadas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1.5 }}
        className="mt-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">Transparencia Total</h4>
            <p className="text-sm text-zinc-400">
              Cada transacción es pública y verificable en la blockchain
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">App Móvil Nativa</h4>
            <p className="text-sm text-zinc-400">
              Gestiona tus inversiones desde cualquier dispositivo
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">Soporte 24/7</h4>
            <p className="text-sm text-zinc-400">
              Equipo de expertos disponible en todo momento
            </p>
          </GlassCard>
        </div>
      </motion.div>
    </motion.div>
  );
}