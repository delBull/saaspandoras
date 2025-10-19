"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

interface Testimonial {
  name: string;
  role: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
  metrics?: {
    label: string;
    value: string;
  };
}

export function ModernTestimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const testimonials: Testimonial[] = [
    {
      name: "María González",
      role: "Inversora Privada",
      content: "Pandora's Finance me abrió las puertas a inversiones que nunca imaginé posibles. Ahora tengo una fracción de un edificio corporativo que genera ingresos mensuales estables.",
      rating: 5,
      metrics: {
        label: "Retorno anual",
        value: "8.5%"
      }
    },
    {
      name: "Carlos Mendoza",
      role: "Emprendedor Tech",
      company: "Startup Founder",
      content: "La transparencia es absoluta. Puedo ver exactamente cómo se mueve cada peso de mi inversión. Es como tener rayos X en el mundo financiero.",
      rating: 5,
      metrics: {
        label: "Proyectos activos",
        value: "3"
      }
    },
    {
      name: "Ana Patricia Ruiz",
      role: "Consultora Financiera",
      content: "Finalmente una plataforma que entiende que la tecnología debe servir a las personas, no al revés. El proceso es intuitivo y los resultados hablan por sí solos.",
      rating: 5,
      metrics: {
        label: "Clientes referidos",
        value: "12"
      }
    },
    {
      name: "Roberto Silva",
      role: "Inversor Institucional",
      content: "Hemos movido parte de nuestro portafolio institucional a Pandora's. La combinación de activos reales con tecnología blockchain es el futuro inevitable.",
      rating: 5,
      metrics: {
        label: "Capital invertido",
        value: "$2.5M"
      }
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
          Historias
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            {" "}Reales
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-zinc-400 max-w-3xl mx-auto"
        >
          Descubre cómo nuestra comunidad está transformando su futuro financiero
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.name}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6 + index * 0.1, duration: 0.6 }}
          >
            <GlassCard className="h-full">
              {/* Quote icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={isInView ? { scale: 1 } : { scale: 0 }}
                transition={{
                  delay: 0.8 + index * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white mb-4"
              >
                <Quote className="w-6 h-6" />
              </motion.div>

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="flex items-center gap-1 mb-4"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < testimonial.rating
                        ? "text-yellow-400 fill-current"
                        : "text-zinc-600"
                    }`}
                  />
                ))}
              </motion.div>

              {/* Content */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className="text-zinc-300 mb-6 leading-relaxed"
              >
                &ldquo;{testimonial.content}&rdquo;
              </motion.p>

              {/* Author info */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: 1.4 + index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white">{testimonial.name}</div>
                  <div className="text-sm text-zinc-400">
                    {testimonial.role}
                    {testimonial.company && ` • ${testimonial.company}`}
                  </div>
                </div>

                {testimonial.metrics && (
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">{testimonial.metrics.label}</div>
                    <div className="font-bold text-green-400">{testimonial.metrics.value}</div>
                  </div>
                )}
              </motion.div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      {/* Call to action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 1.5 }}
        className="text-center mt-12"
      >
        <GlassCard className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-3">
            ¿Quieres ser la próxima historia de éxito?
          </h3>
          <p className="text-zinc-400 mb-6">
            Únete a miles de inversores que ya están construyendo su futuro con Pandora&apos;s Finance.
          </p>

          <div className="flex justify-center items-center gap-4 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>
              <span>4.9/5 de satisfacción</span>
            </div>
            <div className="w-1 h-1 bg-zinc-600 rounded-full" />
            <div className="flex items-center gap-1">
              <span>10,000+ usuarios activos</span>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}