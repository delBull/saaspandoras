"use client";
import { useState, useEffect } from "react";
import { useActiveAccount } from "thirdweb/react";
import type { FieldErrors } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; // FIX 1: Reactivado
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { SUPER_ADMIN_WALLET } from "@/lib/constants"; 
// 🎮 IMPORTAR EVENTOS DE GAMIFICACIÓN
import { gamificationEngine, EventType } from "@pandoras/gamification";
import { ProjectSection1 } from "./sections/ProjectSection1";
import { ProjectSection2 } from "./sections/ProjectSection2";
import { ProjectSection3 } from "./sections/ProjectSection3";
import { ProjectSection4 } from "./sections/ProjectSection4";
import { ProjectSection5 } from "./sections/ProjectSection5";
import { ProjectSection6 } from "./sections/ProjectSection6";
import { ProjectSection7 } from "./sections/ProjectSection7";

interface Project {
   id?: number;
   slug?: string;
   title?: string | null;
   description?: string | null;
   tagline?: string | null;
   businessCategory?: string | null;
   logoUrl?: string | null;
   coverPhotoUrl?: string | null;
   videoPitch?: string | null;
   website?: string | null;
   whitepaperUrl?: string | null;
   twitterUrl?: string | null;
   discordUrl?: string | null;
   telegramUrl?: string | null;
   linkedinUrl?: string | null;
   targetAmount?: string | number | null;
   totalValuationUsd?: string | number | null;
   tokenType?: string | null;
   totalTokens?: string | number | null;
   tokensOffered?: string | number | null;
   tokenPriceUsd?: string | number | null;
   estimatedApy?: string | null;
   yieldSource?: string | null;
   lockupPeriod?: string | null;
   fundUsage?: string | null;
   teamMembers?: unknown;
   advisors?: unknown;
   tokenDistribution?: unknown;
   contractAddress?: string | null;
   treasuryAddress?: string | null;
   legalStatus?: string | null;
   valuationDocumentUrl?: string | null;
   fiduciaryEntity?: string | null;
   dueDiligenceReportUrl?: string | null;
   isMintable?: boolean | string | null;
   isMutable?: boolean | string | null;
   updateAuthorityAddress?: string | null;
   applicantName?: string | null;
   applicantPosition?: string | null;
   applicantEmail?: string | null;
   applicantPhone?: string | null;
   applicantWalletAddress?: string | null;
   verificationAgreement?: boolean | string | null;
   createdAt?: Date;
   raisedAmount?: string | number | null;
   returnsPaid?: string | number | null;
   status?: string | null;
 }

// FIX 2: Definir tipos claros para los datos parseados
interface TeamMember {
  name: string;
  position: string;
  linkedin?: string;
}

interface Advisor {
  name: string;
  profile?: string;
}

interface TokenDistribution {
  publicSale?: number;
  team?: number;
  treasury?: number;
  marketing?: number;
}


// Componentes UI inline (reutilizados de ProjectForm)
const Button: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
}> = ({
  children,
  className = "",
  onClick,
  type = "button",
  disabled = false,
  variant = "primary"
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`
      px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
      ${variant === "primary" && "bg-lime-500 hover:bg-lime-600 text-zinc-900 shadow-lg hover:shadow-lime-500/25"}
      ${variant === "secondary" && "bg-zinc-700 hover:bg-zinc-600 text-white border border-zinc-600"}
      ${variant === "outline" && "border-2 border-lime-500 text-lime-400 hover:bg-lime-500 hover:text-zinc-900"}
      ${className}
    `}
  >
    {children}
  </button>
);

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="w-full bg-zinc-800 rounded-full h-2 mb-6">
    <div 
      className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full transition-all duration-300 ease-out" 
      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
    />
  </div>
);

const fullProjectSchema = z.object({
  // Sección 1: Identidad del Proyecto
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  tagline: z.string().max(140, "Máximo 140 caracteres.").optional(),
  businessCategory: z.string().optional(),
  logoUrl: z.string().optional(),
  coverPhotoUrl: z.string().optional(),
  videoPitch: z.string().optional(),

  // Sección 2: Enlaces Externos
  website: z.string().optional(),
  whitepaperUrl: z.string().optional(),
  twitterUrl: z.string().optional(),
  discordUrl: z.string().optional(),
  telegramUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),

  // Sección 3: Tokenomics
  targetAmount: z.number().min(0, "Debe ser un número positivo."),
  totalValuationUsd: z.number().min(0).optional(),
  tokenType: z.enum(["erc20", "erc721", "erc1155"]).optional(),
  totalTokens: z.number().min(1).optional(),
  tokensOffered: z.number().min(1).optional(),
  tokenPriceUsd: z.number().min(0).optional(),
  estimatedApy: z.union([z.string(), z.number()]).optional(),
  yieldSource: z.enum(["rental_income", "capital_appreciation", "dividends", "royalties", "other"]).optional(),
  lockupPeriod: z.string().optional(),
  fundUsage: z.string().optional(),

  // Sección 4: Equipo (con tipos estrictos)
  teamMembers: z.array(
    z.object({
      name: z.string(),
      position: z.string(),
      linkedin: z.string().optional()
    })
  ).optional(),
  advisors: z.array(
    z.object({
      name: z.string(),
      profile: z.string().optional()
    })
  ).optional(),
  tokenDistribution: z.object({
    publicSale: z.number().optional(),
    team: z.number().optional(),
    treasury: z.number().optional(),
    marketing: z.number().optional()
  }).optional(),

  contractAddress: z.string().optional(),
  treasuryAddress: z.string().optional(),

  // Sección 5: Due Diligence
  legalStatus: z.string().optional(),
  valuationDocumentUrl: z.string().optional(),
  fiduciaryEntity: z.string().optional(),
  dueDiligenceReportUrl: z.string().optional(),

  // Sección 6: Parámetros Técnicos
  isMintable: z.boolean().optional(),
  isMutable: z.boolean().optional(),
  updateAuthorityAddress: z.string().optional(),

  // Sección 7: Contacto
  applicantName: z.string().optional(),
  applicantPosition: z.string().optional(),
  applicantEmail: z.string().email("Email inválido").optional(),
  applicantPhone: z.string().optional(),
  applicantWalletAddress: z.string().optional(),
  verificationAgreement: z.boolean(),
});

export type FullProjectFormData = z.infer<typeof fullProjectSchema>;

interface MultiStepFormProps {
  project?: Project | null;
  isEdit?: boolean;
  apiEndpoint?: string;
  isPublic?: boolean;
}

export function MultiStepForm({
  project,
  isEdit = false,
  apiEndpoint = "/api/admin/projects",
  isPublic = false
}: MultiStepFormProps) {
  const router = useRouter();
  const account = useActiveAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);

  // FIX: Proper admin wallet verification instead of relying on isPublic prop
  const [isAdminUser, setIsAdminUser] = useState(true); // DEFAULT to TRUE for admin pages to avoid redirect race condition

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!account?.address) {
        setIsAdminUser(false);
        return;
      }

      const walletAddress = account.address.toLowerCase();
      const superAdminWallet = SUPER_ADMIN_WALLET.toLowerCase();

      // Check if it's super admin first (sync)
      if (walletAddress === superAdminWallet) {
        setIsAdminUser(true);
        return;
      }

      // Check if wallet exists in administrators table (async)
      try {
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Content-Type': 'application/json',
            'x-thirdweb-address': walletAddress,
            'x-wallet-address': walletAddress,
            'x-user-address': walletAddress
          }
        });
        if (response.ok) {
          const data = await response.json() as { isAdmin?: boolean; isSuperAdmin?: boolean };
          setIsAdminUser(Boolean(data.isAdmin ?? data.isSuperAdmin ?? false));
        } else {
          console.error('Admin verification failed:', response.status, response.statusText);
          setIsAdminUser(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminUser(false);
      }
    };

    // Only check if not public (public users skip admin verification)
    if (!isPublic) {
      void checkAdminStatus();
    }
  }, [account?.address, isPublic]);

  // Redirect non-admin users - add delay to allow verification to complete
  useEffect(() => {
    if (account?.address && isPublic !== null && !isAdminUser && !isPublic) {
      console.log('❌ Non-admin user attempting to access admin form, redirecting...');
      // Small delay to allow state updates
      setTimeout(() => router.push('/admin/dashboard'), 50);
    }
  }, [account?.address, isAdminUser, isPublic, router]);

  const totalSteps = 7;
  
  // Funciones de parseo seguro para inicializar el formulario
  function safeParseArray<T>(input: unknown): T[] {
    try {
      if (Array.isArray(input)) return input as T[];
      if (typeof input === "string" && input.trim().startsWith('[')) {
        const parsed = JSON.parse(input) as unknown;
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      }
    } catch (e) {
      console.warn("Failed to parse array from input:", input, e);
    }
    return [];
  }

  function safeParseObject<T extends object>(input: unknown, defaultVal: T): T {
    try {
      if (typeof input === "object" && input !== null && !Array.isArray(input)) {
        return input as T;
      }
      if (typeof input === "string" && input.trim().startsWith('{')) {
        try {
          const parsedValue = JSON.parse(input);
          if (parsedValue !== null && typeof parsedValue === 'object' && !Array.isArray(parsedValue)) {
            return parsedValue as T;
          }
        } catch {
          // Silently fail for invalid JSON
        }
      }
    } catch (error) {
      console.warn("Failed to parse object from input:", input, error);
    }
    return defaultVal;
  }

  // Formulario principal
  const methods = useForm<FullProjectFormData>({
    resolver: zodResolver(fullProjectSchema), // FIX 1: Reactivado
    mode: 'onBlur', // Cambiar de 'onChange' a 'onBlur' para permitir escritura sin validación inmediata
    defaultValues: {
      // Sección 1
      title: project?.title ?? "",  // Campo requerido - string vacío en lugar de undefined
      description: project?.description ?? "",  // Campo requerido - string vacío en lugar de undefined
      tagline: project?.tagline ?? undefined,
      businessCategory: project?.businessCategory ?? undefined,
      logoUrl: project?.logoUrl ?? undefined,
      coverPhotoUrl: project?.coverPhotoUrl ?? undefined,
      videoPitch: project?.videoPitch ?? undefined,

      // Sección 2
      website: project?.website ?? undefined,
      whitepaperUrl: project?.whitepaperUrl ?? undefined,
      twitterUrl: project?.twitterUrl ?? undefined,
      discordUrl: project?.discordUrl ?? undefined,
      telegramUrl: project?.telegramUrl ?? undefined,
      linkedinUrl: project?.linkedinUrl ?? undefined,

      // Sección 3
      targetAmount: Number(project?.targetAmount ?? 1),  // Requerido mínimo 1 para evitar 0 inválido
      totalValuationUsd: Number(project?.totalValuationUsd ?? 0),  // 0 es válido según schema
      tokenType: project?.tokenType as "erc20" | "erc721" | "erc1155" | undefined,
      totalTokens: Number(project?.totalTokens ?? 1000000),  // Dar valor creíble por defecto
      tokensOffered: Number(project?.tokensOffered ?? 1),
      tokenPriceUsd: Number(project?.tokenPriceUsd ?? 0),
      estimatedApy: project?.estimatedApy ?? undefined,
      yieldSource: project?.yieldSource as FullProjectFormData['yieldSource'],
      lockupPeriod: project?.lockupPeriod ?? undefined,
      fundUsage: project?.fundUsage ?? undefined,

      teamMembers: safeParseArray<TeamMember>(project?.teamMembers),
      advisors: safeParseArray<Advisor>(project?.advisors),
      tokenDistribution: safeParseObject<TokenDistribution>(project?.tokenDistribution, { publicSale: 0, team: 0, treasury: 0, marketing: 0 }),
      contractAddress: project?.contractAddress ?? undefined,
      treasuryAddress: project?.treasuryAddress ?? undefined,

      // Sección 5
      legalStatus: project?.legalStatus ?? undefined,
      valuationDocumentUrl: project?.valuationDocumentUrl ?? undefined,
      fiduciaryEntity: project?.fiduciaryEntity ?? undefined,
      dueDiligenceReportUrl: project?.dueDiligenceReportUrl ?? undefined,

      // Sección 6
      isMintable: Boolean(project?.isMintable ?? false),
      isMutable: Boolean(project?.isMutable ?? false),
      updateAuthorityAddress: project?.updateAuthorityAddress ?? undefined,

      // Sección 7
      applicantName: project?.applicantName ?? undefined,
      applicantPosition: project?.applicantPosition ?? undefined,
      applicantEmail: project?.applicantEmail ?? undefined,
      applicantPhone: project?.applicantPhone ?? undefined,
      applicantWalletAddress: project?.applicantWalletAddress ?? undefined,
      verificationAgreement: Boolean(project?.verificationAgreement ?? false),
    },
  });


  const { handleSubmit, watch, setValue, formState: { errors }, trigger } = methods;

  // Cargar progreso desde localStorage
  useEffect(() => {
    if (isEdit) return;

    const savedData = localStorage.getItem("pandoras-project-form");
    if (savedData) {
      try {
        const parsedData: unknown = JSON.parse(savedData); // Parse to unknown first
        
        // Validate the parsed data against a partial schema
        const validation = fullProjectSchema.partial().safeParse(parsedData);
        if (validation.success) {
          // If valid, iterate and set values. Types are now correct.
          Object.entries(validation.data).forEach(([key, value]) => {
            setValue(key as keyof FullProjectFormData, value);
          });
        }
        const savedStep = localStorage.getItem("pandoras-project-step");
        if (savedStep) {
          setCurrentStep(Number(savedStep));
        }
      } catch (e) {
         console.error("Failed to parse saved form data from localStorage", e);
         localStorage.removeItem("pandoras-project-form");
         localStorage.removeItem("pandoras-project-step");
      }
    }
  }, [setValue, isEdit, methods]);

  // Guardar progreso en localStorage
  useEffect(() => {
    if (isEdit) return;

    const subscription = watch(() => {
      const currentData = methods.getValues();
      localStorage.setItem("pandoras-project-form", JSON.stringify(currentData));
      localStorage.setItem("pandoras-project-step", currentStep.toString());
    });
    return () => subscription.unsubscribe();
  }, [watch, currentStep, isEdit, methods]);

  // Establecer dirección por defecto de la wallet conectada para updateAuthorityAddress
  const [hasSetDefaultAddress, setHasSetDefaultAddress] = useState(false);
  useEffect(() => {
    if (!hasSetDefaultAddress && account?.address && !project?.updateAuthorityAddress) {
      // Solo establece si no hay un valor proyecto existente y hay una wallet conectada
      setValue("updateAuthorityAddress", account.address);
      setHasSetDefaultAddress(true);
    }
  }, [account?.address, setValue, hasSetDefaultAddress, project?.updateAuthorityAddress]);

  // Auto-scroll to top cuando cambie el paso - MEJORADO PARA MODAL
  useEffect(() => {
    const scrollToTop = () => {
      try {
        // 1. Scroll del modal container (más específico para modal)
        const modalContainer = document.querySelector('.overflow-y-auto');
        if (modalContainer) {
          modalContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        // 2. Scroll del form container
        const formContainer = document.querySelector('form');
        if (formContainer) {
          formContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        // 3. Scroll del section container
        const sectionContainer = document.querySelector('section');
        if (sectionContainer) {
          sectionContainer.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        }

        // 4. Fallback: Scroll directo de window (por si acaso)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // 5. Scroll de document element
        document.documentElement.scrollTop = 0;

        // 6. Scroll de body
        document.body.scrollTop = 0;

        console.log('Auto-scroll ejecutado al paso:', currentStep);
      } catch (error) {
        console.warn('Error en auto-scroll:', error);
      }
    };

    // Ejecutar inmediatamente con múltiples estrategias
    requestAnimationFrame(scrollToTop);

    // También ejecutar después de delays progresivos por si el DOM no está listo
    const timeoutId1 = setTimeout(scrollToTop, 10);
    const timeoutId2 = setTimeout(scrollToTop, 50);
    const timeoutId3 = setTimeout(scrollToTop, 100);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [currentStep]);

  // Auto-redirección de modales después de 5 segundos con mejor manejo de sesión
  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
        // Usar navegación completa para preservar mejor la sesión
        if (isPublic) {
          // Para usuarios públicos, redirigir a "/" preservando la sesión
          router.push("/");
        } else {
          // Para admins, usar navegación normal
          router.push("/admin/dashboard");
          router.refresh();
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, isPublic, router]);

  useEffect(() => {
    if (showDraftModal) {
      const timer = setTimeout(() => {
        setShowDraftModal(false);
        router.push("/applicants");
        router.refresh();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showDraftModal, router]);

  // Navegación entre pasos
  const nextStep = async () => {
    const fieldsToValidate = Object.keys(getFieldsForStep(currentStep));

    // Para admins, siempre permitir avanzar sin validar
    if (isAdminUser) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
        // Immediate scroll to top after state change
        requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      }
      return;
    }

    // Para usuarios normales, validar los campos del paso actual
    const isStepValid = await trigger(fieldsToValidate as (keyof FullProjectFormData)[]);
    if (!isStepValid) {
      toast.error("Por favor completa los campos requeridos de esta sección.");
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      // Immediate scroll to top after state change
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Obtener campos por paso (para validación)
  const getFieldsForStep = (step: number) => {
    const fieldMap: Record<number, Partial<Record<keyof FullProjectFormData, true>>> = {
      1: { title: true, description: true, tagline: true, businessCategory: true, logoUrl: true, coverPhotoUrl: true, videoPitch: true },
      2: { website: true, whitepaperUrl: true, twitterUrl: true, discordUrl: true, telegramUrl: true, linkedinUrl: true },
      3: { targetAmount: true, totalValuationUsd: true, tokenType: true, totalTokens: true, tokensOffered: true, tokenPriceUsd: true, estimatedApy: true, yieldSource: true, lockupPeriod: true, fundUsage: true },
      4: { teamMembers: true, advisors: true, tokenDistribution: true, contractAddress: true, treasuryAddress: true },
      5: { legalStatus: true, valuationDocumentUrl: true, fiduciaryEntity: true, dueDiligenceReportUrl: true },
      6: { isMintable: true, isMutable: true, updateAuthorityAddress: true },
      7: { applicantName: true, applicantPosition: true, applicantEmail: true, applicantPhone: true, verificationAgreement: true },
    };
    return fieldMap[step] ?? {};
  };

  // Manejador de errores de validación
  const onValidationErrors = (errors: FieldErrors<FullProjectFormData>) => {
    console.error("Errores de validación del formulario:", errors);
    const errorFields = Object.keys(errors).join(", ");
    toast.error(`Hay errores en el formulario. Revisa los campos: ${errorFields}`);
  };

  const onSaveDraft = async (data: FullProjectFormData) => {
    setIsLoading(true);
    console.log('💾 onSaveDraft called with data:', data);

    // Create a raw object with defaults for the draft
    const rawDraftData = {
      ...data,
      totalTokens: Number(data.totalTokens) >= 1 ? Number(data.totalTokens) : 1000000,
      verificationAgreement: true,
      title: data.title || "Untitled Draft",
      description: data.description || "No description provided.",
      targetAmount: data.targetAmount >= 1 ? data.targetAmount : 1,
    };

    // Validate the raw data to get a safely typed object
    const validation = fullProjectSchema.partial().safeParse(rawDraftData);
    if (!validation.success) {
      console.error("Draft data failed validation:", validation.error.flatten());
      toast.error("No se pudo guardar el borrador por datos inválidos.");
      setIsLoading(false);
      return;
    }
    const draftData = validation.data; // This is now a safely typed object

    console.log('💾 Validated draft data:', draftData);

    const tokenDist = draftData.tokenDistribution ?? {};
    const finalDistribution = {
      publicSale: tokenDist.publicSale ?? 0,
      team: tokenDist.team ?? 0,
      treasury: tokenDist.treasury ?? 0,
      marketing: tokenDist.marketing ?? 0,
    };

    const submitData = {
      ...draftData,
      estimatedApy: draftData.estimatedApy ? String(draftData.estimatedApy) : undefined,
      teamMembers: JSON.stringify(draftData.teamMembers ?? []),
      advisors: JSON.stringify(draftData.advisors ?? []),
      tokenDistribution: JSON.stringify(finalDistribution),
    };

    const draftEndpoint = isEdit ? `/api/admin/projects/${project?.id}` : "/api/projects/draft";

    console.log('📤 Saving draft to:', draftEndpoint);
    console.log('📤 Final submitData:', JSON.stringify(submitData, null, 2));

    try {
      const response = await fetch(draftEndpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submitData,
          status: "draft", // Forzar status como draft para usuarios públicos
          featured: false // ✅ Featured debe ser manual, nunca automático
        }),
      });

      console.log('📡 Draft save response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string; errors?: unknown };
        const errorMessage = errorData.message ?? "Error al guardar el proyecto";
        console.error(`❌ Error del servidor (${response.status}):`, errorData);
        throw new Error(errorMessage);
      }

      // La respuesta se usa solo para log, así que 'unknown' es seguro.
      const responseData: unknown = await response.json().catch(() => ({}));
      console.log('✅ Draft save success response:', responseData);

      // Mostrar modal de draft en lugar de toast
      setShowDraftModal(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocurrió un error al guardar el borrador";
      console.error('💥 Draft save error:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onFinalSubmit = async (data: FullProjectFormData) => {
    // Re-validate to ensure type safety and satisfy the linter
    const validation = fullProjectSchema.safeParse(data);
    if (!validation.success) {
      console.error("Final submit data failed validation:", validation.error.flatten());
      toast.error("No se pudo enviar el proyecto por datos inválidos.");
      return;
    }
    const safeData = validation.data; // Use this safely typed data

    console.log('🚀 onFinalSubmit called with validated data:', safeData);
    setIsLoading(true);

    const tokenDist = safeData.tokenDistribution ?? {};
    // Asegurar distribución válida para clientes (permitir suma de 100%)
    const finalDistribution = {
      publicSale: tokenDist.publicSale ?? 100,
      team: tokenDist.team ?? 0,
      treasury: tokenDist.treasury ?? 0,
      marketing: tokenDist.marketing ?? 0,
    };

    // Verificar suma para clientes públicos
    if (isPublic) {
      const total = (finalDistribution.publicSale ?? 0) + (finalDistribution.team ?? 0) + (finalDistribution.treasury ?? 0) + (finalDistribution.marketing ?? 0);
      if (total > 100) {
        toast.error("La distribución total de tokens no puede exceder el 100%");
        setIsLoading(false);
        return;
      }
      if (total === 0) {
        // Si suma es 0, establecer publicSale al 100% por defecto
        finalDistribution.publicSale = 100;
      }
    }

    const submitData = {
      ...safeData,
      estimatedApy: safeData.estimatedApy ? String(safeData.estimatedApy) : undefined, // Convertir a string como espera el servidor
      teamMembers: JSON.stringify(safeData.teamMembers ?? []),
      advisors: JSON.stringify(safeData.advisors ?? []),
      tokenDistribution: JSON.stringify(finalDistribution),
    };

    console.log('📤 Submitting data to:', apiEndpoint, submitData);
    console.log('📤 apiEndpoint prop:', apiEndpoint);

    try {
       // FIX: Use the apiEndpoint prop if it's different from default, otherwise use built-in logic
       const finalEndpoint = apiEndpoint !== "/api/admin/projects" ? apiEndpoint : (
         isEdit ? `/api/admin/projects/${project?.id}` : "/api/admin/projects"
       );

      console.log('📡 Submitting to endpoint:', finalEndpoint);

      const response = await fetch(finalEndpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...submitData,
          status: isPublic ? "pending" : "approved",
          featured: false // ✅ Featured debe ser manual, nunca automático
        }),
      });

      console.log('📡 Response status:', response.status, response.ok);

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

      // 🎮 TRIGGER EVENTO DE APLICACIÓN DE PROYECTO
      const userWallet = account?.address?.toLowerCase();
      if (userWallet) {
        try {
          console.log('🎮 Triggering project application event for user:', userWallet);
          await gamificationEngine.trackEvent(
            userWallet,
            EventType.PROJECT_APPLICATION_SUBMITTED,
            {
              projectTitle: safeData.title,
              projectId: (responseData as { id?: string | number })?.id?.toString() ?? 'unknown',
              businessCategory: safeData.businessCategory,
              targetAmount: safeData.targetAmount,
              isPublicApplication: isPublic,
              submissionType: isPublic ? 'public' : 'admin_draft'
            }
          );
          console.log('✅ Gamification event PROJECT_APPLICATION_SUBMITTED tracked successfully');
        } catch (gamificationError) {
          console.warn('⚠️ Gamification event tracking failed:', gamificationError);
          // No bloquear el flujo si falla la gamificación
        }
      }

      // Mostrar modal de éxito en lugar de toast inmediato
      setShowSuccessModal(true);

      // Limpiar localStorage después del éxito
      if (!isEdit) {
        localStorage.removeItem("pandoras-project-form");
        localStorage.removeItem("pandoras-project-step");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error al guardar el proyecto";
      console.error('💥 Submit error:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminQuickSubmit = async (data: FullProjectFormData) => {
    if (isPublic) return; // No quick submit for public users
    
    // Re-validate to ensure type safety and satisfy the linter
    const validation = fullProjectSchema.safeParse(data);
    if (!validation.success) {
      console.error("Admin quick submit data failed validation:", validation.error.flatten());
      toast.error("No se pudo publicar el proyecto por datos inválidos.");
      return;
    }
    const safeData = validation.data; // Use this safely typed data

    setIsLoading(true);
    console.log('🚀 onAdminQuickSubmit called with validated data:', safeData);
    
    const tokenDist = safeData.tokenDistribution ?? {};
    const finalDistribution = {
      publicSale: tokenDist.publicSale ?? 0,
      team: tokenDist.team ?? 0,
      treasury: tokenDist.treasury ?? 0,
      marketing: tokenDist.marketing ?? 0,
    };

    const preparedData = {
      ...safeData,
      estimatedApy: safeData.estimatedApy ? String(safeData.estimatedApy) : undefined,
      teamMembers: JSON.stringify(safeData.teamMembers ?? []),
      advisors: JSON.stringify(safeData.advisors ?? []),
      tokenDistribution: JSON.stringify(finalDistribution),
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preparedData, status: "approved", featured: false }),
      });

      console.log('📡 Admin quick submit response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' })) as { message?: string; errors?: unknown };
        const errorMessage = errorData.message ?? "Error al guardar el proyecto";
        console.error(`❌ Error del servidor (${response.status}):`, errorData);
        throw new Error(errorMessage);
      }

      toast.success("Proyecto creado y publicado rápidamente!");
      
      if (!isEdit) {
        localStorage.removeItem("pandoras-project-form");
        localStorage.removeItem("pandoras-project-step");
      }
      
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error";
      console.error('💥 Admin submit error:', error);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitles = [
    "Identidad del Proyecto",
    "Enlaces y Comunidad", 
    "Detalles de la Oferta",
    "Equipo y Transparencia",
    "Seguridad y Auditoría",
    "Parámetros Técnicos",
    "Información de Contacto"
  ];

  const currentTitle = stepTitles[currentStep - 1];

  // Componentes de modales
  const SuccessModal = () => (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-lime-500 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-4">
          <div className="w-16 h-16 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            ¡Aplicación Enviada Exitosamente!
          </h3>
          <p className="text-gray-300 text-sm">
            {isPublic
              ? "Gracias por enviar tu aplicación. Vamos a revisar tu proyecto cuidadosamente y te contactaremos prontamente con los próximos pasos"
              : "Proyecto guardado exitosamente en el sistema administrativo"
            }
          </p>
        </div>
        <button
          onClick={() => {
            setShowSuccessModal(false);
            router.push(isPublic ? "/" : "/admin/dashboard");
            router.refresh();
          }}
          className="w-full bg-lime-500 hover:bg-lime-600 text-zinc-900 py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Entendido
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Redirigiendo automáticamente en 5 segundos...
        </p>
      </div>
    </div>
  );

  const DraftModal = () => (
    <div className="fixed inset-0 z-[10000] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-blue-500 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="mb-4">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            ¡Borrador Guardado!
          </h3>
          <p className="text-gray-300 text-sm">
            Tu progreso ha sido guardado exitosamente. Puedes continuar con tu aplicación en cualquier momento sin perder lo que hayas avanzado.
          </p>
        </div>
        <button
          onClick={() => {
            setShowDraftModal(false);
            router.push("/applicants");
            router.refresh();
          }}
          className="w-full bg-blue-500 hover:bg-blue-600 text-zinc-900 py-2 px-4 rounded-lg font-medium transition-colors"
        >
          Continuar en Aplicantes
        </button>
        <p className="text-xs text-gray-500 mt-2">
          Redirigiendo automáticamente en 5 segundos...
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950/0">
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault(); // Prevenir comportamiento por defecto
            void handleSubmit(onFinalSubmit, onValidationErrors)(e);
          }}
          className="max-w-4xl mx-auto p-4 md:p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent mb-2">
              {isEdit ? "Editar Proyecto" : "Nueva Aplicación de Proyecto"}
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Completa la información de tu proyecto para el proceso de tokenización en Pandoras Foundation
            </p>
          </div>

          {/* Progress Bar */}
          <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          {/* Contenido del Paso Actual */}
          <div className="bg-zinc-900/50 rounded-2xl p-6 md:p-8 border border-zinc-800 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">{currentTitle}</h2>
                <p className="text-gray-400 mt-1">Paso {currentStep} de {totalSteps}</p>
              </div>
              {/*<div className="text-sm text-gray-500">
                {currentStep > 1 && (
                  <button
                    type="button" // Prevenir submit del form
                    onClick={prevStep}
                    className="text-lime-400 hover:text-lime-300 mr-4"
                  >
                    ← Anterior
                  </button>
                )}
                {currentStep < totalSteps && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="text-lime-400 hover:text-lime-300"
                    disabled={!isAdminUser && Object.keys(errors).length > 0}
                  >
                    Siguiente →
                  </button>
                )}
              </div>*/}
            </div>

            {/* Renderizar sección actual */}
            {currentStep === 1 && <ProjectSection1 />}
            {currentStep === 2 && <ProjectSection2 />}
            {currentStep === 3 && <ProjectSection3 />}
            {currentStep === 4 && <ProjectSection4 />}
            {currentStep === 5 && <ProjectSection5 />}
            {currentStep === 6 && <ProjectSection6 />}
            {currentStep === 7 && <ProjectSection7 />}

            {/* Navegación inferior */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-zinc-800">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 hover:text-lime-400 hover:bg-zinc-800/50 rounded-lg transition-colors duration-200"
                  >
                    ← Anterior
                  </button>
                )}
              </div>
              <div>
                {currentStep < totalSteps && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-lime-500 hover:bg-lime-600 text-zinc-900 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isAdminUser && Object.keys(errors).length > 0}
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Botón Guardar Borrador - Disponible en TODOS los pasos para usuarios públicos Y admins */}
          {(isPublic || isAdminUser) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    await onSaveDraft(methods.getValues());
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Guardar y Continuar Más Tarde
              </Button>
            </div>
          )}

          {/* Botones finales - Solo en el último paso */}
          {currentStep === totalSteps && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                type="button"
                variant="secondary"
                disabled={isLoading || Object.keys(errors).length > 0}
                onClick={() => {
                  void handleSubmit(onFinalSubmit, onValidationErrors)();
                }}
                className="w-full sm:w-auto"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEdit ? "Guardar Cambios" : isPublic ? "Enviar Aplicación" : "Guardar Borrador"}
              </Button>

              {!isPublic && isAdminUser && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    void handleSubmit(onAdminQuickSubmit, onValidationErrors)();
                  }}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isEdit ? "Actualizar y Publicar" : "Publicar Directamente"}
                </Button>
              )}
            </div>
          )}

          {/* Botón de progreso rápido para admin (siempre visible) */}
          {!isPublic && isAdminUser && currentStep !== totalSteps && (
            <div className="text-center mt-6 p-4 bg-lime-500/10 border border-lime-500/20 rounded-lg">
              <p className="text-sm text-lime-400 mb-2">👑 Modo Admin</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(totalSteps)}
                className="text-lime-400 border-lime-400 hover:bg-lime-500 hover:text-zinc-900"
              >
                Saltar al Final y Publicar
              </Button>
            </div>
          )}
        </form>

        {/* Modales */}
        {showSuccessModal && <SuccessModal />}
        {showDraftModal && <DraftModal />}
      </FormProvider>
    </div>
  );
}
