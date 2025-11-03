"use client";
import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import Image from 'next/image';
import { useActiveAccount } from 'thirdweb/react';
// 🎮 IMPORTAR EVENTOS DE GAMIFICACIÓN
import { gamificationEngine, EventType } from "@pandoras/gamification";

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
  applicantWalletAddress: z.string().optional(),

  // Verificación Final
  verificationAgreement: z.union([z.boolean(), z.string()]).transform((val) => {
    if (typeof val === 'string') return val === 'true';
    return val;
  }).refine(val => val === true, "Debes aceptar la declaración del creador"),
});

// Tipos
type ProjectFormData = z.infer<typeof projectSchema>;

interface FormQuestion {
  id: keyof ProjectFormData;
  label: string;
  placeholder?: string;
  component: 'text-input' | 'textarea-input' | 'select-input' | 'number-input' | 'url-input' | 'file-input';
  options?: { value: string; label: string }[];
  required?: boolean;
  maxLength?: number;
  info?: string;
  relatedField?: string;
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
    placeholder: 'Haz click para seleccionar tu logo',
    component: 'file-input',
  },
  {
    id: 'coverPhotoUrl',
    label: '¿Tienes una imagen de portada que capture el espíritu de tu Creación?',
    placeholder: 'Haz click para seleccionar tu imagen de portada',
    component: 'file-input',
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
    component: 'select-input',
    options: [
      { value: 'not_sure', label: 'Aún no estoy seguro(a)' },
      { value: '50000', label: '$50,000' },
      { value: '100000', label: '$100,000' },
      { value: '250000', label: '$250,000' },
      { value: '500000', label: '$500,000' },
      { value: '1000000', label: '$1,000,000' },
      { value: 'custom', label: 'Otro monto (especificar)' },
    ],
    info: 'Esta estimación es crucial para determinar la viabilidad del proyecto. Un monto realista atrae inversores confiados, mientras que uno inflado puede generar desconfianza.',
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
    info: 'ERC-20: Tokens intercambiables ideales para gobernanza y recompensas. ERC-721: NFTs únicos perfectos para membresías exclusivas. ERC-1155: Combinación de ambos para mayor flexibilidad.',
  },
  {
    id: 'totalTokens',
    label: 'Definamos los Artefactos. ¿Cuántos tokens existirán en total (Supply Total)?',
    placeholder: 'Ej: 10000000',
    component: 'number-input',
    info: 'El supply total determina cuántos tokens existirán. Considera factores como: tamaño del mercado objetivo, estrategia de distribución, crecimiento proyectado y liquidez. Un supply muy grande puede diluir el valor, uno muy pequeño puede limitar la adopción.',
  },
  {
    id: 'tokensOffered',
    label: '¿Cuántos Artefactos ofrecerás a la comunidad en esta ronda?',
    placeholder: 'Ej: 1000000',
    component: 'number-input',
    info: 'Esta cantidad no puede exceder el Supply Total definido anteriormente. Considera tu estrategia de distribución: tokens para venta pública, equipo, advisors, tesorería, etc.',
    relatedField: 'totalTokens',
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
    info: 'El APY (Annual Percentage Yield) representa el rendimiento anual estimado que los holders recibirán. Se calcula basado en las recompensas de utilidad generadas por el protocolo. Sé conservador en tus estimaciones.',
  },
  {
    id: 'yieldSource',
    label: '¿De dónde provendrán estas recompensas de utilidad?',
    component: 'select-input',
    options: [
      { value: 'protocol_revenue', label: 'Ingresos del Protocolo (tarifas, comisiones)' },
      { value: 'staking_rewards', label: 'Recompensas de Staking' },
      { value: 'liquidity_mining', label: 'Liquidity Mining' },
      { value: 'governance_rewards', label: 'Recompensas de Gobernanza' },
      { value: 'utility_fees', label: 'Tarifas de Utilidad' },
      { value: 'revenue_sharing', label: 'Participación en Ingresos' },
      { value: 'other', label: 'Otros' },
    ],
  },
  {
    id: 'fundUsage',
    label: '¿Cómo se utilizarán los Recursos recaudados? Sé transparente.',
    placeholder: 'Ej: 40% desarrollo, 30% marketing, 20% operaciones, 10% tesorería...',
    component: 'textarea-input',
    info: 'La transparencia en el uso de fondos es fundamental en proyectos de utilidad. La comunidad confía en que los recursos se utilicen para crear valor real y sostenible.',
  },
  {
    id: 'lockupPeriod',
    label: '¿Existirá un periodo de bloqueo para los Artefactos del equipo o participantes iniciales?',
    placeholder: 'Ej: 12 meses',
    component: 'text-input',
    maxLength: 100,
    info: 'Los periodos de bloqueo generan confianza en la comunidad al demostrar compromiso a largo plazo. Equipos con tokens bloqueados muestran mayor alineación con el éxito del proyecto.',
  },

  // SECCIÓN 4: El Equipo y la Gobernanza
  {
    id: 'applicantName',
    label: '¿Cómo te llamas? Necesitamos tu nombre completo para el registro.',
    placeholder: 'Ej: Juan Pérez',
    component: 'text-input',
    required: true,
  },
  {
    id: 'applicantPosition',
    label: '¿Cuál es tu rol en este proyecto de utilidad?',
    placeholder: 'Ej: Fundador y CEO',
    component: 'text-input',
  },
  {
    id: 'applicantEmail',
    label: '¿Cuál es tu email? Lo usaremos para mantenerte al tanto del progreso.',
    placeholder: 'tu@email.com',
    component: 'text-input',
    required: true,
  },
  {
    id: 'applicantPhone',
    label: '¿Tienes un número de teléfono para contacto urgente? (opcional)',
    placeholder: '+1 234 567 8900',
    component: 'text-input',
    maxLength: 50,
  },
  {
    id: 'treasuryAddress',
    label: '¿Dónde quieres que se distribuyan los fondos recaudados de la comunidad?',
    placeholder: '0x...',
    component: 'text-input',
    info: 'Esta será la dirección principal donde se enviarán los fondos. Para mayor seguridad en proyectos de utilidad, considera usar una wallet multi-firma como Gnosis Safe.',
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
function TextInput({ name, placeholder, maxLength, info }: { name: string; placeholder?: string; maxLength?: number; info?: string }) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-2">
      <input
        {...register(name)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full bg-transparent border-b-2 border-zinc-600 focus:border-lime-400 outline-none py-3 text-white placeholder-zinc-500 text-lg transition-colors"
      />
      {info && (
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
          💡 {info}
        </p>
      )}
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

function NumberInput({ name, placeholder, maxValue, relatedField }: { name: string; placeholder?: string; maxValue?: number; relatedField?: string }) {
  const { register, formState: { errors }, watch } = useFormContext();

  // Watch the related field for validation
  const relatedValue = relatedField ? watch(relatedField) : undefined;

  return (
    <div className="space-y-2">
      <input
        {...register(name, {
          valueAsNumber: true,
          validate: (value) => {
            if (maxValue !== undefined && value > maxValue) {
              return `No puede exceder ${maxValue}`;
            }
            if (relatedField && relatedValue && value > relatedValue) {
              return `No puede exceder el valor del campo relacionado (${relatedValue})`;
            }
            return true;
          }
        })}
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

function FileInput({ name, accept = "image/*", placeholder }: { name: string; accept?: string; placeholder?: string }) {
  const { formState: { errors }, setValue, watch } = useFormContext();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Observar el valor actual del campo para mostrar feedback
  const currentValue = watch(name);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('📁 File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    setIsUploading(true);
    setUploadStatus('idle');

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      setUploadStatus('error');
      setIsUploading(false);
      alert("El archivo debe ser menor a 5MB");
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      setUploadStatus('error');
      setIsUploading(false);
      alert("Solo se permiten archivos de imagen (PNG, JPG, SVG)");
      return;
    }

    console.log('✅ File validation passed, reading file...');

    const reader = new FileReader();
    reader.onloadstart = () => {
      console.log('📖 FileReader started');
    };

    reader.onloadend = () => {
      console.log('✅ FileReader completed, setting value...');
      const result = reader.result as string;
      setValue(name, result);
      setUploadStatus('success');
      setIsUploading(false);
      console.log('✅ File uploaded successfully');
    };

    reader.onerror = () => {
      console.error('❌ FileReader error');
      setUploadStatus('error');
      setIsUploading(false);
      alert("Error al leer el archivo");
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        <div className={`w-full px-4 py-3 bg-zinc-800/50 border-2 border-dashed rounded-lg text-center transition-colors cursor-pointer ${
          uploadStatus === 'success'
            ? 'border-green-400 bg-green-500/5 text-green-400'
            : uploadStatus === 'error'
            ? 'border-red-400 bg-red-500/5 text-red-400'
            : isUploading
            ? 'border-yellow-400 bg-yellow-500/5 text-yellow-400'
            : 'border-zinc-600 text-zinc-400 hover:border-lime-400 hover:bg-lime-500/5'
        }`}>
          {isUploading ? (
            <>
              <div className="animate-spin w-5 h-5 mx-auto mb-1 border-2 border-current border-t-transparent rounded-full"></div>
              <p className="text-sm">Subiendo archivo...</p>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm">Archivo subido correctamente</p>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p className="text-sm">Error al subir archivo</p>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm">{placeholder ?? "Click para seleccionar archivo"}</p>
              <p className="text-xs mt-1">PNG/JPG hasta 5MB</p>
            </>
          )}
        </div>
      </div>

      {/* Mostrar preview si hay un archivo subido */}
      {currentValue && uploadStatus === 'success' && (
        <div className="mt-3 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700">
          <p className="text-xs text-zinc-400 mb-3 text-center">Vista Previa:</p>
          <div className="flex justify-center">
            <Image
              src={currentValue}
              alt="Preview"
              width={240}
              height={160}
              className="max-w-full h-auto max-h-40 object-contain rounded border border-zinc-600"
              unoptimized
            />
          </div>
        </div>
      )}

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
  const account = useActiveAccount();

  const methods = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    mode: 'onChange',
  });

  const { trigger, handleSubmit, watch } = methods;

  // Observar cambios en el título para personalización dinámica
  const projectTitle = watch('title') || 'tu Creación';

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

  // Submit handler
  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    console.log('📝 Formulario completado:', data);

    try {
      // Preparar datos para envío
      const tokenDist = data.tokenDistribution ?? {};
      const finalDistribution = {
        publicSale: (tokenDist as { publicSale?: number })?.publicSale ?? 0,
        team: (tokenDist as { team?: number })?.team ?? 0,
        treasury: (tokenDist as { treasury?: number })?.treasury ?? 0,
        marketing: (tokenDist as { marketing?: number })?.marketing ?? 0,
      };

      const submitData = {
        ...data,
        estimatedApy: data.estimatedApy ? String(data.estimatedApy) : undefined,
        teamMembers: JSON.stringify(data.teamMembers ?? []),
        advisors: JSON.stringify(data.advisors ?? []),
        tokenDistribution: JSON.stringify(finalDistribution),
        status: "draft", // Los proyectos enviados desde el formulario conversacional empiezan como draft
        featured: false
      };

      console.log('📤 Enviando datos a API:', submitData);

      // Enviar a API
      const response = await fetch('/api/projects/utility-application', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' })) as { message?: string };
        throw new Error(errorData.message ?? `Error del servidor (${response.status})`);
      }

      const responseData: unknown = await response.json();
      console.log('✅ Proyecto creado exitosamente:', responseData);

      // 🎮 TRIGGER EVENTO DE APLICACIÓN DE PROYECTO
      const userWallet = account?.address?.toLowerCase();
      if (userWallet) {
        try {
          console.log('🎮 Triggering project application event for user:', userWallet);
          // Usar el servicio de gamificación del dashboard que maneja la DB real
          const { trackGamificationEvent } = await import('@/lib/gamification/service');
          await trackGamificationEvent(
            userWallet,
            'project_application_submitted',
            {
              projectTitle: data.title,
              projectId: (responseData as { id?: string | number })?.id?.toString() ?? 'unknown',
              businessCategory: data.businessCategory,
              targetAmount: data.targetAmount,
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

      alert('¡Aplicación enviada exitosamente! 🎉\n\nTu proyecto ha sido guardado como borrador y recibirás 50 tokens por tu primera aplicación.');

    } catch (error) {
      console.error('❌ Error al enviar:', error);
      const message = error instanceof Error ? error.message : 'Error desconocido al enviar el formulario';
      alert(`Error al enviar el formulario: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderizar componente de input basado en el tipo
  const renderInputComponent = (question: FormQuestion) => {
    const baseProps = { name: question.id, placeholder: question.placeholder };

    switch (question.component) {
      case 'text-input':
        return <TextInput {...baseProps} maxLength={question.maxLength} info={question.info} />;
      case 'textarea-input':
        return <TextareaInput {...baseProps} />;
      case 'select-input':
        return <SelectInput {...baseProps} options={question.options} />;
      case 'number-input':
        return <NumberInput {...baseProps} relatedField={question.relatedField} />;
      case 'url-input':
        return <UrlInput {...baseProps} />;
      case 'file-input':
        return <FileInput {...baseProps} accept="image/png,image/jpeg,image/svg+xml" />;
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
                        {getPersonalizedLabel(currentQuestion.label, projectTitle)}
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
