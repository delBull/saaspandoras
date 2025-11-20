"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  ArrowRight,
  Phone,
  Mail,
  Zap, // Nuevo ícono para Protocolo Rápido
  Users,
  CheckCircle,
  FileText,
  Lightbulb, // Nuevo ícono para Utilidad
  RefreshCw,
  MessageSquare, // Para el formulario de 8 preguntas
} from "lucide-react";

// Componentes de Referencia (Simulados, debes adaptarlos o importarlos)
const ModernBackground = ({ children }: { children?: React.ReactNode }) => (
    <div className="absolute inset-0 z-0 overflow-hidden bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Simulación del fondo abstracto/moderno */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 100% 100%, #4F46E5, transparent), radial-gradient(circle at 0% 0%, #06B6D4, transparent)',
        }}></div>
        {children}
    </div>
);
const GlassCard = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={"bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 transition-all hover:border-blue-400/50 " + className}>
        {children}
    </div>
);
const Button = ({ children, size = 'lg', variant = 'primary', className = '', onClick, type = 'button', disabled = false }: any) => {
    let baseStyle = "font-bold rounded-full transition-all duration-300 shadow-lg ";
    const sizeStyle = size === 'lg' ? "px-8 py-3 text-lg" : "px-6 py-2 text-md";

    if (variant === 'primary' || className.includes('bg-gradient')) {
        baseStyle += "text-white " + className;
    } else if (variant === 'ghost') {
        baseStyle += "text-white border border-zinc-700 hover:bg-zinc-800 " + className;
    } else if (variant === 'outline') {
        baseStyle += "text-white border border-blue-500 hover:bg-blue-500/20 " + className;
    } else {
        baseStyle += className;
    }

    return (
        <button type={type} className={`${baseStyle} ${sizeStyle} disabled:opacity-50`} onClick={onClick} disabled={disabled}>
            {children}
        </button>
    );
};
const TypewriterText = ({ text, delay, speed, className }: any) => (
    <p className={className}>{text}</p>
);
const StaggerText = ({ text, className, delay, as = 'span' }: any) => {
    const Component = as === 'h1' ? 'h1' : 'span';
    return <Component className={className}>{text}</Component>;
};
const QuestionIcon = () => (
    <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none">
        <path d="M12 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9.09 9a3 3 0 115.82 0c0 2.2-3 2.8-3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Componentes importados para el sistema completo
import WhatsAppLeadForm from "@/components/WhatsAppLeadForm";
import { cn } from "@/lib/utils";

// Componente específico para Utility Protocol
function WhatsAppUtilityLeadForm() {
  const [loading, setLoading] = useState(false);

  const handleStartChatBot = () => {
    setLoading(true);

    try {
      // URL directa a WhatsApp con mensaje que activa el flujo utility
      const message = encodeURIComponent("Estoy interesado en crear un utility protocol funcional");
      const businessPhoneNumber = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_PHONE;

      if (!businessPhoneNumber) {
        console.error('❌ Número de WhatsApp Business no configurado');
        alert('Error: Número de WhatsApp no configurado. Contacta soporte.');
        setLoading(false);
        return;
      }

      const whatsappUrl = `https://wa.me/${businessPhoneNumber}?text=${message}`;

      console.log("🔗 WhatsApp Utility URL:", whatsappUrl);

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
        Conecta con nuestro equipo de arquitectura para diseñar tu Protocolo de Utilidad Work-to-Earn (W2E).
      </p>

      <button
        onClick={handleStartChatBot}
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
      >
        <span className="text-2xl">🔧</span>
        {loading ? "Iniciando..." : "🏗️ Consultoría Arquitectura W2E"}
      </button>

      <p className="text-zinc-500 text-xs">
        Especializado en Loom Protocol • Análisis técnico • Dual-Treasury design
      </p>
    </div>
  );
}


// --- CONFIGURACIÓN Y CONSTANTES ---
const EMAIL_LINK = `mailto:arquitectura@pandoras.finance?subject=${encodeURIComponent(
  "Consulta: Aplicación de Protocolo de Utilidad - 8 Preguntas"
)}&body=${encodeURIComponent(
  "Hola, acabo de completar las 8 preguntas clave en la web. Por favor, revisen la viabilidad de mi Creación. Saludos."
)}`;

// --- COMPONENTES DE LA PÁGINA ---
function Hero({ onMethodSelect }: { onMethodSelect: (method: 'email' | 'whatsapp') => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-6 mx-auto">
          <Zap className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">
            Filtro de Viabilidad 2.5 — Protocolos de Utilidad
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          <StaggerText text="Arquitectura de Utilidad Funcional" className="block" delay={0.4} as="span" />
          <span className="block text-2xl md:text-3xl text-zinc-300 mt-3">
            Lanza tu protocolo, integrando lógica Work-to-Earn (W2E) verificable.
          </span>
        </h1>

        <div className="max-w-3xl mx-auto mt-4">
          <TypewriterText
            text="Confirmamos la viabilidad y estructura de tu Creación en 8 preguntas clave. Si pasas, tu Protocolo entra en Fuzz Testing y Arquitectura."
            delay={1}
            speed={50}
            className="text-lg text-zinc-300"
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-500 w-full sm:w-auto px-8 md:px-12"
            onClick={() => onMethodSelect('whatsapp')}
          >
            <span className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5" />
              Comenzar Evaluación
            </span>
          </Button>
        </div>

        <p className="text-zinc-400 mt-6 text-sm">
          Este filtro es obligatorio. Solo proyectos con claridad funcional serán aceptados.
        </p>
      </div>
    </motion.section>
  );
}

function UtilityFocusBlock({ onMethodSelect }: { onMethodSelect: (method: 'email' | 'whatsapp') => void }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <GlassCard>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">La Arquitectura es la Utilidad</h3>
            <p className="text-zinc-300 leading-relaxed">
              Tu proyecto tiene valor. Nosotros lo convertimos en un <strong>Protocolo Inmutable</strong>. La base de Pandora's es el <strong>Loom Protocol</strong> (Motor W2E) que teje la <strong>Labor</strong> del usuario con las <strong>Recompensas</strong>, asegurando valor medible.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 mt-1" />Mecanismos de Labor (W2E) Verificables</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 mt-1" />Diseño de Tesorería Modular (Dual-Treasury)</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 mt-1" />Fuzz Testing y Auditoría Continua</li>
            </ul>
          </div>
        </GlassCard>

        <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="p-6 bg-gradient-to-br from-zinc-900/40 to-zinc-800/30 rounded-xl border border-zinc-700">
            <div className="flex items-center gap-4 mb-4">
              <Lightbulb className="w-8 h-8 text-yellow-400" />
              <div>
                <h4 className="text-lg font-semibold">El Costo de la Ambigüedad</h4>
                <p className="text-sm text-zinc-400">Si el W2E no es claro, tu Protocolo colapsará. Evita la deuda técnica.</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-300">
              <p><strong>El Filtro se enfoca en:</strong></p>
              <ul className="list-disc ml-5">
                <li>La Acción <strong>medible</strong> que realiza el usuario. (Q1)</li>
                <li>El <strong>Flujo Paso a Paso</strong> de la utilidad. (Q2)</li>
                <li>La <strong>Estructura Operativa</strong> del equipo. (Q3)</li>
              </ul>
            </div>

            <div className="mt-6">
              <Button onClick={() => onMethodSelect('whatsapp')} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">Comenzar Evaluación</Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
}

function WhyPandoras() {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-10">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="text-center">
          <Shield className="w-10 h-10 mx-auto mb-3 text-cyan-400" />
          <h4 className="font-bold">Protocolo Inmutable</h4>
          <p className="text-zinc-400 text-sm mt-2">Seguridad auditada y Fuzz Testing para minimizar riesgo financiero y legal.</p>
        </GlassCard>

        <GlassCard className="text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
          <h4 className="font-bold">Ecosistema Recurrente</h4>
          <p className="text-zinc-400 text-sm mt-2">Modelos de utilidad que incentivan la Labor recurrente, no la venta única.</p>
        </GlassCard>

        <GlassCard className="text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-green-400" />
          <h4 className="font-bold">Documentación Legal Base</h4>
          <p className="text-zinc-400 text-sm mt-2">Marco conceptual para De-Risking legal del Protocolo.</p>
        </GlassCard>
      </div>
    </motion.section>
  );
}

function ProgramSteps() {
  const steps = [
    { title: "Viabilidad (Filtro 8)", desc: "Evaluación de la utilidad funcional y el equipo operativo.", icon: MessageSquare },
    { title: "Arquitectura SC", desc: "Diseño del Loom Protocol, Dual-Tesorería y Tokenomics (Dual-Token).", icon: FileText },
    { title: "Deployment", desc: "Parametrización en ModularFactory y despliegue del Protocolo.", icon: Zap }
  ];

  return (
    <motion.section className="mb-10">
      <div className="max-w-5xl mx-auto px-4">
        <h3 className="text-2xl font-bold mb-4">Proceso de Integración</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.12 }}>
              <GlassCard>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h5 className="font-semibold">{s.title}</h5>
                    <p className="text-sm text-zinc-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function FAQ() {
  const faqs = [
    { q: "¿Qué pasa si no paso el filtro de 8 preguntas?", a: "Recibirás un feedback específico sobre los puntos débiles de tu arquitectura (ej. ambigüedad en el W2E) para que puedas re-aplicar cuando tengas mayor claridad." },
    { q: "¿Necesito capital para el filtro?", a: "No. El filtro valida la viabilidad funcional. Los costos de Deployment, Auditoría y Fuzz Testing se revelan una vez que pasas la Capa de Arquitectura (Q1-Q8)." },
    { q: "¿Qué es el Loom Protocol?", a: "Es el motor Work-to-Earn (W2E) de Pandora's. Es el Smart Contract que teje la Labor verificable del usuario con la recompensa ($PBOX), garantizando que el valor esté atado a la actividad real." }
  ];

  return (
    <motion.section className="mb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h4 className="text-2xl font-bold mb-4">Preguntas Frecuentes de Arquitectura</h4>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <GlassCard key={i}>
              <div className="flex items-start gap-4">
                <div className="w-10"><QuestionIcon /></div>
                <div>
                  <p className="font-semibold">{f.q}</p>
                  <p className="text-sm text-zinc-400 mt-1">{f.a}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export default function UtilityProtocolPage() {
  // Estados para email subscription (como en /start)
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isEmailSubscribed, setIsEmailSubscribed] = useState(false);

  // Estados para modales
  const [emailModal, setEmailModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'whatsapp-general' | null>(null);

  const handleMethodSelect = (method: 'email' | 'whatsapp') => {
    // Para el CTA principal "Comenzar Evaluación", siempre abrir el modal selector
    setEmailModal(true);
  };

  const handleEmailSubscription = async () => {
    if (!email?.trim()) return;

    try {
      const response = await fetch('/api/email/protocol-filter-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name: name?.trim() || 'Creador de Protocolo',
          source: 'utility-protocol-page',
          answers: [], // Empty answers for direct email subscription
        }),
      });

      if (response.ok) {
        setIsEmailSubscribed(true);
        setName('');
        setEmail('');
      } else {
        const errorData = await response.json() as { message?: string };
        alert('Error: ' + (errorData.message ?? 'No se pudo enviar la consulta'));
      }
    } catch (error) {
      console.error('Error al enviar consulta:', error);
      alert('Error de conexión. Inténtalo nuevamente.');
    }
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
        <ModernBackground />

        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <Hero onMethodSelect={handleMethodSelect} />
          <UtilityFocusBlock onMethodSelect={handleMethodSelect} />
          <WhyPandoras />
          <ProgramSteps />
          <FAQ />

          {/* CTA final */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
            <GlassCard className="p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">Inicia tu Evaluación de Viabilidad ahora.</h3>
              <p className="text-zinc-400 mb-4">La claridad de tu Protocolo define su éxito. Confirma tu estructura en el filtro de 8 preguntas.</p>

              <div className="flex justify-center">
                <Button
                  onClick={() => handleMethodSelect('whatsapp')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 w-full sm:w-auto px-8 md:px-12"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Comenzar Evaluación
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Floating WhatsApp button */}
        <div className="fixed right-6 bottom-6 z-50">
          <button onClick={() => handleMethodSelect('whatsapp')} className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center shadow-xl hover:shadow-2xl transition-all">
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Email Modal */}
        <AnimatePresence key="email-modal-protocol">
          {emailModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setEmailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-md w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <GlassCard className="p-6">
                  {/* Close button */}
                  <button
                    onClick={() => setEmailModal(false)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ✕
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {isEmailSubscribed ? "¡Perfecto!" : "¿Cómo prefieres que te contactemos?"}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {isEmailSubscribed
                        ? "Tu consulta ha sido enviada exitosamente"
                        : "Elige el método que prefieras para tu consulta sobre protocolos"
                      }
                    </p>
                  </div>

                  {!isEmailSubscribed ? (
                    /* Selector de método */
                    !selectedMethod ? (
                      <div className="space-y-4">
                        <p className="text-zinc-400 text-center mb-6">
                          Selecciona el método de contacto:
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                          {/* Opción Email */}
                          <button
                            onClick={() => setSelectedMethod('email')}
                            className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg hover:border-blue-400/40 transition-all duration-200 text-left group"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                <Mail className="w-5 h-5 text-blue-400" />
                              </div>
                              <h4 className="font-semibold text-blue-400">Por Email</h4>
                            </div>
                            <p className="text-zinc-400 text-sm mb-3">
                              Consulta detallada por email con nuestro equipo de arquitectura.
                            </p>
                            <div className="text-xs text-zinc-500">
                              ✅ Detallado • ✅ Profesional • ✅ Documentación completa
                            </div>
                          </button>

                          {/* Opción WhatsApp Utility */}
                          <button
                            onClick={() => setSelectedMethod('whatsapp-general')}
                            className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg hover:border-blue-400/40 transition-all duration-200 text-left group"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                <Phone className="w-5 h-5 text-blue-400" />
                              </div>
                              <h4 className="font-semibold text-blue-400">Consultoría Arquitectura W2E</h4>
                            </div>
                            <p className="text-zinc-400 text-sm mb-3">
                              Sesión especializada en Protocolos de Utilidad con análisis técnico detallado.
                            </p>
                            <div className="text-xs text-zinc-500">
                              🔧 Loom Protocol • 📊 Dual-Treasury • 🎯 W2E Design
                            </div>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Formulario del método seleccionado */
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Header del método seleccionado */}
                        <div className="text-center mb-6">
                          <div className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4",
                            selectedMethod === 'email'
                              ? "bg-blue-500/10 border border-blue-500/20"
                              : "bg-green-500/10 border border-green-500/20"
                          )}>
                            {selectedMethod === 'email' ? (
                              <>
                                <Mail className="w-4 h-4 text-blue-400" />
                                <span className="text-blue-400 font-medium">Consulta por Email</span>
                              </>
                            ) : (
                              <>
                                <Phone className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-medium">WhatsApp</span>
                              </>
                            )}
                          </div>

                          <Button
                            onClick={() => setSelectedMethod(null)}
                            variant="ghost"
                            size="sm"
                            className="text-zinc-400 hover:text-zinc-300 mb-4"
                          >
                            ← Cambiar método
                          </Button>
                        </div>

                        {selectedMethod === 'email' ? (
                          /* Formulario Email */
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                placeholder="Tu nombre (opcional)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none md:order-1"
                              />
                              <input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && email && handleEmailSubscription()}
                                className="p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-blue-500 focus:outline-none md:order-2"
                              />
                            </div>

                            <Button
                              onClick={handleEmailSubscription}
                              disabled={!email}
                              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white py-4 text-lg font-bold rounded-lg transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Enviar Consulta por Email
                            </Button>

                            <p className="text-zinc-500 text-xs text-center">
                              Recibirás respuesta detallada de nuestro equipo de arquitectura en 24-48h.
                            </p>
                          </div>
                        ) : (
                          /* WhatsApp Lead Form Utility Específico */
                          <div className="space-y-4">
                            <WhatsAppUtilityLeadForm />

                            <p className="text-zinc-500 text-xs text-center">
                              Te llevará a WhatsApp con consultoría especializada en Arquitectura W2E.
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )
                  ) : (
                    /* Estado de éxito */
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg"
                    >
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-green-400 font-bold text-lg">¡Consulta enviada exitosamente!</p>
                      <p className="text-zinc-400 text-sm mt-2">
                        Revisaremos tu consulta sobre protocolo y te responderemos por email en las próximas 24-48 horas.
                      </p>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


      </div>
    </Suspense>
  );
}
