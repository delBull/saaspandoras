"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  FileText,
  Users,
  TrendingUp,
  Shield,
  Target,
  Award,
  ArrowRight,
  BookOpen,
  Rocket,
  Sparkles,
  Crown,
  Heart,
  Coins,
  Building2,
  Palette,
  Cpu,
  Leaf
} from "lucide-react";
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";
import { Button } from "@saasfly/ui/button";
import { cn } from "@saasfly/ui";

export default function ApplyInfoPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const businessCategories = [
    {
      icon: <Building2 className="w-8 h-8" />,
      title: "Bienes Raíces Residencial",
      description: "Propiedades residenciales con flujo de renta estable",
      color: "from-blue-500 to-cyan-500",
      examples: ["Apartamentos", "Casas", "Condominios"]
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Startup Tecnológica",
      description: "Empresas de tecnología en etapas tempranas",
      color: "from-purple-500 to-pink-500",
      examples: ["SaaS", "Apps móviles", "Plataformas web"]
    },
    {
      icon: <Leaf className="w-8 h-8" />,
      title: "Energías Renovables",
      description: "Proyectos de energía limpia y sostenible",
      color: "from-green-500 to-emerald-500",
      examples: ["Solar", "Eólica", "Hidroeléctrica"]
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Arte y Coleccionables",
      description: "Obras de arte y activos coleccionables únicos",
      color: "from-orange-500 to-red-500",
      examples: ["NFTs", "Obras físicas", "Colecciones digitales"]
    },
    {
      icon: <Cpu className="w-8 h-8" />,
      title: "Propiedad Intelectual",
      description: "Patentes, marcas y derechos de autor",
      color: "from-indigo-500 to-purple-500",
      examples: ["Software", "Invenciones", "Contenido digital"]
    },
    {
      icon: <Coins className="w-8 h-8" />,
      title: "Bienes Raíces Comercial",
      description: "Propiedades comerciales e industriales",
      color: "from-teal-500 to-blue-500",
      examples: ["Oficinas", "Locales comerciales", "Bodegas"]
    }
  ];

  const processSteps = [
    {
      step: "1",
      title: "Aplicación Detallada",
      description: "Completa nuestro formulario exhaustivo con toda la información de tu proyecto",
      icon: <FileText className="w-6 h-6" />,
      details: "Incluye descripción del proyecto, modelo de negocio, proyecciones financieras, información del equipo y documentación legal."
    },
    {
      step: "2",
      title: "Análisis Técnico",
      description: "Evaluamos la viabilidad técnica, seguridad y escalabilidad de tu proyecto",
      icon: <Shield className="w-6 h-6" />,
      details: "Revisión de arquitectura técnica, seguridad de contratos inteligentes, análisis de riesgos y validación de supuestos."
    },
    {
      step: "3",
      title: "Due Diligence Legal",
      description: "Verificación completa de aspectos legales, cumplimiento regulatorio y estructura corporativa",
      icon: <Award className="w-6 h-6" />,
      details: "Análisis de documentos legales, verificación de propiedad intelectual, cumplimiento KYC/AML y estructura societaria."
    },
    {
      step: "4",
      title: "Entrevista Ejecutiva",
      description: "Conversación profunda con nuestro equipo para alinear visiones y expectativas",
      icon: <Users className="w-6 h-6" />,
      details: "Reunión con founders y equipo clave para entender la visión, estrategia y capacidad de ejecución del proyecto."
    },
    {
      step: "5",
      title: "Aprobación Final",
      description: "Decisión colegiada basada en análisis completo y alineación estratégica",
      icon: <Target className="w-6 h-6" />,
      details: "Evaluación final considerando mercado, competencia, diferenciación y potencial de crecimiento sostenible."
    },
    {
      step: "6",
      title: "Lanzamiento Premium",
      description: "Preparación y lanzamiento profesional en nuestra plataforma exclusiva",
      icon: <Rocket className="w-6 h-6" />,
      details: "Creación de materiales de marketing, configuración técnica, eventos de lanzamiento y soporte inicial."
    }
  ];

  const requirements = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Documentación Completa",
      description: "Whitepaper, pitch deck, modelo financiero y documentación legal preparada"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Equipo Experimentado",
      description: "Fundadores con experiencia relevante y track record comprobable"
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Modelo de Negocio Sólido",
      description: "Propuesta de valor clara, mercado definido y proyecciones realistas"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Cumplimiento Regulatorio",
      description: "Estructura legal adecuada y cumplimiento con regulaciones aplicables"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Visión a Largo Plazo",
      description: "Estrategia clara de crecimiento y desarrollo sostenible"
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Compromiso Total",
      description: "Dedicación exclusiva y disposición para trabajar en partnership"
    }
  ];

  const successMetrics = [
    { value: "< 5%", label: "Tasa de Aprobación", description: "Solo los mejores proyectos pasan nuestro filtro" },
    { value: "6-8 semanas", label: "Proceso Promedio", description: "Tiempo desde aplicación hasta lanzamiento" },
    { value: "$50M+", label: "Capital Movilizado", description: "A través de nuestra plataforma hasta la fecha" },
    { value: "50+", label: "Proyectos Exitosos", description: "Lanzados y operando exitosamente" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/10 border border-lime-500/20 rounded-full mb-6"
          >
            <Crown className="w-4 h-4 text-lime-400" />
            <span className="text-sm font-medium text-lime-400">Plataforma Elite</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-lime-200 to-white bg-clip-text text-transparent">
              Tokeniza tu
            </span>
            <br />
            <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
              Proyecto Excepcional
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed">
            Únete al ecosistema más exclusivo de inversión tokenizada.
            <span className="text-lime-400 font-semibold"> Solo el 5% de los aplicantes</span> son seleccionados para formar parte de nuestra plataforma premium.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-zinc-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-lime-400" />
              <span>Proceso riguroso de selección</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-lime-400" />
              <span>Soporte técnico completo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-lime-400" />
              <span>Comunidad exclusiva de inversores</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Success Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {successMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="text-center p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl backdrop-blur-sm"
            >
              <div className="text-3xl md:text-4xl font-bold text-lime-400 mb-2">{metric.value}</div>
              <div className="font-semibold text-white mb-1">{metric.label}</div>
              <div className="text-sm text-zinc-400">{metric.description}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Process Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nuestro Proceso de
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> Selección Elite</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Un proceso meticuloso diseñado para identificar proyectos excepcionales con verdadero potencial de transformación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className={cn(
                  "relative p-6 bg-gradient-to-br border rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105",
                  index === 0 ? "from-lime-500/10 to-emerald-500/10 border-lime-500/30" :
                  index === processSteps.length - 1 ? "from-purple-500/10 to-pink-500/10 border-purple-500/30" :
                  "from-zinc-900/50 to-zinc-800/50 border-zinc-700/50"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg",
                    index === 0 ? "bg-lime-500 text-black" :
                    index === processSteps.length - 1 ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" :
                    "bg-zinc-800 text-lime-400"
                  )}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">{step.title}</h3>
                  </div>
                  <div className="text-lime-400">
                    {step.icon}
                  </div>
                </div>
                <p className="text-zinc-300 mb-3">{step.description}</p>
                <p className="text-zinc-400 text-sm">{step.details}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Business Categories */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Categorías de
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> Proyectos</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Especializados en proyectos con activos reales y propuestas de valor excepcionales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessCategories.map((category, index) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6 + index * 0.1 }}
                className="group relative p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-lime-500/50 transition-all duration-300 hover:bg-zinc-800/30"
              >
                <div className={cn(
                  "inline-flex p-3 rounded-lg bg-gradient-to-r mb-4",
                  category.color
                )}>
                  <div className="text-white">
                    {category.icon}
                  </div>
                </div>
                <h3 className="font-bold text-xl text-white mb-2">{category.title}</h3>
                <p className="text-zinc-400 mb-4">{category.description}</p>
                <div className="flex flex-wrap gap-2">
                  {category.examples.map((example) => (
                    <span
                      key={example}
                      className="px-3 py-1 bg-zinc-800/50 border border-zinc-700 rounded-full text-xs text-zinc-300"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Requirements Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Requisitos para
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> Aplicar</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Asegúrate de cumplir con estos estándares antes de comenzar tu aplicación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requirements.map((req, index) => (
              <motion.div
                key={req.title}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2 + index * 0.1 }}
                className="flex items-start gap-4 p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-lime-500/30 transition-all duration-300"
              >
                <div className="flex-shrink-0 w-10 h-10 bg-lime-500/10 border border-lime-500/20 rounded-lg flex items-center justify-center text-lime-400">
                  {req.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white mb-2">{req.title}</h3>
                  <p className="text-zinc-400">{req.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/10 border border-lime-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium text-lime-400">¿Listo para comenzar?</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Da el primer paso hacia la
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> tokenización</span>
            </h2>

            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Nuestro formulario detallado está diseñado para conocer a fondo tu proyecto.
              Tómate el tiempo necesario para proporcionar información completa y precisa.
            </p>

            <div className="flex items-center justify-center space-x-2 mb-8">
              <input
                type="checkbox"
                id="understand-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-lime-500 focus:ring-lime-500 focus:ring-offset-zinc-900"
              />
              <label htmlFor="understand-checkbox" className="text-zinc-300">
                Entiendo el proceso de selección y estoy listo para presentar mi proyecto excepcional
              </label>
            </div>

            <Link href="/apply/form" passHref>
              <Button
                size="lg"
                disabled={!acceptedTerms}
                className={cn(
                  "bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold text-lg px-12 py-6 rounded-xl transition-all duration-300",
                  acceptedTerms
                    ? "hover:from-lime-400 hover:to-emerald-400 hover:scale-105 shadow-lg shadow-lime-500/25"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                Comenzar Aplicación
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>

            <p className="mt-6 text-sm text-zinc-500">
              Al continuar, serás dirigido a nuestro formulario seguro de aplicación.
              <span className="text-zinc-400"> Tiempo estimado: 45-60 minutos</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}