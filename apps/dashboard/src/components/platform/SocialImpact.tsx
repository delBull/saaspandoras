"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Heart, Leaf, GraduationCap, Building2, HandHeart, Globe } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface SocialImpactItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  metrics: string;
  color: string;
  impact: string[];
}

export function SocialImpact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const impactAreas: SocialImpactItem[] = [
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Inclusión Financiera",
      description: "Democratizando el acceso a inversiones premium que antes eran exclusivas",
      metrics: "10,000+ usuarios",
      color: "from-red-500 to-pink-500",
      impact: [
        "Inversores primerizos acceden a activos premium",
        "Diversificación geográfica sin fronteras",
        "Educación financiera integrada",
        "Comunidades sub-bancarizadas incluidas"
      ]
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Impacto Ambiental",
      description: "Facilitando inversiones en proyectos sostenibles y energías renovables",
      metrics: "150+ proyectos verdes",
      color: "from-green-500 to-emerald-500",
      impact: [
        "Tokenización de parques solares",
        "Financiamiento de energías limpias",
        "Proyectos de reforestación",
        "Tecnologías carbono-neutral"
      ]
    },
    {
      icon: <GraduationCap className="w-8 h-8" />,
      title: "Educación Financiera",
      description: "Construyendo una comunidad de inversores educados y conscientes",
      metrics: "50+ recursos educativos",
      color: "from-blue-500 to-cyan-500",
      impact: [
        "Cursos gratuitos de inversión",
        "Simuladores interactivos",
        "Webinars con expertos",
        "Comunidad de aprendizaje"
      ]
    },
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Desarrollo Urbano",
      description: "Financiando proyectos inmobiliarios que transforman comunidades",
      metrics: "$30M+ en propiedades",
      color: "from-purple-500 to-indigo-500",
      impact: [
        "Viviendas accesibles tokenizadas",
        "Espacios comerciales comunitarios",
        "Proyectos de regeneración urbana",
        "Desarrollo sostenible de ciudades"
      ]
    },
    {
      icon: <HandHeart className="w-8 h-8" />,
      title: "Apoyo Comunitario",
      description: "Retribución directa a las comunidades donde operan nuestros proyectos",
      metrics: "5% a causas locales",
      color: "from-orange-500 to-yellow-500",
      impact: [
        "Porcentaje de ganancias a comunidades",
        "Proyectos de impacto social",
        "Apoyo a emprendedores locales",
        "Desarrollo de infraestructura"
      ]
    },
    {
      icon: <Globe className="w-8 h-8" />,
      title: "Transparencia Global",
      description: "Estándares de transparencia que inspiran a toda la industria financiera",
      metrics: "Blockchain público",
      color: "from-teal-500 to-blue-500",
      impact: [
        "Auditorías públicas en tiempo real",
        "Reportes de impacto verificables",
        "Estándares abiertos para la industria",
        "Colaboración con reguladores"
      ]
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
          Impacto
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            {" "}Social y Ambiental
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Más allá de las ganancias financieras, estamos construyendo un futuro más inclusivo, sostenible y transparente
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {impactAreas.map((area, index) => (
          <motion.div
            key={area.title}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
          >
            <GlassCard className="h-full">
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{
                    delay: 0.8 + index * 0.1,
                    type: "spring",
                    stiffness: 200
                  }}
                  className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${area.color} rounded-full flex items-center justify-center text-white`}
                >
                  {area.icon}
                </motion.div>

                <h3 className="text-xl font-bold text-white mb-2">{area.title}</h3>
                <p className="text-zinc-400 text-sm mb-3">{area.description}</p>
                <div className={`text-lg font-bold bg-gradient-to-r ${area.color} bg-clip-text text-transparent`}>
                  {area.metrics}
                </div>
              </div>

              <div className="space-y-2">
                {area.impact.map((item, itemIndex) => (
                  <motion.div
                    key={itemIndex}
                    initial={{ opacity: 0, x: -10 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                    transition={{ delay: 1 + index * 0.1 + itemIndex * 0.05 }}
                    className="flex items-center gap-2 text-sm text-zinc-400"
                  >
                    <div className={`w-1.5 h-1.5 bg-gradient-to-r ${area.color} rounded-full flex-shrink-0`} />
                    {item}
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Llamado a la acción social */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1.5 }}
        className="text-center mt-12"
      >
        <GlassCard className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Únete al Movimiento
            </h3>
            <p className="text-zinc-400 mb-4">
              Cada inversión que haces con nosotros contribuye a crear un impacto positivo en el mundo.
              Juntos estamos construyendo un futuro financiero más inclusivo y sostenible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400 mb-1">5%</div>
              <div className="text-sm text-zinc-400">De ganancias a comunidades</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-400 mb-1">100%</div>
              <div className="text-sm text-zinc-400">Transparencia garantizada</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400 mb-1">∞</div>
              <div className="text-sm text-zinc-400">Posibilidades de impacto</div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}