"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { type projects } from "~/db/schema";
import type { ComponentType } from "react";
import { Loader2, ChevronLeft, ChevronRight, Save, Upload } from "lucide-react";

// Import section components
import { ProjectSection1 } from "./sections/ProjectSection1";
import { ProjectSection2 } from "./sections/ProjectSection2";
import { ProjectSection3 } from "./sections/ProjectSection3";
import { ProjectSection4 } from "./sections/ProjectSection4";
import { ProjectSection5 } from "./sections/ProjectSection5";
import { ProjectSection6 } from "./sections/ProjectSection6";
import { ProjectSection7 } from "./sections/ProjectSection7";

// UI Components (using shadcn/ui patterns)
const Button = ({ children, className = "", onClick, type = "button", disabled = false, variant = "default" }: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "default" | "secondary" | "admin" | "skip";
}) => {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2";
  const variants = {
    default: "bg-lime-500 hover:bg-lime-600 text-zinc-900",
    secondary: "bg-zinc-700 hover:bg-zinc-600 text-zinc-100 border border-zinc-600",
    admin: "bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-400",
    skip: "bg-orange-500 hover:bg-orange-600 text-white border border-orange-400"
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {children}
    </button>
  );
};

const SkipSectionButton = ({ onClick, disabled = false }: { onClick: () => void; disabled?: boolean }) => (
  <Button
    variant="skip"
    onClick={onClick}
    disabled={disabled}
    className="px-3 py-1 text-xs"
  >
    Omitir Sección (Admin)
  </Button>
);

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="w-full bg-zinc-800 rounded-full h-2 mb-6">
    <div 
      className="bg-gradient-to-r from-lime-500 to-emerald-500 h-2 rounded-full transition-all duration-300" 
      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
    />
  </div>
);

const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => (
  <div className="flex justify-center mb-4">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div
        key={i}
        className={`w-2 h-2 rounded-full mx-1 transition-colors ${
          i < currentStep ? 'bg-lime-500' : i === currentStep ? 'bg-lime-400' : 'bg-zinc-600'
        }`}
      />
    ))}
  </div>
);

// Comprehensive Zod schema for all 48 columns
const projectSchema = z.object({
  // Section 1: Identity (required for progression)
  title: z.string().min(3, "El título es requerido").max(256),
  slug: z.string().optional(),
  logoUrl: z.string().url("URL del logo inválida").optional().or(z.literal("")),
  coverPhotoUrl: z.string().url("URL de la foto de portada inválida").optional().or(z.literal("")),
  tagline: z.string().max(140).optional(), // Fully optional for progression
  description: z.string().max(2000).optional(), // Fully optional for progression
  businessCategory: z.enum([
    "residential_real_estate",
    "commercial_real_estate",
    "tech_startup",
    "renewable_energy",
    "art_collectibles",
    "intellectual_property",
    "other"
  ]).default("other").optional(),
  videoPitch: z.string().url("URL de video inválida").optional().or(z.literal("")),
  
  // Section 2: Links (all optional for progression)
  website: z.string().url("URL del sitio web inválida").optional().or(z.literal("")),
  whitepaperUrl: z.string().url("URL del whitepaper inválida").optional().or(z.literal("")),
  twitterUrl: z.string().url("URL de Twitter inválida").optional().or(z.literal("")),
  discordUrl: z.string().url("URL de Discord inválida").optional().or(z.literal("")),
  telegramUrl: z.string().url("URL de Telegram inválida").optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL de LinkedIn inválida").optional().or(z.literal("")),
  socials: z.object({
    twitter: z.string().url().optional().or(z.literal("")),
    discord: z.string().url().optional().or(z.literal("")),
    telegram: z.string().url().optional().or(z.literal("")),
    linkedin: z.string().url().optional().or(z.literal("")),
  }).optional().default({ twitter: "", discord: "", telegram: "", linkedin: "" }),
  
  // Section 3: Tokenomics (some required, but min(0) for optionals)
  targetAmount: z.coerce.number().min(1, "El monto debe ser positivo").optional().default(1),
  totalValuationUsd: z.coerce.number().min(1, "La valuación debe ser positiva").optional().default(1),
  tokenType: z.enum(["erc20", "erc721", "erc1155"]).default("erc20"),
  totalTokens: z.coerce.number().min(1, "El supply total debe ser positivo").optional().default(1),
  tokensOffered: z.coerce.number().min(0, "Los tokens ofrecidos deben ser válidos").optional().default(0),
  tokenPriceUsd: z.coerce.number().min(0.0001, "El precio del token debe ser válido").optional().default(0.0001),
  // --- CORRECCIÓN DEFINITIVA: Se convierte explícitamente a String para manejar números o texto.
  estimatedApy: z.preprocess((val) => String(val ?? ""), z.string()),
  yieldSource: z.enum(["rental_income", "capital_appreciation", "dividends", "royalties", "other"]).default("other"),
  lockupPeriod: z.string().optional().default(""),
  fundUsage: z.string().optional().default(""),
  
  // Section 4: Team (min(0) to allow empty for progression, required on submit)
  teamMembers: z.array(z.object({
    name: z.string().min(2, "Nombre requerido"),
    position: z.string().min(2, "Posición requerida"),
    linkedin: z.string().url().optional().or(z.literal("")),
  })).min(0), // Changed to min(0)
  advisors: z.array(z.object({
    name: z.string().min(2, "Nombre requerido"),
    role: z.string().min(2, "Rol requerido"),
    linkedin: z.string().url().optional().or(z.literal("")),
  })).optional(),
  tokenDistribution: z.object({
    team: z.coerce.number().min(0).max(100),
    investors: z.coerce.number().min(0).max(100),
    community: z.coerce.number().min(0).max(100),
    treasury: z.coerce.number().min(0).max(100),
    other: z.coerce.number().min(0).max(100),
  }).optional().refine(data => !data || Object.values(data).reduce((a, b) => a + b, 0) === 100, { // Made optional
    message: "La distribución debe sumar 100%"
  }),
  contractAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de contrato inválida").optional().or(z.literal("")).default(""),
  treasuryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de tesorería inválida").optional().or(z.literal("")).default(""),
  
  // Section 5: Due Diligence (optional for progression)
  legalStatus: z.string().optional().default("En revisión"),
  valuationDocumentUrl: z.string().url().optional().or(z.literal("")),
  fiduciaryEntity: z.string().optional(),
  dueDiligenceReportUrl: z.string().url().optional().or(z.literal("")),
  
  // Section 6: Technical Parameters (required but simple)
  isMintable: z.boolean().default(false),
  isMutable: z.boolean().default(false),
  updateAuthorityAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de autoridad inválida").optional().or(z.literal("")).default(""),
  
  // Section 7: Contact (required for submit, but allow progression if partial)
  applicantName: z.string().min(2, "Nombre del solicitante requerido").default("Solicitante"),
  applicantPosition: z.string().optional().default("Founder"),
  applicantEmail: z.string().email("Email inválido").default("email@example.com"),
  applicantPhone: z.string().regex(/^\+?[\d\s-()]{10,}$/, "Teléfono inválido").optional().default("+1234567890"),
  verificationAgreement: z.boolean().refine(v => v === true, "Debes aceptar los términos"),
  
  // Additional fields from schema
  imageUrl: z.string().url().optional().or(z.literal("")),
  raisedAmount: z.coerce.number().min(0).default(0),
  returnsPaid: z.coerce.number().min(0).default(0),
  status: z.enum(["pending", "approved", "live", "completed", "rejected"]).default("pending"),
  createdAt: z.date().optional(),
})
.superRefine((data, ctx) => {
  // Esta validación se aplica a todos.
  if (!data.verificationAgreement) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debes aceptar los términos",
      path: ["verificationAgreement"],
    });
  }
})
.superRefine((data, ctx) => {
  // Validaciones que NO se aplican si eres admin (se asume que el admin sabe lo que hace)
  // Para simular el bypass, necesitaríamos saber si el usuario es admin aquí.
  // Por ahora, las mantenemos pero el admin las bypaseará en el handler.
  // En un escenario ideal, el schema se ajustaría dinámicamente.
  // Dejamos las validaciones para usuarios normales.
  if (data.teamMembers && data.teamMembers.length === 0) {
      ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Al menos un miembro del equipo es requerido para usuarios no-admin.",
          path: ["teamMembers"],
      });
  }
  if (data.tokenDistribution) {
    const sum = Object.values(data.tokenDistribution).reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
    const isSumOneHundred = Math.abs(sum - 100) <= 0.01;
    if (!isSumOneHundred && sum !== 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La distribución debe sumar 100%",
        path: ["tokenDistribution"],
      });
    }
  }
});

type ProjectFormData = z.infer<typeof projectSchema>;
type Project = typeof projects.$inferSelect;

interface ProjectFormProps {
  project: Project | null;
  isAdmin?: boolean;
}

const TOTAL_STEPS = 7;
type SectionComponentProps = {
  control: any;
  register: any;
  errors: any;
  setValue: any;
  watch: any;
  step: number;
  isAdmin: boolean;
  project: Project | null;
  disabled: boolean;
};

const SECTION_COMPONENTS: ComponentType<SectionComponentProps>[] = [
  ProjectSection1,
  ProjectSection2,
  ProjectSection3,
  ProjectSection4,
  ProjectSection5,
  ProjectSection6,
  ProjectSection7,
];

export function ProjectForm({ project, isAdmin: propsIsAdmin }: ProjectFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(propsIsAdmin || false);
  const isNew = project === null;
  const stepFromUrl = searchParams.get('step');

  const defaultValues: Partial<ProjectFormData> = {
    title: project?.title ?? "",
    slug: project?.slug ?? "",
    description: project?.description ?? "",
    logoUrl: project?.logoUrl ?? "",
    coverPhotoUrl: project?.coverPhotoUrl ?? "",
    tagline: project?.tagline ?? "",
    businessCategory: (project?.businessCategory as any) ?? "other",
    videoPitch: project?.videoPitch ?? "",
    website: project?.website ?? "",
    whitepaperUrl: project?.whitepaperUrl ?? "",
    twitterUrl: project?.twitterUrl ?? "",
    discordUrl: project?.discordUrl ?? "",
    telegramUrl: project?.telegramUrl ?? "",
    linkedinUrl: project?.linkedinUrl ?? "",
    socials: project?.socials ? JSON.parse(project.socials as any) : { twitter: "", discord: "", telegram: "", linkedin: "" },
    targetAmount: Number(project?.targetAmount ?? 0),
    totalValuationUsd: Number(project?.totalValuationUsd ?? 0),
    tokenType: (project?.tokenType as any) ?? "erc20",
    totalTokens: Number(project?.totalTokens ?? 0),
    tokensOffered: Number(project?.tokensOffered ?? 1),
    tokenPriceUsd: Number(project?.tokenPriceUsd ?? 0),
    estimatedApy: project?.estimatedApy ?? "",
    yieldSource: (project?.yieldSource as any) ?? "other",
    lockupPeriod: project?.lockupPeriod ?? "",
    fundUsage: project?.fundUsage ?? "",
    teamMembers: project?.teamMembers ? JSON.parse(project.teamMembers as any) : [],
    advisors: project?.advisors ? JSON.parse(project.advisors as any) : [],
    tokenDistribution: project?.tokenDistribution ? JSON.parse(project.tokenDistribution as any) : { team: 0, investors: 0, community: 0, treasury: 0, other: 0 },
    contractAddress: project?.contractAddress ?? "",
    treasuryAddress: project?.treasuryAddress ?? "",
    legalStatus: project?.legalStatus ?? "",
    valuationDocumentUrl: project?.valuationDocumentUrl ?? "",
    fiduciaryEntity: project?.fiduciaryEntity ?? "",
    dueDiligenceReportUrl: project?.dueDiligenceReportUrl ?? "",
    isMintable: Boolean(project?.isMintable ?? false),
    isMutable: Boolean(project?.isMutable ?? false),
    updateAuthorityAddress: project?.updateAuthorityAddress ?? "",
    applicantName: project?.applicantName ?? "",
    applicantPosition: project?.applicantPosition ?? "",
    applicantEmail: project?.applicantEmail ?? "",
    applicantPhone: project?.applicantPhone ?? "",
    verificationAgreement: Boolean(project?.verificationAgreement ?? false),
    imageUrl: project?.imageUrl ?? "",
    raisedAmount: Number(project?.raisedAmount ?? 0),
    returnsPaid: Number(project?.returnsPaid ?? 0),
    status: (project?.status as any) ?? "pending",
    // ... map other fields from project
  };

  const methods = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues,
    mode: "onChange",
  });
  
  // Log form state changes for debugging
  useEffect(() => {
    console.log('Form state changed:', { isValid: methods.formState.isValid, errors: methods.formState.errors, dirtyFields: methods.formState.dirtyFields, fullErrors: methods.formState.errors });
  }, [methods.formState.isValid, methods.formState.errors, methods.formState.dirtyFields]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors, isValid, dirtyFields },
  } = methods;

  // Admin status set from server-side prop - no client-side API call needed
  useEffect(() => {
    setIsAdminUser(propsIsAdmin || false);
  }, [propsIsAdmin]);

  // Initialize step from URL or localStorage
  useEffect(() => {
    const savedStep = localStorage.getItem(`project-form-step-${project?.id || 'new'}`);
    const initialStep = stepFromUrl ? parseInt(stepFromUrl) : (savedStep ? parseInt(savedStep) : 1);
    setCurrentStep(Math.max(1, Math.min(TOTAL_STEPS, initialStep)));
  }, [stepFromUrl, project?.id]);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    const formData = getValues();
    const progress = {
      step: currentStep,
      data: formData,
      timestamp: Date.now(),
    };
    localStorage.setItem(`project-form-${project?.id || 'new'}`, JSON.stringify(progress));
  }, [getValues, currentStep, project?.id]);

  useEffect(() => {
    saveProgress();
  }, [watch(), currentStep, saveProgress]);

  // Navigation functions
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
      const url = new URL(window.location.href);
      url.searchParams.set('step', step.toString());
      router.push(url.pathname + url.search);
      saveProgress();
    }
  }, [router, saveProgress]);

  const stepFieldMap: Record<number, (keyof ProjectFormData)[]> = {
    1: ["title", "tagline", "description", "businessCategory", "logoUrl", "coverPhotoUrl", "videoPitch"],
    2: ["website", "whitepaperUrl", "twitterUrl", "discordUrl", "telegramUrl", "linkedinUrl", "socials"],
    3: ["targetAmount", "totalValuationUsd", "tokenType", "totalTokens", "tokensOffered", "tokenPriceUsd", "estimatedApy", "yieldSource", "lockupPeriod", "fundUsage"],
    4: ["teamMembers", "advisors", "tokenDistribution", "contractAddress", "treasuryAddress"],
    5: ["legalStatus", "valuationDocumentUrl", "fiduciaryEntity", "dueDiligenceReportUrl"],
    6: ["isMintable", "isMutable", "updateAuthorityAddress"],
    7: ["applicantName", "applicantPosition", "applicantEmail", "applicantPhone", "verificationAgreement"],
  };
  
  const nextStep = useCallback(async () => {
    console.log('nextStep called:', { currentStep, isAdminUser, isLoading });
    
    // For admins, always allow skipping validation and progression
    if (isAdminUser) {
      console.log('Admin mode: skipping validation');
      if (currentStep < TOTAL_STEPS) {
        goToStep(currentStep + 1);
      }
      return;
    }
  
    // For regular users: Validate only current step fields
    const currentFields = stepFieldMap[currentStep] || [];
    console.log('Validating fields for step', currentStep, currentFields);
    
    const isStepValid = await trigger(currentFields as any);
    console.log('trigger result:', isStepValid);
    
    // Check for errors specifically in current step
    const stepHasErrors = currentFields.some(field => errors[field as keyof typeof errors]);
    console.log('Step has errors:', stepHasErrors, 'Current errors:', errors);
    
    if (!isStepValid || stepHasErrors) {
      console.log('Validation failed for step', currentStep);
      toast.error("Por favor completa los campos requeridos de esta sección.");
      return;
    }
  
    console.log('Validation passed, advancing to step', currentStep + 1);
    if (currentStep < TOTAL_STEPS) {
      goToStep(currentStep + 1);
    }
  }, [currentStep, errors, goToStep, trigger, isAdminUser, stepFieldMap]);

  const prevStep = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Form submission
  const onSubmit = async (data: ProjectFormData) => {
    // Full validation on submit - ONLY FOR NON-ADMINS
    if (!isAdminUser) {
      const isFormValid = await trigger();
      if (!isFormValid) {
        toast.error("Por favor corrige todos los errores antes de enviar.");
        return;
      }
    }
    // ADMINS BYPASS VALIDATION - can save incomplete forms

    setIsLoading(true);
    const endpoint = isNew ? "/api/admin/projects" : `/api/admin/projects/${project?.id}`;
    const method = isNew ? "POST" : "PUT";

    try {
      // Prepare data for API (transform nested objects to JSON strings for DB)
      const submitData = {
        ...data,
        teamMembers: JSON.stringify(data.teamMembers || []),
        advisors: JSON.stringify(data.advisors || []),
        socials: JSON.stringify({
          twitter: data.twitterUrl || data.socials?.twitter || "",
          discord: data.discordUrl || data.socials?.discord || "",
          telegram: data.telegramUrl || data.socials?.telegram || "",
          linkedin: data.linkedinUrl || data.socials?.linkedin || ""
        }),
        tokenDistribution: JSON.stringify(data.tokenDistribution),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        // --- AÑADIDO: Log de debugging ---
        console.error("Error del servidor (onSubmit):", error.errors || error);
        throw new Error(
          error.message ||
            "Error al guardar el proyecto. Revisa la consola para más detalles."
        );
      }

      const result = await response.json();
      
      // Clear localStorage
      localStorage.removeItem(`project-form-${project?.id || 'new'}`);
      localStorage.removeItem(`project-form-step-${project?.id || 'new'}`);

      toast.success(
        `Proyecto ${isNew ? "creado" : "actualizado"} exitosamente.`
      );

      // Admin quick actions
      if (isAdminUser && method === "POST") {
        // Auto-approve for admin
        await fetch(`/api/admin/projects/${result.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "approved" }),
        });
        toast.success("Proyecto aprobado automáticamente.");
      }

      // Redirect based on context
      if (isNew && !isAdminUser) {
        // For regular users, redirect to project view
        router.push(`/projects/${result.slug || result.id}`);
      } else {
        // For admins, go back to dashboard or stay on edit
        router.push("/admin/dashboard");
      }

      router.refresh();
    } catch (error: any) {
      console.error("Form submission error:", error);
      toast.error(error.message || "Ocurrió un error al guardar el proyecto.");
    } finally {
      setIsLoading(false);
    }
  };

  // Admin quick save & upload
  const handleAdminSave = async () => {
    const data = getValues();
    
    setIsLoading(true);
    try {
      // --- CORREGIDO: Preparar los datos para la API, igual que en onSubmit ---
      const submitData = {
        ...data,
        teamMembers: JSON.stringify(data.teamMembers || []),
        advisors: JSON.stringify(data.advisors || []),
        socials: JSON.stringify({
          twitter: data.twitterUrl || data.socials?.twitter || "",
          discord: data.discordUrl || data.socials?.discord || "",
          telegram: data.telegramUrl || data.socials?.telegram || "",
          linkedin: data.linkedinUrl || data.socials?.linkedin || ""
        }),
        tokenDistribution: JSON.stringify(data.tokenDistribution || {}),
        status: "approved", // Forzar estado a 'approved' para el admin
      };

      const response = await fetch(isNew ? "/api/admin/projects" : `/api/admin/projects/${project?.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        // --- AÑADIDO: Log de debugging ---
        console.error("Error del servidor (handleAdminSave):", error.errors || error);
        throw new Error(
          error.message ||
            "Error al guardar el proyecto. Revisa la consola para más detalles."
        );
      }

      toast.success(`Proyecto ${isNew ? "creado y aprobado" : "actualizado"}.`);
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar proyecto como admin.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load saved progress
  useEffect(() => {
    const saved = localStorage.getItem(`project-form-${project?.id || 'new'}`);
    if (saved && !project) {
      try {
        const { data } = JSON.parse(saved);
        Object.entries(data).forEach(([key, value]) => {
          setValue(key as keyof ProjectFormData, value as any);
        });
      } catch (e) {
        console.warn("Error loading saved progress:", e);
      }
    }
  }, [setValue, project]);

  const CurrentSectionComponent = SECTION_COMPONENTS[currentStep - 1];
  const sectionProps = {
    control,
    register,
    errors,
    setValue,
    watch,
    step: currentStep,
    isAdmin: isAdminUser,
    project,
    disabled: isLoading,
  };

  const isLastStep = currentStep === TOTAL_STEPS;
  // Removed canSave - buttons only disabled by isLoading
  console.log('Button state:', { isLastStep, isValid, dirtyFieldsCount: Object.keys(dirtyFields).length, currentErrors: Object.keys(errors) });
  
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Progress Indicators */}
        <div>
          <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          <div className="text-center text-sm text-zinc-400">
            Paso {currentStep} de {TOTAL_STEPS} - {[
              "Identidad del Proyecto",
              "Enlaces y Redes Sociales",
              "Tokenomics y Financiamiento",
              "Equipo y Asesores",
              "Due Diligence Legal",
              "Parámetros Técnicos",
              "Contacto y Verificación"
            ][currentStep - 1]}
          </div>
        </div>

    {/* Admin Quick Actions */}
    {isAdminUser && (
      <div className="flex gap-2 mb-6">
        <Button
          variant="admin"
          onClick={handleAdminSave}
          disabled={isLoading}
          className="flex-1"
        >
          <Save className="w-4 h-4" />
          {isNew ? "Crear & Publicar" : "Guardar & Publicar"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => goToStep(TOTAL_STEPS)}
          disabled={isLoading}
        >
          Saltar a Final
        </Button>
      </div>
    )}

    {/* Admin Skip Section Button */}
    {isAdminUser && currentStep < TOTAL_STEPS && (
      <div className="flex justify-center mb-4">
        <SkipSectionButton
          onClick={nextStep}
          disabled={isLoading}
        />
      </div>
    )}

    {/* Current Section */}
    <div className="bg-zinc-900/50 rounded-xl p-6 border border-zinc-700/50">
      {CurrentSectionComponent && (
        <div className="relative">
          <CurrentSectionComponent {...sectionProps} />
          {/* Admin Skip Field Buttons - can be used within sections */}
          {isAdminUser && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => {
                  // Skip all required fields in current section for admin
                  const sectionFields = getValues();
                  Object.keys(sectionFields).forEach(field => {
                    if (field.includes(`step${currentStep}`) || field.match(/^(title|description|targetAmount|teamMembers|applicantName|applicantEmail|verificationAgreement)$/)) {
                      setValue(field as keyof ProjectFormData, field.includes('email') ? 'admin@example.com' : '');
                    }
                  });
                  trigger();
                }}
                className="px-2 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                disabled={isLoading}
              >
                Omitir Campos
              </button>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-zinc-700">
        <Button 
          variant="secondary" 
          onClick={prevStep}
          disabled={currentStep === 1 || isLoading}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        <div className="flex gap-3">
          {isLastStep ? (
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-600 hover:to-emerald-600"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <Upload className="w-4 h-4" />
                  {isNew ? "Crear Proyecto" : "Actualizar Proyecto"}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={isLoading}
              className="bg-lime-500 hover:bg-lime-600"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Form Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <h4 className="text-red-400 font-medium mb-2">Errores en el formulario:</h4>
          <ul className="text-red-300 text-sm space-y-1">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="flex items-center gap-2">
                • {field}: {error.message as string}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progress Save Indicator */}
      <div className="text-xs text-zinc-500 text-center">
        Progreso guardado automáticamente. Puedes continuar después.
      </div>
    </form>
  </FormProvider>
);
}