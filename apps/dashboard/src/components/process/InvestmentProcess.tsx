"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Search,
  Wallet,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Users,
  Star
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@saasfly/ui/button";

interface ProcessStep {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  duration: string;
  color: string;
}

export function InvestmentProcess() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const processSteps: ProcessStep[] = [
    {
      step: 1,
      title: "Descubre Oportunidades",
      description: "Explora proyectos verificados y selecciona según tus objetivos",
      icon: <Search className="w-6 h-6" />,
      details: [
        "Filtra por tipo de activo",
        "Revisa documentación completa",
        "Analiza proyecciones financieras",
        "Consulta opiniones de expertos"
      ],
      duration: "5-10 min",
      color: "from-blue-500 to-cyan-500"
    },
    {
      step: 2,
      title: "Conecta tu Wallet",
      description: "Vincula tu billetera digital de forma segura",
      icon: <Wallet className="w-6 h-6" />,
      details: [
        "Soporte multi-wallet",
        "Verificación de identidad",
        "Configuración de seguridad",
        "Tutoriales paso a paso"
      ],
      duration: "2-3 min",
      color: "from-green-500 to-emerald-500"
    },
    {
      step: 3,
      title: "Invierte con Confianza",
      description: "Realiza tu inversión con total transparencia",
      icon: <TrendingUp className="w-6 h-6" />,
      details: [
        "Precios en tiempo real",
        "Confirmación inmediata",
        "Registro en blockchain",
        "Recibo digital automático"
      ],
      duration: "1-2 min",
      color: "from-purple-500 to-pink-500"
    },
    {
      step: 4,
      title: "Recibe Rendimientos",
      description: "Disfruta de ingresos pasivos de forma automática",
      icon: <PiggyBank className="w-6 h-6" />,
      details: [
        "Distribuciones automáticas",
        "Reportes mensuales",
        "Reinversión opcional",
        "Historial completo"
      ],
      duration: "Automático",
      color: "from-orange-500 to-red-500"
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
          Tu Camino hacia la
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {" "}Inversión Inteligente
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Proceso simple, seguro y transparente desde el descubrimiento hasta los rendimientos
        </motion.p>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Línea de conexión */}
        <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 opacity-30" />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ delay: 0.6 + index * 0.2, duration: 0.6 }}
              className="relative"
            >
              {/* Step Circle */}
              <div className="relative mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    delay: 0.8 + index * 0.2,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`w-16 h-16 mx-auto bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center text-white font-bold text-lg relative`}
                >
                  {step.icon}
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5
                    }}
                    className="absolute inset-0 rounded-full bg-current opacity-20"
                  />
                </motion.div>

                {/* Step number badge */}
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 border-2 border-zinc-700 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-zinc-300">{step.step}</span>
                </div>
              </div>

              {/* Content */}
              <div
                className={`text-center cursor-pointer transition-all duration-300 ${
                  activeStep === step.step ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setActiveStep(activeStep === step.step ? null : step.step)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveStep(activeStep === step.step ? null : step.step);
                  }
                }}
                tabIndex={0}
                role="button"
              >
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm mb-4">{step.description}</p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs text-zinc-500">{step.duration}</span>
                </div>

                {/* Expandable details */}
                <motion.div
                  initial={false}
                  animate={{
                    height: activeStep === step.step ? "auto" : 0,
                    opacity: activeStep === step.step ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 border-t border-zinc-700">
                    {step.details.map((detail, detailIndex) => (
                      <motion.div
                        key={detailIndex}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{
                          opacity: activeStep === step.step ? 1 : 0,
                          x: activeStep === step.step ? 0 : -10
                        }}
                        transition={{ delay: detailIndex * 0.1 }}
                        className="flex items-center gap-2 text-xs text-zinc-400 mb-2"
                      >
                        <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                        {detail}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Características del proceso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1.5 }}
        className="mt-16"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">100% Seguro</h4>
            <p className="text-sm text-zinc-400">
              Tecnología blockchain y auditorías constantes
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">Soporte Personal</h4>
            <p className="text-sm text-zinc-400">
              Equipo de expertos acompañándote en cada paso
            </p>
          </GlassCard>

          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-white mb-2">Resultados Comprobables</h4>
            <p className="text-sm text-zinc-400">
              Transparencia total en rendimientos y operaciones
            </p>
          </GlassCard>
        </div>
      </motion.div>

      {/* CTA Final */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 2 }}
        className="text-center mt-12"
      >
        <GlassCard className="max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-4">
            ¿Listo para comenzar tu viaje inversor?
          </h3>
          <p className="text-zinc-400 mb-6">
            Únete a miles de inversores que ya están generando rendimientos con activos reales tokenizados.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white">
              Comenzar Ahora
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Ver Demo Interactiva
            </Button>
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            ✓ Sin costos ocultos • ✓ Proceso 100% digital • ✓ Soporte personalizado
          </p>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}