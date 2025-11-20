"use client";

import { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Users,
  Shield,
  ArrowRight,
  Phone,
  Mail,
  Crown,
  CheckCircle,
  Calendar,
  FileText,
  Play,
  Code,
  RefreshCw,
} from "lucide-react";

import { ModernBackground } from "@/components/ui/modern-background";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { StaggerText } from "@/components/ui/stagger-text";
import { MorphingText } from "@/components/ui/morphing-text";
import { cn } from "@/lib/utils";
import { useGoogleAnalytics, trackEvent, trackNewsletterSubscription, trackPageView } from "@/lib/analytics";
import WhatsAppFoundersForm from "@/components/WhatsAppFoundersForm";

// Founders configuration
const FOUNDERS_SPOTS = 5;
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_CONTACT || "521XXXXXXXXXXX";
const WHATSAPP_PRE_MESSAGE = encodeURIComponent(
  "Hola, soy founder y quiero aplicar al programa de Pandora’s. Mi proyecto está listo para inversión operativa."
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_PRE_MESSAGE}`;
const EMAIL_LINK = `mailto:founders@pandoras.finance?subject=${encodeURIComponent(
  "Quiero aplicar al Founders Program - Tengo capital"
)}&body=${encodeURIComponent(
  "Hola,\n\nSoy founder interesado en aplicar al Founders Program. Tengo capital y quiero agendar una llamada. Mi web/proyecto: \n\nSaludos."
)}`;

function Hero({ onMethodSelect }: { onMethodSelect: (method: 'email' | 'whatsapp') => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="text-center mb-12"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 mb-6 mx-auto">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-300">
            Programa Exclusivo — Cupo Limitado {FOUNDERS_SPOTS} Founders
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          <StaggerText text="Founders Inner Circle" className="block" delay={0.4} />
          <span className="block text-2xl md:text-3xl text-zinc-300 mt-3">
            Lanza tu protocolo, accede al capital estratégico y lanza con soporte experto.
          </span>
        </h1>

        <div className="max-w-3xl mx-auto mt-4">
          <TypewriterText
            text="Solo 5 founders al año. Aceleración técnica, estrategia de lanzamiento y apoyo en capital selecto."
            delay={1}
            speed={50}
            className="text-lg text-zinc-300"
          />
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-green-400 to-lime-400 w-full sm:w-auto"
            onClick={() => onMethodSelect('whatsapp')}
          >
            <span className="flex items-center gap-3">
              <Phone className="w-5 h-5" />
              Hablar con un Estratega
            </span>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            className="border border-zinc-700 w-full sm:w-auto"
            onClick={() => onMethodSelect('email')}
          >
            <span className="flex items-center gap-3">
              <Mail className="w-5 h-5" />
              Enviar email
            </span>
          </Button>

          <Link href="/apply" onClick={() => trackEvent('founders_cta', 'click', 'apply')} className="w-full sm:w-auto">
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500">
              <span className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5" />
                Aplicar al Programa
              </span>
            </Button>
          </Link>
        </div>

        <p className="text-zinc-400 mt-6 text-sm">
          Espacio limitado — quienes aplican con capital y roadmap concreto tendrán prioridad.
        </p>
      </div>
    </motion.section>
  );
}

function StoryBlock({ onMethodSelect }: { onMethodSelect: (method: 'email' | 'whatsapp') => void }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-10">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <GlassCard>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">El viaje del founder</h3>
            <p className="text-zinc-300 leading-relaxed">
              Has construido una audiencia, tienes visión y capital. Pandora's te ayuda a convertir esa visión en un
              protocolo funcional que recompensa actividad real — no promesas vacías. Te acompañamos desde la arquitectura
              técnica hasta el lanzamiento final.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-zinc-400">
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 mt-1" />Arquitectura a la medida</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 mt-1" />Roadmap de lanzamiento</li>
              <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-400 mt-1" />Acceso a capital estratégico</li>
            </ul>
          </div>
        </GlassCard>

        <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}>
          <div className="p-6 bg-gradient-to-br from-zinc-900/40 to-zinc-800/30 rounded-xl border border-zinc-700">
            <div className="flex items-center gap-4 mb-4">
              <Rocket className="w-8 h-8 text-pink-400" />
              <div>
                <h4 className="text-lg font-semibold">Oferta Founders — Mediana & Premium</h4>
                <p className="text-sm text-zinc-400">Programa acelerado con enfoque en capital y ejecución.</p>
              </div>
            </div>

            <div className="space-y-2 text-sm text-zinc-300">
              <p><strong>Incluye:</strong></p>
              <ul className="list-disc ml-5">
                <li>Diagnóstico técnico y económico</li>
                <li>Arquitectura work-to-earn personalizada</li>
                <li>Soporte de lanzamiento y marketing técnico</li>
                <li>Acceso a red de inversores y roadmap de funding</li>
              </ul>
            </div>

            <div className="mt-6">
              <Button onClick={() => onMethodSelect('whatsapp')} className="w-full">Quiero aplicar — hablar con un estratega</Button>
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
          <h4 className="font-bold">Arquitectura Segura</h4>
          <p className="text-zinc-400 text-sm mt-2">Contratos auditados y Fuzz Testing continuo para minimizar riesgo.</p>
        </GlassCard>

        <GlassCard className="text-center">
          <Users className="w-10 h-10 mx-auto mb-3 text-indigo-400" />
          <h4 className="font-bold">Activación Real</h4>
          <p className="text-zinc-400 text-sm mt-2">Modelos Work-to-Earn que convierten a tu audiencia en colaboradores activos.</p>
        </GlassCard>

        <GlassCard className="text-center">
          <FileText className="w-10 h-10 mx-auto mb-3 text-green-400" />
          <h4 className="font-bold">Ejecución Rápida</h4>
          <p className="text-zinc-400 text-sm mt-2">Deployment desde ModularFactory con plantillas pre-configuradas.</p>
        </GlassCard>
      </div>
    </motion.section>
  );
}

function ProgramSteps() {
  const steps = [
    { title: "Diagnóstico", desc: "Evaluamos tu caso de uso, comunidad y readiness técnica.", icon: Calendar },
    { title: "Arquitectura", desc: "Diseñamos el protocolo, tokenomics y seguridad.", icon: Code },
    { title: "Lanzamiento", desc: "Parametrizamos y lanzamos con soporte técnico y marketing." , icon: Rocket }
  ];

  return (
    <motion.section className="mb-10">
      <div className="max-w-5xl mx-auto px-4">
        <h3 className="text-2xl font-bold mb-4">Proceso en 3 pasos</h3>
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

function SocialProof({ onMethodSelect }: { onMethodSelect: (method: 'email' | 'whatsapp') => void }) {
  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="mb-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Más de <strong className="text-white">50</strong> founders evaluando</p>
            <p className="text-zinc-400 text-sm">Contratos auditados · Integraciones en Polygon & Ethereum</p>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => onMethodSelect('whatsapp')} variant="outline">Hablar con un Estratega</Button>
            <Button onClick={() => onMethodSelect('email')} variant="ghost">Enviar email</Button>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function FAQ() {
  const faqs = [
    { q: "¿Necesito una tech team?", a: "No. Podemos acompañarte en arquitectura y ejecución. Para integraciones complejas sugerimos 1 dev técnico disponible." },
    { q: "¿Qué tipo de capital buscan?", a: "Buscamos founders con capital inicial para cubrir auditoría mínima, despliegue y marketing (cantidad negociable por caso)." },
    { q: "¿Cómo se asegura que no es un security?", a: "Diseñamos modelos centrados en utilidad y recompensas por actividad. Revisamos legalmente cada caso antes del despliegue." }
  ];

  return (
    <motion.section className="mb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h4 className="text-2xl font-bold mb-4">Preguntas frecuentes</h4>
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

function QuestionIcon() {
  return (
    <svg className="w-6 h-6 text-yellow-400" viewBox="0 0 24 24" fill="none">
      <path d="M12 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.09 9a3 3 0 115.82 0c0 2.2-3 2.8-3 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function FoundersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
      <FoundersPageContent />
    </Suspense>
  );
}

function FoundersPageContent() {
  // Google Analytics
  useGoogleAnalytics();
  trackPageView('Founders Landing Page');

  const [openWhatsappMini, setOpenWhatsappMini] = useState(false);
  const [emailModal, setEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'whatsapp' | null>(null);

  const sendFoundersEmail = async () => {
    if (!email.trim()) return;

    setEmailSending(true);
    try {
      const response = await fetch('/api/email/founders-send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          source: 'founders-landing-modal',
          name: 'Founder'
        }),
      });

      if (response.ok) {
        setEmailSent(true);
        trackEvent('founders_email', 'send', 'modal', 1);
        // Close modal after 2 seconds
        setTimeout(() => {
          setEmailModal(false);
          setEmailSent(false);
          setEmail('');
        }, 2000);
      } else {
        alert('Error al enviar el email. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error de conexión. Por favor intenta nuevamente.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>}>
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative overflow-hidden">
        <ModernBackground />

        <div className="relative max-w-6xl mx-auto px-4 py-16">
          <Hero onMethodSelect={(method) => {
            if (method === 'email') {
              setEmailModal(true);
              trackEvent('founders_cta', 'click', 'email_modal');
            } else if (method === 'whatsapp') {
              setSelectedMethod('whatsapp');
              trackEvent('founders_cta', 'click', 'whatsapp_modal');
            }
          }} />
          <StoryBlock onMethodSelect={(method) => {
            if (method === 'email') {
              setEmailModal(true);
              trackEvent('founders_offer', 'click', 'email');
            } else if (method === 'whatsapp') {
              setSelectedMethod('whatsapp');
              trackEvent('founders_offer', 'click', 'whatsapp');
            }
          }} />
          <WhyPandoras />
          <ProgramSteps />
          <SocialProof onMethodSelect={(method) => {
            if (method === 'email') {
              setEmailModal(true);
              trackEvent('social_proof', 'click', 'email');
            } else if (method === 'whatsapp') {
              setSelectedMethod('whatsapp');
              trackEvent('social_proof', 'click', 'whatsapp');
            }
          }} />
          <FAQ />

          {/* CTA final */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-8">
            <GlassCard className="p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">¿Listo para aplicar?</h3>
              <p className="text-zinc-400 mb-4">Si tienes capital y urgencia, aplica ahora para recibir atención prioritaria.</p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => {
                    setSelectedMethod('whatsapp');
                    trackEvent('founders_apply', 'click', 'whatsapp');
                  }}
                  className="bg-gradient-to-r from-green-400 to-lime-400"
                >
                  <Phone className="w-4 h-4 mr-2" />Hablar con un Estratega
                </Button>

                <Button
                  onClick={() => {
                    setEmailModal(true);
                    trackEvent('founders_apply', 'click', 'email');
                  }}
                  variant="ghost"
                  className="border border-zinc-700"
                >
                  <Mail className="w-4 h-4 mr-2" />Enviar email
                </Button>

                <Link href="/apply" onClick={() => trackEvent('founders_apply', 'click', 'apply')}>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-500"><ArrowRight className="w-4 h-4 mr-2" />Ir a Apply</Button>
                </Link>
              </div>

              <p className="text-zinc-500 text-xs mt-4">Aplicación inicial toma ~5-10 minutos. Nuestro equipo responde en 24-48h.</p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Floating WhatsApp button */}
        <div className="fixed right-6 bottom-6 z-50">
          <a href={WHATSAPP_LINK} target="_blank" rel="noreferrer" onClick={() => trackEvent('founders_fab', 'click', 'whatsapp')}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-green-400 to-lime-400 flex items-center justify-center shadow-xl">
              <Phone className="w-6 h-6 text-white" />
            </div>
          </a>
        </div>

        {/* Email Modal */}
        <AnimatePresence key="email-modal">
          {emailModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => {
                if (!emailSending && !emailSent) {
                  setEmailModal(false);
                }
              }}
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
                  {(!emailSending && !emailSent) && (
                    <button
                      onClick={() => setEmailModal(false)}
                      className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      ✕
                    </button>
                  )}

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-6 h-6 text-yellow-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {emailSent ? "¡Email Enviado!" : "Recibe Información del Programa"}
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      {emailSent
                        ? "Revisa tu bandeja de entrada con detalles del programa founders."
                        : "Te enviaremos información premium sobre el programa exclusive para founders."}
                    </p>
                  </div>

                  {emailSent ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                      </div>
                      <p className="text-sm text-zinc-300">
                        Perfecto, revisa tu email
                        <br />
                        <strong className="text-yellow-400">{email}</strong>
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      sendFoundersEmail();
                    }}>
                      <div className="space-y-4">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          required
                          disabled={emailSending}
                          className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-yellow-500 focus:outline-none disabled:opacity-50"
                        />

                        <Button
                          type="submit"
                          disabled={!email.trim() || emailSending}
                          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50"
                        >
                          {emailSending ? (
                            <span className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                              Enviando...
                            </span>
                          ) : (
                            "Enviar Información"
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </GlassCard>
              </motion.div>
            </motion.div>
          )}

        {/* WhatsApp Modal */}
        <AnimatePresence key="whatsapp-modal">
          {selectedMethod === 'whatsapp' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
              onClick={() => setSelectedMethod(null)}
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
                    onClick={() => setSelectedMethod(null)}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    ✕
                  </button>

                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Phone className="w-6 h-6 text-green-400" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      Conectar con un Estratega Premium
                    </h3>
                    <p className="text-zinc-400 text-sm">
                      Inicia una conversación personalizada para evaluar tu capacidad de capital y experiencia como founder.
                    </p>
                  </div>

                  <WhatsAppFoundersForm />

                  <p className="text-zinc-500 text-xs text-center mt-4">
                    Iremos directamente a WhatsApp con tu mensaje preparado 🎯
                  </p>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </AnimatePresence>
      </div>
    </Suspense>
  );
}
