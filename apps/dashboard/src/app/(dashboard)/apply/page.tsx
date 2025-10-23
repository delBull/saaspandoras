"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useProjectModal } from "@/contexts/ProjectModalContext";
import {
  CheckCircle,
  Users,
  Shield,
  Target,
  Award,
  ArrowRight,
  BookOpen,
  Rocket,
  Sparkles,
  Crown,
  Heart,
  // --- Iconos de Utilidad Añadidos ---
  Puzzle,       // Para 'Work-to-Earn'
  MousePointerClick, // Para 'No-Code'
  Gift,         // Para 'Lealtad'
  Palette,      // Para 'Arte' (se mantiene)
  Ticket,       // Para 'Acceso'
  Code,         // Para 'Herramientas'
  Layers         // Para 'Módulos'
} from "lucide-react";
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ApplyInfoPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { open } = useProjectModal();

  // --- TRANSFORMACIÓN #1: DE "CLASES DE ACTIVOS" A "CASOS DE USO" ---
  // Se eliminan "Bienes Raíces", "Startup", "Energías" (Securities)
  // Se reemplazan por "Membresías", "Work-to-Earn", "Arte" (Utilidad)
  const useCases = [
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "Membresías y Acceso",
      description: "Crea NFTs que funcionan como llaves de acceso a comunidades",
      color: "from-blue-500 to-cyan-500",
      examples: ["Acceso a Discord", "Listas 'Allowlist'", "Contenido Exclusivo"]
    },
    {
      icon: <Puzzle className="w-8 h-8" />,
      title: "Protocolos 'Work-to-Earn'",
      description: "Incentiva a tu comunidad por completar tareas y aportar valor",
      color: "from-purple-500 to-pink-500",
      examples: ["Validación de Tareas", "Moderación", "Aportes de Datos"]
    },
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Sistemas de Lealtad",
      description: "Lanza tokens de utilidad para recompensar a tus usuarios más fieles",
      color: "from-green-500 to-emerald-500",
      examples: ["Puntos de Recompensa", "Gamificación", "Votaciones"]
    },
    {
      icon: <Palette className="w-8 h-8" />,
      title: "Arte y Coleccionables",
      description: "Lanza colecciones de arte digital y PFP para tu comunidad",
      color: "from-orange-500 to-red-500",
      examples: ["NFTs 1-de-1", "Ediciones Abiertas", "PFP Coleccionables"]
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Credenciales y Certificados",
      description: "Emite tokens (SBTs) intransferibles como prueba de logros",
      color: "from-indigo-500 to-purple-500",
      examples: ["Diplomas", "Certificados de Asistencia", "Logros"]
    },
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Módulos Personalizados",
      description: "¿Tienes una idea única? Construye tu propio protocolo",
      color: "from-teal-500 to-blue-500",
      examples: ["Tu Idea Aquí", "Modelo Híbrido", "Consulta con nosotros"]
    }
  ];

  // --- TRANSFORMACIÓN #2: DE PROCESO DE "SELECCIÓN" A "CONSTRUCCIÓN" ---
  // Se elimina el lenguaje de "Due Diligence" y "Aprobación" (Gatekeeping)
  // Se reemplaza por un flujo de "Configuración" y "Lanzamiento" (SaaS Onboarding)
  const launchProcess = [
    {
      step: "1",
      title: "Elige tu Plantilla",
      description: "Comienza con una de nuestras plantillas de protocolo pre-auditadas",
      icon: <BookOpen className="w-6 h-6" />,
      details: "Elige entre Lealtad, Work-to-Earn, Membresías NFT y más. Ahorra meses de desarrollo y costos de auditoría."
    },
    {
      step: "2",
      title: "Configura tu Protocolo",
      description: "Usa nuestro dashboard 'No-Code' para definir tus reglas y recompensas",
      icon: <MousePointerClick className="w-6 h-6" />,
      details: "Define las tareas, los montos de recompensa, los beneficios del NFT y los parámetros de tu comunidad. Sin programar."
    },
    {
      step: "3",
      title: "Prueba en Testnet",
      description: "Verifica tu flujo completo en un entorno seguro antes de lanzar",
      icon: <Shield className="w-6 h-6" />,
      details: "Simula la experiencia de tu comunidad, prueba las recompensas y asegúrate de que todo funcione como esperas."
    },
    {
      step: "4. ",
      title: "Diseña tu Comunidad",
      description: "Conecta tus redes sociales y prepara a tus miembros para el lanzamiento",
      icon: <Users className="w-6 h-6" />,
      details: "Prepara tu Discord, Telegram y Twitter. Te damos las herramientas para construir la expectación."
    },
    {
      step: "5",
      title: "Despliega Contratos",
      description: "Lanza tus contratos en la blockchain con un solo clic. Son 100% tuyos.",
      icon: <Code className="w-6 h-6" />,
      details: "Despliega en Ethereum, Polygon, Arbitrum y más. Tú mantienes la propiedad total de los contratos inteligentes."
    },
    {
      step: "6",
      title: "Lanza y Gestiona",
      description: "Activa tu protocolo y gestiona tu comunidad desde un solo dashboard",
      icon: <Rocket className="w-6 h-6" />,
      details: "Monitorea la participación, distribuye recompensas y haz crecer tu ecosistema con nuestras herramientas de analítica."
    }
  ];

  // --- TRANSFORMACIÓN #3: DE "REQUISITOS" A "BUENAS PRÁCTICAS" ---
  // Se elimina el lenguaje de "Cumplimiento Regulatorio" (que asumimos nosotros)
  // Se enfoca en lo que hace a un *proyecto de comunidad* exitoso
  const bestPractices = [
    {
      icon: <Target className="w-5 h-5" />,
      title: "Utilidad Clara",
      description: "Tu token o NFT debe tener un propósito claro y accionable para tu comunidad"
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Comunidad Establecida",
      description: "Es más fácil activar una comunidad existente que construir una desde cero"
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: "Documentación Transparente",
      description: "Un 'Litepaper' que explique cómo funciona tu protocolo y los beneficios para los miembros"
    },
    {
      icon: <Heart className="w-5 h-5" />,
      title: "Equipo Comprometido",
      description: "Un equipo activo y listo para gestionar, moderar y hacer crecer la comunidad"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Enfoque en la Legalidad",
      description: "Un modelo diseñado para la 'utilidad' y 'participación', evitando ser un 'security'"
    },
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: "Visión a Largo Plazo",
      description: "Estrategia clara para aportar valor sostenible a tus miembros"
    }
  ];

  // --- TRANSFORMACIÓN #4: MÉTRICAS DE "CAPITAL" A MÉTRICAS "SAAS/UTILIDAD" ---
  // Se elimina "$50M+ Capital Movilizado" (SECURITY FLAG 🚩)
  // Se elimina "< 5% Tasa de Aprobación" (Somos una plataforma abierta, no un club)
  const platformMetrics = [
    { value: "< 1 día", label: "Tiempo de Lanzamiento", description: "Lanza tu protocolo de utilidad en horas, no meses" },
    { value: "100+", label: "Protocolos Lanzados", description: "Comunidades usando nuestra tecnología" },
    { value: "500k+", label: "Miembros Activos", description: "Usuarios interactuando con protocolos en Pandora" },
    { value: "100%", label: "Propiedad del Creador", description: "Tus contratos, tus reglas, tu comunidad" }
  ];

  return (
    <div className="absolute inset-x-0 min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
      <AnimatedBackground />

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* --- TRANSFORMACIÓN #5: HERO SECTION --- */}
        {/* De "Tokeniza tu Proyecto" (Financiero) a "Construye tu Protocolo" (SaaS) */}
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
            <span className="text-sm font-medium text-lime-400">Plataforma No-Code</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-lime-200 to-white bg-clip-text text-transparent">
              Construye tu
            </span>
            <br />
            <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
              Protocolo de Utilidad
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-zinc-400 max-w-4xl mx-auto mb-8 leading-relaxed">
            Lanza sistemas de &apos;Work-to-Earn&apos;, membresías NFT y programas de lealtad.
            <span className="text-lime-400 font-semibold"> Todo en una plataforma &apos;No-Code&apos;</span> diseñada para creadores y comunidades.
          </p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-4 text-sm text-zinc-500"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-lime-400" />
              <span>Plantillas de Contratos Auditados</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-lime-400" />
              <span>Dashboard de Gestión No-Code</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-lime-400" />
              <span>Propiedad 100% de tus Contratos</span>
            </div>
          </motion.div>
        </motion.div>

        {/* --- Métricas de Plataforma (Transformadas) --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {platformMetrics.map((metric, index) => (
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

        {/* --- Proceso de Lanzamiento (Transformado) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nuestro Proceso de
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> Lanzamiento Acelerado</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Un flujo de trabajo optimizado para que puedas lanzar tu protocolo de utilidad en días, no meses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {launchProcess.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1 }}
                className={cn(
                  "relative p-6 bg-gradient-to-br border rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105",
                  index === 0 ? "from-lime-500/10 to-emerald-500/10 border-lime-500/30" :
                  index === launchProcess.length - 1 ? "from-purple-500/10 to-pink-500/10 border-purple-500/30" :
                  "from-zinc-900/50 to-zinc-800/50 border-zinc-700/50"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg",
                    index === 0 ? "bg-lime-500 text-black" :
                    index === launchProcess.length - 1 ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" :
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

        {/* --- Casos de Uso (Transformados) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Plantillas de
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> Protocolos</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Comienza con nuestros módulos pre-construidos para los casos de uso más comunes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((category, index) => (
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

        {/* --- Buenas Prácticas (Transformado) --- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="mb-20"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Checklist para un
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> Protocolo Exitoso</span>
            </h2>
            <p className="text-zinc-400 text-lg">
              Recomendamos estas buenas prácticas para construir una comunidad fuerte y sostenible.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bestPractices.map((req, index) => (
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

        {/* --- TRANSFORMACIÓN #6: FINAL CTA --- */}
        {/* De "Aplicar para ser seleccionado" a "Empezar a construir tu proyecto" */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 border border-zinc-700 rounded-2xl p-8 md:p-12 backdrop-blur-sm">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/10 border border-lime-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium text-lime-400">¿Listo para construir?</span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Da el primer paso para
              <span className="bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent"> activar tu comunidad</span>
            </h2>

            <p className="text-zinc-400 text-lg mb-8 max-w-2xl mx-auto">
              Nuestro dashboard te guiará paso a paso en la configuración de tu protocolo.
              Empieza gratis y lanza cuando estés listo.
            </p>

            {/* Este Checkbox ahora es tu escudo legal */}
            <div className="flex items-center justify-center space-x-2 mb-8">
              <input
                type="checkbox"
                id="understand-checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-lime-500 focus:ring-lime-500 focus:ring-offset-zinc-900"
              />
              <label htmlFor="understand-checkbox" className="text-zinc-300">
                Entiendo que Pandora es una plataforma de software (SaaS) y que soy responsable de mi proyecto.
              </label>
            </div>

            {/* El botón ahora abre el modal del formulario global */}
            <Button
              size="lg"
              disabled={!acceptedTerms}
              onClick={open}
              className={cn(
                "bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold text-base md:text-lg px-8 md:px-12 py-4 md:py-6 rounded-xl transition-all duration-300 w-full sm:w-auto",
                acceptedTerms
                  ? "hover:from-lime-400 hover:to-emerald-400 hover:scale-105 shadow-lg shadow-lime-500/25"
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="flex items-center gap-2">
                Empezar a Construir
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
              </span>
            </Button>

            <p className="mt-6 text-sm text-zinc-500">
              Al continuar, se abrirá el formulario para comenzar a configurar tu protocolo.
              <span className="text-zinc-400"> Tiempo estimado: 15 minutos</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
