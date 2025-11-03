"use client";
import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

// Schema de validación completo basado en DB schema - Versión Utility
const projectSchema = z.object({
  // Campos requeridos - Identidad de la Creación
  title: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(256, "El nombre es demasiado largo"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
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
  ]),

  // Campos opcionales - Identidad
  tagline: z.string().max(140, "El eslogan es demasiado largo").optional(),
  logoUrl: z.string().url("URL de logo inválida").optional().or(z.literal("")),
  coverPhotoUrl: z.string().url("URL de portada inválida").optional().or(z.literal("")),
  videoPitch: z.string().url("URL de video inválida").max(512).optional().or(z.literal("")),

  // Comunidad y Conexiones
  website: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  whitepaperUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  twitterUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  discordUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  telegramUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL inválida").max(512).optional().or(z.literal("")),

  // Recursos y Artefactos
  targetAmount: z.number().min(1, "El monto objetivo debe ser mayor a 1").optional(),
  tokenType: z.enum(['erc20', 'erc721', 'erc1155']).optional(),
  totalTokens: z.number().min(1, "Debe haber al menos 1 token").optional(),
  tokensOffered: z.number().min(1, "Debe ofrecer al menos 1 token").optional(),
  tokenPriceUsd: z.number().min(0.01, "El precio debe ser mayor a 0.01 USD").optional(),
  estimatedApy: z.string().max(50).optional(),
  yieldSource: z.enum(['rental_income', 'capital_appreciation', 'dividends', 'royalties', 'other']).optional(),
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
  valuationDocumentUrl: z.string().url("URL inválida").optional().or(z.literal("")),
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

  // Verificación Final
  verificationAgreement: z.boolean().refine(val => val === true, "Debes aceptar la declaración del creador"),
});

// Tipos
type ProjectFormData = z.infer<typeof projectSchema>;

interface FormQuestion {
  id: keyof ProjectFormData;
  label: string;
  placeholder?: string;
  component: 'text-input' | 'textarea-input' | 'select-input' | 'number-input' | 'url-input';
  options?: { value: string; label: string }[];
  required?: boolean;
  maxLength?: number;
}

// Array de preguntas del formulario conversacional - Versión Utility Completa
const formQuestions: FormQuestion[] = [
  // SECCIÓN 1: La Identidad de tu Creación
  {
    id: 'title',
    label: '¡Hola, Creador! Estamos emocionados por ver tu idea. ¿Cómo se llama esta nueva Creación?',
    placeholder: 'Ej: Pandora\'s Finance',
    component: 'text-input',
    required: true,
    maxLength: 256,
  },
  {
    id: 'tagline',
    label: '¡Gran nombre! ¿Cuál es la frase que captura la esencia de tu Creación en menos de 140 caracteres?',
    placeholder: 'Ej: Tokenizando el futuro',
    component: 'text-input',
    maxLength: 140,
  },
  {
    id: 'description',
    label: 'Cuéntanos la historia. ¿Qué problema resuelve tu Creación y cómo beneficiará a la Comunidad de Pandora\'s?',
    placeholder: 'Describe tu visión, el problema que resuelves y cómo lo haces...',
    component: 'textarea-input',
    required: true,
  },
  {
    id: 'businessCategory',
    label: 'Para ayudar a la Comunidad a descubrirla, ¿en qué categoría clasificarías tu Creación?',
    component: 'select-input',
    options: [
      { value: 'residential_real_estate', label: 'Bienes Raíces Residenciales' },
      { value: 'commercial_real_estate', label: 'Bienes Raíces Comerciales' },
      { value: 'tech_startup', label: 'Tech Startup' },
      { value: 'renewable_energy', label: 'Energías Renovables' },
      { value: 'art_collectibles', label: 'Arte y Coleccionables' },
      { value: 'intellectual_property', label: 'Propiedad Intelectual' },
      { value: 'defi', label: 'DeFi (Finanzas Descentralizadas)' },
      { value: 'gaming', label: 'Gaming y NFTs de Juegos' },
      { value: 'metaverse', label: 'Metaverso y Real Estate Virtual' },
      { value: 'music_audio', label: 'Música y NFTs de Audio' },
      { value: 'sports_fan_tokens', label: 'Deportes y Fan Tokens' },
      { value: 'education', label: 'Educación y Aprendizaje' },
      { value: 'healthcare', label: 'Salud y Biotecnología' },
      { value: 'supply_chain', label: 'Cadena de Suministro' },
      { value: 'infrastructure', label: 'Infraestructura y DAO Tools' },
      { value: 'social_networks', label: 'Redes Sociales Web3' },
      { value: 'carbon_credits', label: 'Créditos de Carbono' },
      { value: 'insurance', label: 'Seguros Paramétricos' },
      { value: 'prediction_markets', label: 'Mercados de Predicción' },
      { value: 'other', label: 'Otro' },
    ],
    required: true,
  },
  {
    id: 'logoUrl',
    label: 'Hazla visual. Sube el Artefacto visual que represente tu Creación (tu logo).',
    placeholder: 'https://...',
    component: 'url-input',
  },
  {
    id: 'coverPhotoUrl',
    label: '¿Tienes una imagen de portada que capture el espíritu de tu Creación?',
    placeholder: 'https://...',
    component: 'url-input',
  },
  {
    id: 'videoPitch',
    label: '¿Tienes un video (YouTube/Vimeo) que muestre el alma de tu Creación?',
    placeholder: 'https://...',
    component: 'url-input',
  },

  // SECCIÓN 2: Conecta a tu Comunidad
  {
    id: 'website',
    label: '¿Dónde puede la Comunidad aprender más sobre tu Creación?',
    placeholder: 'https://tusitioweb.com',
    component: 'url-input',
  },
  {
    id: 'whitepaperUrl',
    label: '¿Tienes un documento de visión o litepaper?',
    placeholder: 'https://...',
    component: 'url-input',
  },
  {
    id: 'twitterUrl',
    label: '¿Cuál es tu cuenta de X (Twitter)?',
    placeholder: 'https://twitter.com/...',
    component: 'url-input',
  },
  {
    id: 'discordUrl',
    label: '¿Dónde está tu comunidad en Discord?',
    placeholder: 'https://discord.gg/...',
    component: 'url-input',
  },
  {
    id: 'telegramUrl',
    label: '¿Tienes un grupo de Telegram?',
    placeholder: 'https://t.me/...',
    component: 'url-input',
  },
  {
    id: 'linkedinUrl',
    label: '¿Cuál es tu perfil de LinkedIn?',
    placeholder: 'https://linkedin.com/in/...',
    component: 'url-input',
  },

  // SECCIÓN 3: Recursos y Artefactos
  {
    id: 'targetAmount',
    label: 'Para que esta Creación cobre vida, ¿cuántos Recursos (en USD) necesita recaudar de la comunidad en esta ronda?',
    placeholder: 'Ej: 100000',
    component: 'number-input',
  },
  {
    id: 'tokenType',
    label: '¿Cómo planeas representar la participación en tu Creación? (Tipo de Artefacto digital)',
    component: 'select-input',
    options: [
      { value: 'erc20', label: 'Fungible (ERC-20)' },
      { value: 'erc721', label: 'No Fungible (ERC-721/NFT)' },
      { value: 'erc1155', label: 'Semi-Fungible (ERC-1155)' },
    ],
  },
  {
    id: 'totalTokens',
    label: 'Definamos los Artefactos. ¿Cuántos tokens existirán en total (Supply Total)?',
    placeholder: 'Ej: 10000000',
    component: 'number-input',
  },
  {
    id: 'tokensOffered',
    label: '¿Cuántos Artefactos ofrecerás a la comunidad en esta ronda?',
    placeholder: 'Ej: 1000000',
    component: 'number-input',
  },
  {
    id: 'tokenPriceUsd',
    label: '¿Cuál será el precio (en USD) de cada Artefacto durante la recaudación?',
    placeholder: 'Ej: 0.10',
    component: 'number-input',
  },
  {
    id: 'estimatedApy',
    label: '¿Cuál es el porcentaje de Recompensa por Utilidad que estimas generará anualmente?',
    placeholder: 'Ej: 15%',
    component: 'text-input',
    maxLength: 50,
  },
  {
    id: 'yieldSource',
    label: '¿De dónde provendrán estas recompensas de utilidad?',
    component: 'select-input',
    options: [
      { value: 'rental_income', label: 'Rentas/Ingresos por alquiler' },
      { value: 'capital_appreciation', label: 'Valorización del capital' },
      { value: 'dividends', label: 'Dividendos' },
      { value: 'royalties', label: 'Regalías' },
      { value: 'other', label: 'Otros' },
    ],
  },
  {
    id: 'fundUsage',
    label: '¿Cómo se utilizarán los Recursos recaudados? Sé transparente.',
    placeholder: 'Ej: 40% desarrollo, 30% marketing, 20% operaciones, 10% tesorería...',
    component: 'textarea-input',
  },
  {
    id: 'lockupPeriod',
    label: '¿Existirá un periodo de bloqueo para los Artefactos del equipo o participantes iniciales?',
    placeholder: 'Ej: 12 meses',
    component: 'text-input',
    maxLength: 100,
  },

  // SECCIÓN 4: El Equipo y la Gobernanza
  {
    id: 'applicantName',
    label: '¿Cuál es tu nombre completo?',
    placeholder: 'Ej: Juan Pérez',
    component: 'text-input',
    required: true,
  },
  {
    id: 'applicantPosition',
    label: '¿Cuál es tu cargo en el proyecto?',
    placeholder: 'Ej: Fundador y CEO',
    component: 'text-input',
  },
  {
    id: 'applicantEmail',
    label: '¿Cuál es tu email de contacto?',
    placeholder: 'tu@email.com',
    component: 'text-input',
    required: true,
  },
  {
    id: 'applicantPhone',
    label: '¿Cuál es tu número de teléfono? (opcional)',
    placeholder: '+1 234 567 8900',
    component: 'text-input',
    maxLength: 50,
  },
  {
    id: 'treasuryAddress',
    label: '¿Cuál es la dirección de la Tesorería donde se recibirán los Recursos de la comunidad?',
    placeholder: '0x... (Recomendamos una Gnosis Safe)',
    component: 'text-input',
  },

  // SECCIÓN 5: Confianza y Transparencia
  {
    id: 'legalStatus',
    label: '¿Cuál es el estatus legal de tu Creación y en qué jurisdicción opera?',
    placeholder: 'Ej: LLC en Delaware, USA',
    component: 'text-input',
  },
  {
    id: 'fiduciaryEntity',
    label: '¿Existe una entidad fiduciaria que respalde los activos del mundo real (RWA)?',
    placeholder: 'Ej: Custodia institucional certificada',
    component: 'text-input',
    maxLength: 256,
  },
  {
    id: 'valuationDocumentUrl',
    label: 'Sube los documentos que respalden la valuación de tu proyecto.',
    placeholder: 'https://...',
    component: 'url-input',
  },
  {
    id: 'dueDiligenceReportUrl',
    label: '¿Tienes algún reporte de due diligence que compartir?',
    placeholder: 'https://...',
    component: 'url-input',
  },

  // SECCIÓN 6: Parámetros Técnicos
  {
    id: 'isMintable',
    label: '¿El contrato podrá crear (mintear) más Artefactos después del lanzamiento?',
    component: 'select-input',
    options: [
      { value: 'true', label: 'Sí' },
      { value: 'false', label: 'No' },
    ],
  },
  {
    id: 'isMutable',
    label: '¿Los metadatos de los Artefactos podrán ser modificados después de su creación?',
    component: 'select-input',
    options: [
      { value: 'true', label: 'Sí' },
      { value: 'false', label: 'No' },
    ],
  },
  {
    id: 'updateAuthorityAddress',
    label: '¿Qué dirección tendrá la autoridad para administrar el contrato?',
    placeholder: '0x...',
    component: 'text-input',
  },

  // SECCIÓN 7: Verificación Final
  {
    id: 'verificationAgreement',
    label: 'Declaración del Creador: Declaro que toda la información es veraz y entiendo que la comunidad de Pandora\'s confiará en estos datos para participar en esta Creación.',
    component: 'select-input',
    options: [
      { value: 'true', label: 'Acepto y declaro' },
    ],
    required: true,
  },
];

// Componentes de Input Personalizados
function TextInput({ name, placeholder, maxLength }: { name: string; placeholder?: string; maxLength?: number }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <input
        {...register(name)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors"
      />
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
}

function TextareaInput({ name, placeholder }: { name: string; placeholder?: string }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <textarea
        {...register(name)}
        placeholder={placeholder}
        rows={4}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors resize-none"
      />
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
}

function SelectInput({ name, options }: { name: string; options?: { value: string; label: string }[] }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <select
        {...register(name)}
        className="w-full bg-zinc-800/0 border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white text-lg transition-colors"
      >
        <option value="">Selecciona una opción...</option>
        {options?.map((option) => (
          <option key={option.value} value={option.value} className="bg-zinc-800/0">
            {option.label}
          </option>
        ))}
      </select>
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
}

function NumberInput({ name, placeholder }: { name: string; placeholder?: string }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <input
        {...register(name, { valueAsNumber: true })}
        type="number"
        placeholder={placeholder}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors"
      />
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
}

function UrlInput({ name, placeholder }: { name: string; placeholder?: string }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <input
        {...register(name)}
        type="url"
        placeholder={placeholder}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors"
      />
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm"
        >
          {errors[name]?.message as string}
        </motion.p>
      )}
    </div>
  );
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

  const methods = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
  });

  const { trigger, handleSubmit } = methods;
  const currentQuestion = formQuestions[currentStep];

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

  // Submit handler
  const onSubmit = (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      console.log('📝 Formulario completado:', data);
      // Aquí irá la lógica de envío a la API
      alert('¡Formulario enviado exitosamente! 🎉');
    } catch (error) {
      console.error('❌ Error al enviar:', error);
      alert('Error al enviar el formulario. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar componente de input basado en el tipo
  const renderInputComponent = (question: FormQuestion) => {
    const baseProps = { name: question.id, placeholder: question.placeholder };

    switch (question.component) {
      case 'text-input':
        return <TextInput {...baseProps} maxLength={question.maxLength} />;
      case 'textarea-input':
        return <TextareaInput {...baseProps} />;
      case 'select-input':
        return <SelectInput {...baseProps} options={question.options} />;
      case 'number-input':
        return <NumberInput {...baseProps} />;
      case 'url-input':
        return <UrlInput {...baseProps} />;
      default:
        return <TextInput {...baseProps} />;
    }
  };

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Crear Proyecto de Utilidad
          </h1>
          <p className="text-zinc-400">
            Responde las preguntas paso a paso para configurar tu protocolo
          </p>
        </div>

        {/* Barra de Progreso */}
        <ProgressBar currentStep={currentStep} totalSteps={formQuestions.length} />

        {/* Formulario */}
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Contenedor de preguntas con animación */}
            <div className="relative h-64 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ x: '100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute w-full"
                >
                  {currentQuestion && (
                    <div className="space-y-6">
                      <label className="block text-2xl md:text-3xl font-bold text-white leading-tight">
                        {currentQuestion.label}
                      </label>

                      {renderInputComponent(currentQuestion)}
                    </div>
                  )}
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
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold px-8 py-3 rounded-xl hover:from-lime-400 hover:to-emerald-400 transition-all duration-300 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Aplicación
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
      </div>
    </div>
  );
}
