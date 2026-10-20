'use client';

import React, { useState } from 'react';
import { 
  GitBranch, 
  Sparkles, 
  MessageSquare, 
  Target, 
  Layers, 
  CheckCircle2, 
  Zap, 
  Copy, 
  Check, 
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';

interface JourneysGuideModalProps {
  organizationSlug: string;
}

export function JourneysGuideModal({ organizationSlug }: JourneysGuideModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'concept' | 'whatsapp' | 'examples' | 'inheritance'>('concept');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      toast.success('Ejemplo copiado al portapapeles');
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <>
      {/* Botón Trigger en la interfaz */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 border border-indigo-500/20 text-xs font-medium transition-all shadow-sm"
      >
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <span>Guía & Tutorial de Journeys</span>
      </button>

      {/* Modal / Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#0C0C14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden text-white">
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#12121E]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Manual & Guía Operativa de Agent Journeys</h2>
                  <p className="text-xs text-white/50">
                    Aprende a estructurar metas conversacionales, inyectar prospectos por WhatsApp y heredar estrategias.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 pb-1 border-b border-white/5 bg-[#0e0e18] text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('concept')}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'concept'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                1. ¿Qué es un Journey?
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'whatsapp'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                2. Inyección Personalizada (WhatsApp)
              </button>
              <button
                onClick={() => setActiveTab('examples')}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'examples'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                3. Playbooks y Casos de Uso
              </button>
              <button
                onClick={() => setActiveTab('inheritance')}
                className={`px-3 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'inheritance'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                4. Herencia para Tenants
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm text-white/80 leading-relaxed">
              
              {/* TAB 1: CONCEPTO */}
              {activeTab === 'concept' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      ¿Por qué un Journey supera a un chatbot convencional?
                    </h3>
                    <p className="text-xs text-white/70">
                      Un bot común responde preguntas aisladas. Un <strong>Agent Journey</strong> es una máquina de estados dirigida a objetivos (Goal Engine). Hermes no solo chatea: persigue hitos progresivos (*milestones*) para guiar al usuario desde el primer contacto hasta el cierre comercial, reunión agendada o firma de contrato.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs">
                        <Target className="w-4 h-4" />
                        <span>Hitos (Milestones)</span>
                      </div>
                      <p className="text-xs text-white/60">
                        Cada etapa exige datos o confirmaciones previas (ej. correo, presupuesto, número) antes de avanzar.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                        <Zap className="w-4 h-4" />
                        <span>Validación en Cada Turno</span>
                      </div>
                      <p className="text-xs text-white/60">
                        En cada mensaje del cliente, el motor evalúa si se cumplió un hito y actualiza el estado en el CRM.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                      <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Acciones Deterministas</span>
                      </div>
                      <p className="text-xs text-white/60">
                        Al completar el funnel, Hermes dispara herramientas autorizadas: agendar Meet, crear link SPEI o transferir a un asesor.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">Ciclo de Vida de una Conversación con Journey</h4>
                    <div className="p-4 rounded-xl bg-[#090910] border border-white/5 space-y-3 font-mono text-xs">
                      <div className="flex items-center gap-2 text-amber-400">
                        <span className="w-5 h-5 rounded-full bg-amber-400/10 flex items-center justify-center text-[10px] font-bold">1</span>
                        <span>Descubrimiento / Tesis de Proyecto ➔ Hermes detecta necesidad inicial.</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400">
                        <span className="w-5 h-5 rounded-full bg-blue-400/10 flex items-center justify-center text-[10px] font-bold">2</span>
                        <span>Calificación & Objeciones ➔ Valida presupuesto y datos de contacto requeridos.</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400">
                        <span className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-[10px] font-bold">3</span>
                        <span>Conversión ➔ Genera reserva en la Agenda Soberana (/meet) o link de pago.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INYECCIÓN PERSONALIZADA (WHATSAPP) */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Inyección de Prospectos Personalizados (Nombre + Teléfono)
                    </h3>
                    <p className="text-xs text-white/60">
                      Puedes pre-cargar prospectos con su nombre, empresa, notas y número de WhatsApp. Cuando ese prospecto hable con Hermes por WhatsApp o Telegram, el sistema lo reconoce y ejecuta la estrategia asignada sin preguntar datos redundantes.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>Ejemplo de Llamada API / Webhook para inyectar prospecto:</span>
                      <button
                        onClick={() => copyToClipboard(`curl -X POST https://dash.pandoras.finance/api/v1/marketing/leads/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Roberto Garza",
    "email": "roberto@capitalinmobiliario.mx",
    "intent": "whitelist",
    "consent": true,
    "metadata": {
      "phoneNumber": "+529511234567",
      "company": "Capital Inmobiliario",
      "targetJourney": "family_referral_journey",
      "notes": "Interesado en tickets de inversión y agendamiento con fundadores."
    }
  }'`, 1)}
                        className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
                      >
                        {copiedIndex === 1 ? <Check size={12} /> : <Copy size={12} />}
                        <span>Copiar cURL</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-[#090910] border border-white/5 text-xs font-mono text-zinc-300 overflow-x-auto">
{`POST /api/v1/marketing/leads/register
{
  "name": "Roberto Garza",
  "email": "roberto@capitalinmobiliario.mx",
  "intent": "whitelist",
  "consent": true,
  "metadata": {
    "phoneNumber": "+529511234567",
    "company": "Capital Inmobiliario",
    "targetJourney": "family_referral_journey",
    "notes": "Interesado en tickets de inversión y agendamiento con fundadores."
  }
}`}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <h4 className="text-xs font-semibold text-white">¿Qué hace Hermes al recibir el mensaje por WhatsApp?</h4>
                    <p className="text-xs text-white/60">
                      1. El <code className="text-indigo-300">ActorIdentityBindingService</code> vincula el número entrante (+529511234567) con el ID canónico de Roberto.<br />
                      2. Recupera la empresa (*Capital Inmobiliario*) y la etapa actual del Journey.<br />
                      3. Hermes saluda de forma ultra-personalizada:
                    </p>
                    <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs italic text-emerald-200">
                      &quot;Hola Roberto, un gusto saludarte. Sé que en Capital Inmobiliario están evaluando la estructura de Certificados Patrimoniales. ¿Te gustaría que coordinemos 15 minutos privados con los fundadores para revisar los números?&quot;
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PLAYBOOKS DISPONIBLES */}
              {activeTab === 'examples' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-white">Estrategias y Playbooks Disponibles de Fábrica</h3>
                    <p className="text-xs text-white/60">
                      Puedes activar, editar o crear journeys basados en estos modelos pre-configurados:
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">A. Referral Trust Journey (Inversión & RWA)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Alta Conversión</span>
                      </div>
                      <p className="text-xs text-white/60">
                        <strong>Objetivo:</strong> Educar sobre la estructura fiduciaria y jurídica sin lenguaje agresivo y cerrar en agendamiento privado de videollamada (/meet) o pago SPEI directo.
                      </p>
                      <div className="text-[11px] text-white/40">
                        Pasos: Tesis de Proyecto ➔ Resolución de Objeciones Jurídicas ➔ Agenda con Fundador.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">B. Pandoras B2B Onboarding (Captación de Empresas)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Directo a Dashboard</span>
                      </div>
                      <p className="text-xs text-white/60">
                        <strong>Objetivo:</strong> Identificar cuello de botella comercial de la empresa y llevarlos a auto-aprovisionarse en dash.pandoras.finance/onboarding.
                      </p>
                      <div className="text-[11px] text-white/40">
                        Pasos: Diagnóstico de Demanda ➔ Demo de Hermes 24/7 ➔ Entrega de Magic Link al Hub.
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">C. Sovereign Education (Educación Web3 & Academia)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">Nutrición & Confianza</span>
                      </div>
                      <p className="text-xs text-white/60">
                        <strong>Objetivo:</strong> Filtrar el nivel de conocimiento del usuario y asegurar su cupo a masterclasses o workshops.
                      </p>
                      <div className="text-[11px] text-white/40">
                        Pasos: Test de Auto-Custodia ➔ Recomendación de Módulos ➔ Reserva de Workshop.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: HERENCIA PARA TENANTS */}
              {activeTab === 'inheritance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
                      <Layers className="w-4 h-4 text-violet-400" />
                      Herencia de Journeys a Nuevos Tenants
                    </h3>
                    <p className="text-xs text-white/60">
                      La misma estrategia que usas para vender Pandora&apos;s la pueden usar tus clientes para sus propios proyectos:
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#090910] border border-white/5 space-y-3 text-xs">
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <div>
                        <strong className="text-white">Motor Inmutable:</strong> La lógica de validación de hitos, estados de lead y triggers de agenda vive en el core (<code className="text-indigo-300">@saasfly/hermes-core</code>).
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <div>
                        <strong className="text-white">Voz de Marca Propia:</strong> Cada tenant configura en su panel su personalidad (<code className="text-indigo-300">brandVoice</code>) y carga sus documentos a la bóveda.
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <div>
                        <strong className="text-white">Aislamiento Criptográfico:</strong> Los prospectos de un tenant jamás se mezclan con otro gracias al aislamiento por <code className="text-indigo-300">canonicalOrgId</code>.
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-200">
                    💡 <strong>Tip para aprovisionamiento:</strong> Al crear un nuevo tenant en el Onboarding, Hermes ya viene con un Journey base activo listo para recibir mensajes por WhatsApp y convertirlos en citas confirmadas.
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#12121E]">
              <span className="text-xs text-white/40">
                Organización activa: <span className="text-indigo-400 font-mono">{organizationSlug}</span>
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all"
              >
                Cerrar Guía
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
