"use client";
import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import Image from 'next/image';
import { useActiveAccount } from 'thirdweb/react';
import { useRouter } from 'next/navigation';
// 🎮 IMPORTAR EVENTOS DE GAMIFICACIÓN
import { gamificationEngine, EventType } from "@pandoras/gamification";
// 📖 MODAL DE INFORMACIÓN
import { InfoModal } from './InfoModal';
// 🔄 MODAL DE RESULTADO (Loading/Success/Error)
import { ResultModal } from './ResultModal';
// 📜 MODAL DE TÉRMINOS Y CONDICIONES
import { useTermsModal } from '@/contexts/TermsModalContext';
// 🧩 COMPONENTES DE INPUT MODULARES
import {
  TextInput,
  TextareaInput,
  SelectInput,
  NumberInput,
  UrlInput,
  CheckboxInput,
  RecurringRewardsInput,
  FileInput
} from './conversational-form/inputComponents';
// 📋 PREGUNTAS DEL FORMULARIO
import { formQuestions } from './conversational-form/formQuestions';

// Schema de validación completo basado en DB schema - Versión Utility
const projectSchema = z.object({
  // Campos requeridos - Identidad de la Creación (temporalmente opcionales para pruebas)
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(256, "El nombre es demasiado largo").optional(),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres").optional(),
  businessCategory: z.enum([
    'residential_real_estate',
    'commercial_real_estate',
    'tech_startup',
    'renewable_energy',
    'art_collectibles',
    'intellectual_property',
    'defi',
    'gaming',
    'metaverse',
    'music_audio',
    'sports_fan_tokens',
    'education',
    'healthcare',
    'supply_chain',
    'infrastructure',
    'social_networks',
    'carbon_credits',
    'insurance',
    'prediction_markets',
    'other'
  ]).optional(),

  // Campos opcionales - Identidad
  tagline: z.string().max(140, "El eslogan es demasiado largo").optional(),
  logoUrl: z.string().optional().or(z.literal("")),
  coverPhotoUrl: z.string().optional().or(z.literal("")),
  videoPitch: z.string().url("URL de video inválida").max(512).optional().or(z.literal("")),

  // Comunidad y Conexiones
  website: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  whitepaperUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  twitterUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  discordUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  telegramUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),

  // Recursos y Artefactos
  targetAmount: z.union([z.number().min(1), z.string()]).optional(),
  totalValuationUsd: z.number().min(0).optional(),
  tokenType: z.enum(['erc20', 'erc721', 'erc1155']).optional(),
  totalTokens: z.number().min(1, "Debe haber al menos 1 token").optional(),
  tokensOffered: z.number().min(1, "Debe ofrecer al menos 1 token").optional(),
  tokenPriceUsd: z.number().min(0.01, "El precio debe ser mayor a 0.01 USD").optional(),
  estimatedApy: z.string().max(50).optional(),
  yieldSource: z.enum(['protocol_revenue', 'staking_rewards', 'liquidity_mining', 'governance_rewards', 'utility_fees', 'revenue_sharing', 'other']).optional(),

  // Estructura de Recompensa Recurrente
  stakingRewardsEnabled: z.boolean().optional(),
  stakingRewardsDetails: z.string().optional(),
  revenueSharingEnabled: z.boolean().optional(),
  revenueSharingDetails: z.string().optional(),
  workToEarnEnabled: z.boolean().optional(),
  workToEarnDetails: z.string().optional(),
  tieredAccessEnabled: z.boolean().optional(),
  tieredAccessDetails: z.string().optional(),
  discountedFeesEnabled: z.boolean().optional(),
  discountedFeesDetails: z.string().optional(),

  recurringRewards: z.string().optional(),

  fundUsage: z.string().optional(),
  lockupPeriod: z.string().max(100).optional(),

  // Equipo y Gobernanza
  teamMembers: z.array(z.object({
    name: z.string(),
    position: z.string(),
    linkedin: z.string().optional()
  })).optional(),
  advisors: z.array(z.object({
    name: z.string(),
    specialty: z.string()
  })).optional(),
  tokenDistribution: z.object({
    communitySale: z.number().min(0).max(100),
    teamFounders: z.number().min(0).max(100),
    treasury: z.number().min(0).max(100),
    marketing: z.number().min(0).max(100)
  }).optional(),
  treasuryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de tesorería inválida").optional().or(z.literal("")),

  // Confianza y Transparencia
  legalStatus: z.string().optional(),
  fiduciaryEntity: z.string().max(256).optional(),
  valuationDocumentUrl: z.string().optional(),
  dueDiligenceReportUrl: z.string().url("URL inválida").optional().or(z.literal("")),

  // Parámetros Técnicos
  isMintable: z.boolean().optional(),
  isMutable: z.boolean().optional(),
  updateAuthorityAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de autoridad inválida").optional().or(z.literal("")),

  // Información del Creador
  applicantName: z.string().min(2, "El nombre es requerido").max(256),
  applicantPosition: z.string().max(256).optional(),
  applicantEmail: z.string().email("Email inválido").max(256),
  applicantPhone: z.string().max(50).optional(),
  applicantWalletAddress: z.string().optional(),

  // Campos adicionales
  integrationDetails: z.string().optional(),
  legalEntityHelp: z.boolean().optional(),

  // Verificación Final
  verificationAgreement: z.string().optional(),
});

// Tipos
export type ProjectFormData = z.infer<typeof projectSchema>;

export interface FormQuestion {
  id: keyof ProjectFormData;
  label: string;
  placeholder?: string;
  component: 'text-input' | 'textarea-input' | 'select-input' | 'number-input' | 'url-input' | 'file-input' | 'checkbox-input' | 'recurring-rewards-input';
  options?: { value: string; label: string }[];
  required?: boolean;
  maxLength?: number;
  info?: string;
  relatedField?: string;
}





// Función para personalizar las preguntas con el nombre del proyecto
function getPersonalizedLabel(originalLabel: string, projectTitle: string): string {
  if (!projectTitle || projectTitle === 'tu Creación') {
    return originalLabel;
  }

  // Reemplazar referencias genéricas con el nombre específico del proyecto
  return originalLabel
    .replace(/tu Creación/g, projectTitle)
    .replace(/esta Creación/g, projectTitle)
    .replace(/la Creación/g, projectTitle)
    .replace(/Creación/g, projectTitle);
}

// Barra de Progreso
function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="w-full bg-zinc-700 rounded-full h-2 mb-8 overflow-hidden">
      <motion.div
        className="bg-gradient-to-r from-lime-400 to-emerald-400 h-2 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// Componente Principal
export default function ConversationalForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptanceChecked, setAcceptanceChecked] = useState(false);

  // Hook para el modal de términos
  const { openModal } = useTermsModal();
  const [infoModal, setInfoModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    content: React.ReactNode;
    icon?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
    content: null,
  });

  // Modal de resultado (loading/success/error)
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean;
    type: 'loading' | 'success' | 'error';
    title: string;
    description: string;
    content: React.ReactNode;
    icon?: string;
  }>({
    isOpen: false,
    type: 'loading',
    title: '',
    description: '',
    content: null,
  });
  const account = useActiveAccount();

  const methods = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
  });

  const { trigger, handleSubmit, watch, setValue } = methods;

  // Observar cambios en el título para personalización dinámica
  const projectTitle = watch('title') ?? 'tu Creación';

  // Auto-fill wallet address when account changes
  useEffect(() => {
    if (account?.address) {
      setValue('applicantWalletAddress', account.address.toLowerCase());
    }
  }, [account?.address, setValue]);

  const currentQuestion = formQuestions[currentStep];

  // Funciones para abrir modales informativos
  const openMechanicModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es la Mecánica de Utilidad?',
      description: 'Entiende por qué tu protocolo necesita una mecánica clara y cómo definirla correctamente.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🎯 Definición</h4>
            <p className="text-sm">
              La <strong>mecánica de utilidad</strong> es la regla fundamental que explica cómo tu protocolo genera valor para sus usuarios. Es la respuesta a &apos;¿Qué obtienen los holders de mis Artefactos?&apos;
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🔑 Elementos Esenciales</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Acceso Exclusivo:</strong> Puertas de entrada a servicios, comunidades o experiencias premium</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Recompensas Tangibles:</strong> Beneficios económicos, descuentos, o ventajas competitivas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Gobernanza:</strong> Poder de decisión en el futuro del protocolo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-lime-400 mt-1">•</span>
                <span><strong>Utilidad Continua:</strong> Beneficios que se mantienen y crecen con el tiempo</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">⚠️ Por qué es Crucial</h4>
            <p className="text-sm">
              Sin una mecánica clara, tu protocolo se convierte en un simple &apos;token de inversión&apos;. Los usuarios necesitan entender exactamente qué valor obtienen al participar.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Ejemplos de Buenas Mecánicas</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Acceso a Comunidad:</strong> &apos;Holders pueden unirse a nuestro Discord exclusivo con alpha calls&apos;</li>
              <li>• <strong>Recompensas por Labor:</strong> &apos;Contribuciones a la DAO generan tokens adicionales&apos;</li>
              <li>• <strong>Descuentos:</strong> &apos;Holders obtienen 50% descuento en productos/servicios&apos;</li>
              <li>• <strong>Gobernanza:</strong> &apos;Voto en decisiones que afectan el futuro del protocolo&apos;</li>
            </ul>
          </div>
        </div>
      ),
      icon: '⚙️'
    });
  }, []);

  const openBenefitModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es un Beneficio Tangible?',
      description: 'Aprende a definir beneficios concretos que los usuarios puedan entender y valorar.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🎯 Beneficio Tangible</h4>
            <p className="text-sm">
              Un <strong>beneficio tangible</strong> es un valor concreto y medible que los holders de tus Artefactos reciben. Debe ser específico, cuantificable y verificable.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">✅ Características de un Buen Beneficio</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Específico:</strong> &apos;50% descuento&apos; en lugar de &apos;descuentos&apos;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Cuantificable:</strong> &apos;Acceso a 10 eventos exclusivos al año&apos;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Verificable:</strong> &apos;Recompensas calculadas por algoritmo público&apos;</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Inmediato:</strong> Beneficios que se obtienen desde el primer día</span>
              </li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">❌ Evita Beneficios Vagós</h4>
            <ul className="text-sm space-y-1">
              <li>• &apos;Valor futuro&apos; - Demasiado abstracto</li>
              <li>• &apos;Potencial de crecimiento&apos; - No es un beneficio tangible</li>
              <li>• &apos;Comunidad exclusiva&apos; - ¿Qué significa exactamente?</li>
              <li>• &apos;Recompensas por participación&apos; - ¿Cuánto y cómo?</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Ejemplos de Beneficios Tangibles</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Económico:</strong> &apos;Recibe 5% de todas las transacciones del protocolo&apos;</li>
              <li>• <strong>Acceso:</strong> &apos;Entrada gratuita a 12 eventos premium al año&apos;</li>
              <li>• <strong>Utilidad:</strong> &apos;50% descuento en todos los productos de la plataforma&apos;</li>
              <li>• <strong>Gobernanza:</strong> &apos;1 voto por cada Artefacto en decisiones DAO&apos;</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🎁'
    });
  }, []);

  const openUtilityModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es la Utilidad Continua?',
      description: 'Descubre cómo mantener el valor de tus Artefactos a largo plazo.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🔄 Utilidad Continua</h4>
            <p className="text-sm">
              La <strong>utilidad continua</strong> asegura que tus Artefactos mantengan y aumenten su valor con el tiempo. Es el plan para que los beneficios no desaparezcan después del lanzamiento.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🚀 Estrategias para Utilidad Continua</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">📈</span>
                <span><strong>Actualizaciones del Protocolo:</strong> Nuevas funcionalidades que agregan valor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🎯</span>
                <span><strong>Casos de Uso Expandidos:</strong> Nuevos escenarios donde los Artefactos son útiles</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">⏰</span>
                <span><strong>Beneficios por Tenencia:</strong> Ventajas adicionales por mantener los Artefactos largo tiempo</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🤝</span>
                <span><strong>Integraciones:</strong> Conectar con otras plataformas y servicios</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">⚠️ Riesgo de Utilidad Temporal</h4>
            <p className="text-sm">
              Muchos protocolos fracasan porque ofrecen beneficios solo durante el lanzamiento. Sin un plan de utilidad continua, los usuarios pierden interés y el valor de los Artefactos cae.
            </p>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Ejemplos de Utilidad Continua</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Evolución:</strong> &apos;Cada 6 meses agregamos nuevas funcionalidades votadas por la comunidad&apos;</li>
              <li>• <strong>Expansión:</strong> &apos;Integramos con 3 nuevas plataformas cada trimestre&apos;</li>
              <li>• <strong>Recompensas Crecientes:</strong> &apos;Las recompensas aumentan 10% cada año&apos;</li>
              <li>• <strong>Exclusividad:</strong> &apos;Holders veteranos obtienen acceso a funciones beta primero&apos;</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🔄'
    });
  }, []);

  const openWorkToEarnModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Qué es Work-to-Earn?',
      description: 'Entiende el modelo Work-to-Earn y cómo implementarlo correctamente en tu protocolo.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">💼 Work-to-Earn (W2E)</h4>
            <p className="text-sm">
              <strong>Work-to-Earn</strong> es un modelo económico donde los participantes reciben recompensas por contribuir activamente al protocolo. Es &apos;labor&apos; que genera &apos;ganancias&apos;.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🎯 Cómo Funciona W2E</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">1.</span>
                <span><strong>Definir Acciones:</strong> ¿Qué actividades generan recompensas?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">2.</span>
                <span><strong>Establecer Valor:</strong> ¿Cuánto vale cada contribución?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">3.</span>
                <span><strong>Medir Contribución:</strong> ¿Cómo se verifica y cuantifica el trabajo?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 mt-1">4.</span>
                <span><strong>Distribuir Recompensas:</strong> ¿Cuándo y cómo se pagan?</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">📋 Ejemplos de Acciones W2E</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Contribución DAO:</strong> Propuestas, votación, moderación</li>
              <li>• <strong>Creación de Contenido:</strong> Artículos, videos, tutoriales</li>
              <li>• <strong>Desarrollo:</strong> Código, auditorías, mejoras técnicas</li>
              <li>• <strong>Comunidad:</strong> Reclutamiento, soporte, traducción</li>
              <li>• <strong>Marketing:</strong> Compartir en redes, referidos verificados</li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-400 mb-2">✅ Mejores Prácticas W2E</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Transparencia:</strong> Algoritmos públicos y verificables</li>
              <li>• <strong>Sostenibilidad:</strong> Recompensas que no diluyan excesivamente</li>
              <li>• <strong>Equidad:</strong> Oportunidades para todos los niveles de contribución</li>
              <li>• <strong>Retroalimentación:</strong> Sistema de evaluación comunitario</li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">⚠️ Errores Comunes</h4>
            <ul className="text-sm space-y-1">
              <li>• Recompensas infladas que generan desconfianza</li>
              <li>• Sistema demasiado complejo para participar</li>
              <li>• Falta de verificación real de contribuciones</li>
              <li>• Dependencia excesiva de contribuciones voluntarias</li>
            </ul>
          </div>
        </div>
      ),
      icon: '💼'
    });
  }, []);

  const openTokenTypeModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Cómo decidir el tipo de Artefacto digital?',
      description: 'Entiende las diferencias entre ERC-20, ERC-721 y ERC-1155 para elegir el estándar correcto.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">🎯 Tipos de Artefactos Digitales</h4>
            <p className="text-sm">
              Los <strong>Artefactos digitales</strong> son tokens que representan participación o acceso. Elige el estándar técnico según cómo se usará tu utilidad.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">🪙 ERC-20 (Fungible)</h4>
              <p className="text-sm mb-2"><strong>Para:</strong> Recompensas, gobernanza, staking</p>
              <ul className="text-sm space-y-1">
                <li>• <strong>Intercambiables:</strong> Todos los tokens son idénticos</li>
                <li>• <strong>Divisibles:</strong> Se pueden fraccionar (ej: 0.5 tokens)</li>
                <li>• <strong>Económicos:</strong> Bajo costo de transacción</li>
                <li>• <strong>Ejemplo:</strong> Tokens de recompensa, monedas de gobernanza</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">🎨 ERC-721 (NFT - No Fungible)</h4>
              <p className="text-sm mb-2"><strong>Para:</strong> Acceso único, identidad, membresía</p>
              <ul className="text-sm space-y-1">
                <li>• <strong>Únicos:</strong> Cada token es diferente</li>
                <li>• <strong>No divisibles:</strong> Solo enteros (1 token completo)</li>
                <li>• <strong>Metadata rica:</strong> Imágenes, atributos, historia</li>
                <li>• <strong>Ejemplo:</strong> Pase de acceso VIP, membresía exclusiva</li>
              </ul>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-2">🔄 ERC-1155 (Semi-Fungible)</h4>
              <p className="text-sm mb-2"><strong>Para:</strong> Combinar ambos tipos en un contrato</p>
              <ul className="text-sm space-y-1">
                <li>• <strong>Híbrido:</strong> Fungible y no fungible en un contrato</li>
                <li>• <strong>Eficiente:</strong> Múltiples tipos de tokens</li>
                <li>• <strong>Flexible:</strong> Cambiar entre fungible/no fungible</li>
                <li>• <strong>Ejemplo:</strong> Juego con items únicos y monedas</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">🤔 ¿Cómo decidir?</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>¿Escasez?</strong> ERC-721 si cada unidad debe ser única</li>
              <li>• <strong>¿Recompensas?</strong> ERC-20 si necesitas dividir recompensas</li>
              <li>• <strong>¿Complejo?</strong> ERC-1155 si necesitas ambos tipos</li>
              <li>• <strong>¿Simple?</strong> ERC-20 para la mayoría de protocolos nuevos</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🪙'
    });
  }, []);

  const openSupplyModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Por qué es importante el Supply Total?',
      description: 'Entiende cómo el suministro total afecta la escasez y valor de tus Artefactos.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">📊 Supply Total y Escasez</h4>
            <p className="text-sm">
              El <strong>Supply Total</strong> define cuántos Artefactos existirán jamás. Es la base de la escasez y valor económico de tu protocolo.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🎯 Factores a Considerar</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">👥</span>
                <span><strong>Tamaño de Comunidad:</strong> ¿Cuántas personas quieres que participen?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">💰</span>
                <span><strong>Modelo Económico:</strong> ¿Inflación controlada o suministro fijo?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">⏰</span>
                <span><strong>Crecimiento:</strong> ¿Cuánto crecerá tu comunidad en 5 años?</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">🎁</span>
                <span><strong>Distribución:</strong> ¿Cuántos para venta, equipo, tesorería?</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-400 mb-2">✅ Ejemplos de Supply</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Comunidad Pequeña (100-1,000):</strong> 10,000 - 100,000 tokens</li>
              <li>• <strong>Comunidad Mediana (1k-10k):</strong> 100,000 - 1,000,000 tokens</li>
              <li>• <strong>Comunidad Grande (10k+):</strong> 1,000,000 - 10,000,000 tokens</li>
              <li>• <strong>Protocolos Globales:</strong> 100,000,000+ tokens</li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-400 mb-2">⚠️ Errores Comunes</h4>
            <ul className="text-sm space-y-1">
              <li>• Supply demasiado grande = pérdida de valor por dilución</li>
              <li>• Supply demasiado pequeño = exclusividad excesiva</li>
              <li>• No considerar crecimiento futuro de la comunidad</li>
              <li>• Olvidar tokens para recompensas y tesorería</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Recomendaciones</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Calcula:</strong> Comunidad objetivo × tokens por persona</li>
              <li>• <strong>Reserva:</strong> 20-30% para recompensas futuras</li>
              <li>• <strong>Escala:</strong> Considera crecimiento exponencial</li>
              <li>• <strong>Equilibra:</strong> Accesibilidad vs. escasez de valor</li>
            </ul>
          </div>
        </div>
      ),
      icon: '📊'
    });
  }, []);

  const openCommunityOfferingModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Cuántos Artefactos ofrecer en esta ronda?',
      description: 'Entiende las fases de lanzamiento y por qué no ofrecer todo el supply inicial.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🚀 Estrategia de Fases</h4>
            <p className="text-sm">
              No ofrezcas todo el Supply Total en la primera ronda. Divide el lanzamiento en <strong>fases estratégicas</strong> para construir momentum y valor.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">📈 Ventajas de Múltiples Rondas</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">📊</span>
                <span><strong>Validación Progresiva:</strong> Prueba el producto con comunidad inicial</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">💰</span>
                <span><strong>Valor Creciente:</strong> Cada ronda a precio más alto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">🤝</span>
                <span><strong>Compromiso:</strong> Comunidad comprometida contribuye al crecimiento</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">🎯</span>
                <span><strong>Flexibilidad:</strong> Ajustar estrategia basado en feedback</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">📅 Ejemplo de Fases</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span><strong>Fase 1 - Lanzamiento:</strong></span>
                <span>10-20% del supply</span>
              </div>
              <div className="flex justify-between items-center">
                <span><strong>Fase 2 - Crecimiento:</strong></span>
                <span>20-30% del supply</span>
              </div>
              <div className="flex justify-between items-center">
                <span><strong>Fase 3 - Expansión:</strong></span>
                <span>30-40% del supply</span>
              </div>
              <div className="flex justify-between items-center">
                <span><strong>Reservas (Futuro):</strong></span>
                <span>20-30% del supply</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">⚖️ Factores de Decisión</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Riesgo del Proyecto:</strong> ¿Qué tan validado está tu protocolo?</li>
              <li>• <strong>Capital Necesario:</strong> ¿Cuánto necesitas realmente para lanzar?</li>
              <li>• <strong>Velocidad de Crecimiento:</strong> ¿Qué tan rápido puedes ejecutar?</li>
              <li>• <strong>Mercado:</strong> ¿Hay demanda probada o necesitas validación?</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">💡 Recomendaciones</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Primera Ronda:</strong> 10-25% del supply total</li>
              <li>• <strong>Precio Inicial:</strong> Accesible para comunidad early</li>
              <li>• <strong>Crecimiento:</strong> 2x precio mínimo por ronda</li>
              <li>• <strong>Comunicación:</strong> Explica claramente el roadmap de fases</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🚀'
    });
  }, []);

  const openLegalModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Por qué es importante tener una entidad legal?',
      description: 'Entiende la importancia de formalizar tu proyecto legalmente.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">⚖️ Importancia Legal</h4>
            <p className="text-sm">
              Una <strong>entidad legal formal</strong> es crucial para proteger tu proyecto, sus participantes y establecer credibilidad en el mercado.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-white">🛡️ Beneficios de tener entidad legal</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Protección Legal:</strong> Separa tus activos personales de los del proyecto</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Confianza:</strong> Demuestra seriedad y compromiso a inversores y comunidad</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Impuestos:</strong> Estructura clara para obligaciones fiscales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Contratos:</strong> Capacidad para celebrar acuerdos legales vinculantes</span>
              </li>
            </ul>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-blue-400 mb-2">🏢 Tipos de Entidades</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>LLC (Limited Liability Company):</strong> Protección limitada, flexible</li>
              <li>• <strong>Corporation:</strong> Más formal, atractiva para inversores institucionales</li>
              <li>• <strong>DAO (Decentralized Autonomous Organization):</strong> Modelo Web3 nativo</li>
              <li>• <strong>Foundation:</strong> Para proyectos sin fines de lucro</li>
            </ul>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">💡 Recomendaciones</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Jurisdicción:</strong> Delaware (USA) es popular por su marco legal favorable</li>
              <li>• <strong>Costo:</strong> $500-2,000 para constituir una LLC básica</li>
              <li>• <strong>Tiempo:</strong> 1-4 semanas dependiendo de la jurisdicción</li>
              <li>• <strong>Asesoría:</strong> Consulta con abogados especializados en Web3</li>
            </ul>
          </div>

          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-purple-400 mb-2">🤝 Ayuda de Pandora&apos;s</h4>
            <p className="text-sm">
              En <strong>Pandora&apos;s Finance</strong> podemos ayudarte a formalizar tu entidad legal, conectarte con abogados especializados en Web3 y guiarte en el proceso de constitución. No es obligatorio, pero muy recomendado para proyectos serios.
            </p>
          </div>
        </div>
      ),
      icon: '⚖️'
    });
  }, []);

  const openMonetizationModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: '¿Cómo elegir el modelo de monetización correcto?',
      description: 'Descubre diferentes estrategias para generar ingresos sostenibles.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">💰 Modelos de Monetización</h4>
            <p className="text-sm">
              El <strong>modelo de monetización</strong> define cómo tu protocolo genera ingresos para financiar las recompensas de utilidad y mantener la sostenibilidad a largo plazo.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">💳 Suscripciones con Artefactos</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Acceso Premium:</strong> Niveles de membresía con beneficios escalables</li>
                <li>• <strong>Renovación Anual:</strong> Pago recurrente por mantener acceso</li>
                <li>• <strong>Ventajas:</strong> Ingresos predecibles, retención de usuarios</li>
                <li>• <strong>Ejemplo:</strong> Gitcoin, Patreon</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">🔄 Tarifas por Uso del Servicio</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Transacciones:</strong> Comisión por cada operación en la plataforma</li>
                <li>• <strong>API Access:</strong> Tarifas por uso de servicios técnicos</li>
                <li>• <strong>Ventajas:</strong> Escalable, alineado con crecimiento</li>
                <li>• <strong>Ejemplo:</strong> Uniswap, OpenSea</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">🛒 Venta de Productos/Servicios</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>NFTs y Coleccionables:</strong> Arte digital, acceso exclusivo</li>
                <li>• <strong>Mercancía:</strong> Productos físicos relacionados con la marca</li>
                <li>• <strong>Servicios:</strong> Consultoría, desarrollo, soporte premium</li>
                <li>• <strong>Ejemplo:</strong> Bored Ape Yacht Club, Adidas</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">🎯 Factores para elegir</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Tipo de Utilidad:</strong> ¿Es acceso, gobernanza, o financiero?</li>
              <li>• <strong>Comunidad:</strong> ¿Qué está dispuesto a pagar tu público?</li>
              <li>• <strong>Escalabilidad:</strong> ¿Cómo crece el ingreso con el proyecto?</li>
              <li>• <strong>Sostenibilidad:</strong> ¿Genera valor continuo para holders?</li>
            </ul>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-orange-400 mb-2">⚖️ Combinación de Modelos</h4>
            <p className="text-sm">
              Muchos protocolos exitosos combinan múltiples fuentes de ingreso. Por ejemplo: suscripciones básicas + tarifas premium + ventas de NFTs exclusivos.
            </p>
          </div>
        </div>
      ),
      icon: '💰'
    });
  }, []);

  const openAdoptionModal = useCallback(() => {
    setInfoModal({
      isOpen: true,
      title: 'Estrategias de adopción para tu protocolo',
      description: 'Aprende a diseñar una estrategia efectiva de distribución inicial.',
      content: (
        <div className="space-y-4 text-gray-300">
          <div className="bg-lime-500/10 border border-lime-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-lime-400 mb-2">🎯 Estrategias de Adopción</h4>
            <p className="text-sm">
              La <strong>estrategia de adopción</strong> define cómo y a quién distribuyes inicialmente tus Artefactos, sentando las bases para el crecimiento sostenible de tu comunidad.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-blue-400 mb-2">💰 Venta Pública</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>IDO/IEO:</strong> Oferta inicial en exchange descentralizado</li>
                <li>• <strong>Preventa:</strong> Venta privada a precio reducido</li>
                <li>• <strong>Mercado Secundario:</strong> Trading libre después del lanzamiento</li>
                <li>• <strong>Cuándo usar:</strong> Proyectos con producto validado</li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-green-400 mb-2">🏆 Asignación por Mérito (Labor)</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Contribuciones:</strong> Recompensar trabajo realizado en el proyecto</li>
                <li>• <strong>Staking de otros tokens:</strong> Holders de protocolos relacionados</li>
                <li>• <strong>Cuándo usar:</strong> Construir comunidad comprometida desde el inicio</li>
                <li>• <strong>Ejemplo:</strong> Airdrops basados en actividad on-chain</li>
              </ul>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-purple-400 mb-2">🎟️ Whitelist (Lista Blanca)</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Criterios de Elegibilidad:</strong> Actividad en Discord, Twitter, etc.</li>
                <li>• <strong>Raffles:</strong> Sorteos entre participantes activos</li>
                <li>• <strong>Cuándo usar:</strong> Controlar distribución inicial</li>
                <li>• <strong>Ventaja:</strong> Comunidad pre-comprometida</li>
              </ul>
            </div>

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <h4 className="font-semibold text-orange-400 mb-2">🎁 Airdrop Estratégico</h4>
              <ul className="text-sm space-y-1">
                <li>• <strong>Holders de NFTs:</strong> Propietarios de colecciones específicas</li>
                <li>• <strong>Usuarios de dApps:</strong> Personas activas en protocolos similares</li>
                <li>• <strong>Cuándo usar:</strong> Crear awareness masivo rápidamente</li>
                <li>• <strong>Desventaja:</strong> Alto costo, menor compromiso</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-400 mb-2">📊 Factores de Éxito</h4>
            <ul className="text-sm space-y-1">
              <li>• <strong>Alineación:</strong> La estrategia debe reflejar los valores del proyecto</li>
              <li>• <strong>Transparencia:</strong> Criterios claros y verificables</li>
              <li>• <strong>Inclusividad:</strong> Oportunidades para diferentes niveles de compromiso</li>
              <li>• <strong>Sostenibilidad:</strong> Plan para crecimiento post-lanzamiento</li>
            </ul>
          </div>
        </div>
      ),
      icon: '🎯'
    });
  }, []);

  // Navegación
  const nextStep = useCallback(async () => {
    if (!currentQuestion) return;
    const isValid = await trigger(currentQuestion.id);
    if (isValid && currentStep < formQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentQuestion, currentStep, trigger]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  // Soporte de teclado
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { // Shift+Enter para nueva línea en textarea
        e.preventDefault();
        void nextStep(); // Ignorar promesa ya que es navegación
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextStep]);

  // Auto-focus en el input del paso actual
  useEffect(() => {
    if (currentQuestion) {
      // Pequeño delay para asegurar que el DOM esté listo después de la animación
      const timer = setTimeout(() => {
        const inputElement = document.querySelector(`[name="${currentQuestion.id}"]`);
        if (inputElement && 'focus' in inputElement) {
          (inputElement as HTMLElement).focus();
          // Para inputs de texto, posicionar el cursor al final
          if (inputElement.tagName === 'INPUT' || inputElement.tagName === 'TEXTAREA') {
            const input = inputElement as HTMLInputElement | HTMLTextAreaElement;
            input.setSelectionRange(input.value.length, input.value.length);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [currentStep, currentQuestion]);

  // Manejador de errores de validación
  const onValidationErrors = (errors: FieldErrors<ProjectFormData>) => {
    console.error("Errores de validación del formulario:", errors);
    const errorFields = Object.keys(errors).join(", ");
    alert(`Hay errores en el formulario. Revisa los campos: ${errorFields}`);
  };

  // Submit handler - Actualizado para coincidir con multi-step-form
  const onSubmit = async (data: ProjectFormData) => {
    // Re-validate to ensure type safety and satisfy the linter (como en multi-step-form)
    const validation = projectSchema.safeParse(data);
    if (!validation.success) {
      console.error("Final submit data failed validation:", validation.error.flatten());
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Error de Validación',
        description: 'Los datos del formulario no son válidos. Revisa la información e intenta nuevamente.',
        content: null,
      });
      return;
    }
    const safeData = validation.data; // Use this safely typed data

    console.log('🚀 onSubmit called with validated data:', safeData);

    // Mostrar modal de loading
    setResultModal({
      isOpen: true,
      type: 'loading',
      title: 'Enviando Aplicación',
      description: 'Estamos procesando tu solicitud. Esto puede tomar unos momentos...',
      content: null,
    });

    setIsSubmitting(true);

    const tokenDist = safeData.tokenDistribution ?? {};
    // Asegurar distribución válida para clientes (permitir suma de 100%) - como en multi-step-form
    const finalDistribution = {
      publicSale: (tokenDist as { publicSale?: number }).publicSale ?? 100,
      team: (tokenDist as { team?: number }).team ?? 0,
      treasury: (tokenDist as { treasury?: number }).treasury ?? 0,
      marketing: (tokenDist as { marketing?: number }).marketing ?? 0,
    };

    // Verificar suma para clientes públicos - como en multi-step-form
    const total = (finalDistribution.publicSale ?? 0) + (finalDistribution.team ?? 0) + (finalDistribution.treasury ?? 0) + (finalDistribution.marketing ?? 0);
    if (total > 100) {
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Error en Distribución de Tokens',
        description: 'La distribución total de tokens no puede exceder el 100%. Revisa los porcentajes.',
        content: null,
      });
      setIsSubmitting(false);
      return;
    }
    if (total === 0) {
      // Si suma es 0, establecer publicSale al 100% por defecto
      finalDistribution.publicSale = 100;
    }

    // Preparar datos con valores por defecto para campos opcionales que el servidor requiere
    const submitData = {
      ...safeData,
      // Valores por defecto para campos opcionales que el servidor requiere
      title: safeData.title ?? 'Proyecto sin título',
      description: safeData.description ?? 'Descripción pendiente',
      businessCategory: safeData.businessCategory ?? 'other',
      estimatedApy: safeData.estimatedApy ? String(safeData.estimatedApy) : undefined, // Convertir a string como espera el servidor
      teamMembers: JSON.stringify(safeData.teamMembers ?? []),
      advisors: JSON.stringify(safeData.advisors ?? []),
      tokenDistribution: JSON.stringify(finalDistribution),
      status: "draft", // Los proyectos enviados desde el formulario conversacional empiezan como draft
      featured: false, // ✅ Featured debe ser manual, nunca automático
      // Convertir booleanos a strings para evitar errores de validación
      stakingRewardsEnabled: safeData.stakingRewardsEnabled ? "true" : "false",
      revenueSharingEnabled: safeData.revenueSharingEnabled ? "true" : "false",
      workToEarnEnabled: safeData.workToEarnEnabled ? "true" : "false",
      tieredAccessEnabled: safeData.tieredAccessEnabled ? "true" : "false",
      discountedFeesEnabled: safeData.discountedFeesEnabled ? "true" : "false",
      isMintable: safeData.isMintable ? "true" : "false",
      isMutable: safeData.isMutable ? "true" : "false",
      legalEntityHelp: safeData.legalEntityHelp ? "true" : "false"
    };

    console.log('📤 Enviando datos a API:', submitData);

    try {
      // Enviar a API
      const response = await fetch('/api/projects/utility-application', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        let errorMessage = "Error al guardar el proyecto";
        let errorData: unknown = null;

        try {
          const responseText = await response.text();
          console.log('Response text:', responseText);
          errorData = JSON.parse(responseText);
          errorMessage = (errorData as { message?: string }).message ?? errorMessage;
          console.log('Parsed error data:', errorData);
        } catch {
          errorMessage = `Error del servidor (${response.status}) - respuesta no válida`;
        }

        console.error("❌ Error del servidor:", errorData);
        throw new Error(errorMessage);
      }

      // La respuesta se usa solo para log, así que 'unknown' es seguro.
      const responseData: unknown = await response.json();
      console.log('✅ Success response:', responseData);

      // 🎮 TRIGGER EVENTO DE APLICACIÓN DE PROYECTO - usando el mismo método que multi-step-form
      const userWallet = account?.address?.toLowerCase();
      if (userWallet) {
        try {
          console.log('🎮 Triggering project application event for user:', userWallet);
          // Importar la función del service directamente
          const { trackGamificationEvent } = await import('@/lib/gamification/service');

          await trackGamificationEvent(
            userWallet,
            'project_application_submitted',
            {
              projectTitle: safeData.title,
              projectId: (responseData as { id?: string | number })?.id?.toString() ?? 'unknown',
              businessCategory: safeData.businessCategory,
              targetAmount: safeData.targetAmount,
              isPublicApplication: true,
              submissionType: 'utility_form_draft'
            }
          );
          console.log('✅ Gamification event PROJECT_APPLICATION_SUBMITTED tracked successfully');
        } catch (gamificationError) {
          console.warn('⚠️ Gamification event tracking failed:', gamificationError);
          // No bloquear el flujo si falla la gamificación
        }
      }

      // Mostrar modal de éxito
      setResultModal({
        isOpen: true,
        type: 'success',
        title: '¡Aplicación Enviada Exitosamente! 🎉',
        description: 'Tu proyecto ha sido guardado como borrador y recibirás 50 tokens por tu primera aplicación.',
        content: null,
      });
    } catch (error) {
      console.error('❌ Error al enviar:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido al enviar el formulario';

      // Mostrar modal de error
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Error al Enviar Aplicación',
        description: message,
        content: null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar componente de input basado en el tipo
  const renderInputComponent = (question: FormQuestion) => {
    const baseProps = { name: question.id, placeholder: question.placeholder };

    switch (question.component) {
      case 'text-input': {
        // Agregar enlaces a modales para pasos específicos
        let onHelpClick;
        if (question.id === 'legalStatus') {
          onHelpClick = openLegalModal; // Paso 28: estatus legal
        }
        return <TextInput {...baseProps} maxLength={question.maxLength} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'textarea-input': {
        // Agregar enlaces a modales para pasos específicos
        let onHelpClick;
        if (question.id === 'whitepaperUrl') {
          onHelpClick = openMechanicModal; // Paso 8: mecánica de utilidad
        } else if (question.id === 'fundUsage') {
          onHelpClick = openBenefitModal; // Paso 13: beneficio tangible
        } else if (question.id === 'lockupPeriod') {
          onHelpClick = openUtilityModal; // Paso 14: utilidad continua
        } else if (question.id === 'applicantName') {
          onHelpClick = openWorkToEarnModal; // Paso 15: sistema Work-to-Earn
        }
        // Paso 16 (isMintable) no tiene "Más info"
        return <TextareaInput {...baseProps} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'select-input': {
        // Agregar enlaces a modales para pasos específicos
        let onHelpClick;
        if (question.id === 'tokenType') {
          onHelpClick = openTokenTypeModal; // Paso 18: tipos de artefactos
        } else if (question.id === 'yieldSource') {
          onHelpClick = openMechanicModal; // Paso 22: estructura de recompensa (reutilizar modal)
        }
        return <SelectInput {...baseProps} options={question.options} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'number-input': {
        // Agregar enlaces a modales para pasos específicos
        let onHelpClick;
        if (question.id === 'totalTokens') {
          onHelpClick = openSupplyModal; // Paso 19: supply total
        } else if (question.id === 'tokensOffered') {
          onHelpClick = openCommunityOfferingModal; // Paso 20: cantidad a ofrecer
        }
        return <NumberInput {...baseProps} relatedField={question.relatedField} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'url-input':
        return <UrlInput {...baseProps} info={question.info} />;
      case 'file-input':
        return <FileInput {...baseProps} accept="image/png,image/jpeg,image/svg+xml" info={question.info} />;
      case 'checkbox-input':
        return <CheckboxInput name={question.id} info={question.info} label={question.label} />;
      case 'recurring-rewards-input':
        return <RecurringRewardsInput />;
      default:
        return <TextInput {...baseProps} />;
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Lanza tu Protocolo de Utilidad
          </h1>
          <p className="text-lime-200 font-mono">
            Diseña las reglas de tu Creación y activa a tu comunidad.
          </p>
        </div>

        {/* Barra de Progreso */}
        <ProgressBar currentStep={currentStep} totalSteps={formQuestions.length} />

        {/* Formulario */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit, onValidationErrors)} className="space-y-8">
            {/* Contenedor de preguntas con animación */}
            <div className="relative min-h-[420px] max-h-[60vh] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute w-full"
                >
                  {currentStep === formQuestions.length - 1 ? (
                    /* Declaración de aceptación en el último paso */
                    <div className="space-y-6">
                      <div className="text-white text-lg font-medium leading-relaxed mb-6">
                        Declaración del Creador (Aceptación de Términos SaaS): Declaro que toda la información proporcionada es precisa. Entiendo y acepto que Pandora&apos;s Finance actúa exclusivamente como un proveedor de infraestructura SaaS &apos;no-code&apos;, y que soy el único responsable de la estructura legal, la promesa de utilidad y la gestión de la comunidad de mi &apos;Piterillos&apos; y sus Artefactos.
                      </div>

                      {/* Checkbox de aceptación */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={acceptanceChecked}
                          onChange={(e) => {
                            setAcceptanceChecked(e.target.checked);
                            setValue('verificationAgreement', e.target.checked ? 'accepted' : '');
                          }}
                          className="mt-1 w-5 h-5 text-lime-400 bg-zinc-800 border-zinc-600 rounded focus:ring-lime-400 focus:ring-2"
                        />
                        <span className="text-white text-base leading-relaxed">
                          Acepto los{" "}
                          <button
                            type="button"
                            onClick={openModal}
                            className="text-lime-400 underline hover:text-lime-300 transition-colors"
                          >
                            términos y condiciones
                          </button>{" "}
                          del servicio SaaS de Pandora&apos;s Finance
                        </span>
                      </div>
                    </div>
                  ) : currentQuestion ? (
                    <div className="space-y-6">
                      {currentQuestion.component !== 'checkbox-input' && (
                        <label className={`block font-bold text-white leading-tight ${
                          currentQuestion.id === 'recurringRewards'
                            ? 'text-lg md:text-xl'
                            : 'text-2xl md:text-3xl'
                        }`}>
                          {getPersonalizedLabel(currentQuestion.label, projectTitle)}
                        </label>
                      )}

                      {renderInputComponent(currentQuestion)}
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>



            {/* Navegación */}
            <div className="flex justify-between items-center pt-8">
              <Button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 0}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>

              {currentStep === formQuestions.length - 1 ? (
                <Button
                  type="submit"
                  disabled={isSubmitting || !acceptanceChecked}
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold px-8 py-3 rounded-xl hover:from-lime-400 hover:to-emerald-400 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Aceptar Términos y Enviar Aplicación
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold px-8 py-3 rounded-xl hover:from-lime-400 hover:to-emerald-400 transition-all duration-300 flex items-center gap-2"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Indicador de paso */}
            <div className="text-center text-zinc-500 text-sm">
              Paso {currentStep + 1} de {formQuestions.length}
            </div>
          </form>
        </FormProvider>

        {/* Modal Informativo */}
        <InfoModal
          isOpen={infoModal.isOpen}
          onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
          title={infoModal.title}
          description={infoModal.description}
          content={infoModal.content}
          icon={infoModal.icon}
        />

        {/* Modal de Resultado (Loading/Success/Error) */}
        <ResultModal
          isOpen={resultModal.isOpen}
          type={resultModal.type}
          title={resultModal.title}
          description={resultModal.description}
          content={resultModal.content}
          icon={resultModal.icon}
        />
      </div>
    </div>
  );
}
