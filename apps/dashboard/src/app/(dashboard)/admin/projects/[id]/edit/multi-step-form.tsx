"use client";
import { useState, useEffect } from "react";
import { FieldError } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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
  teamMembers?: unknown | null;
  advisors?: unknown | null;
  tokenDistribution?: unknown | null;
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
  verificationAgreement?: boolean | string | null;
  createdAt?: Date;
  raisedAmount?: string | number | null;
  returnsPaid?: string | number | null;
  status?: string | null;
}

// Componentes UI inline (reutilizados de ProjectForm)
const Button = ({ children, className = "", onClick, type = "button", disabled = false, variant = "primary" }: { 
  children: React.ReactNode, 
  className?: string, 
  onClick?: () => void, 
  type?: "button" | "submit", 
  disabled?: boolean,
  variant?: "primary" | "secondary" | "outline"
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

// Schema completo con todas las secciones (permite campos opcionales)
const fullProjectSchema = z.object({
  // Sección 1: Identidad del Proyecto
  title: z.string().min(3, "El título es requerido."),
  description: z.string().min(10, "La descripción es requerida."),
  tagline: z.string().max(140, "Máximo 140 caracteres.").optional(),
  businessCategory: z.string().optional(),
  logoUrl: z.string().optional(),
  coverPhotoUrl: z.string().optional(),
  videoPitch: z.string().url("URL de video inválida").optional().or(z.literal("")),
  
  // Sección 2: Enlaces Externos
  website: z.string().url("URL inválida").optional().or(z.literal("")),
  whitepaperUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  twitterUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  discordUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  telegramUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  
  // Sección 3: Tokenomics
  targetAmount: z.coerce.number().min(0, "Debe ser un número positivo."),
  totalValuationUsd: z.coerce.number().min(0, "Debe ser un número positivo").optional(),
  tokenType: z.enum(["erc20", "erc721", "erc1155"]).optional(),
  totalTokens: z.coerce.number().min(1, "Debe ser al menos 1").optional(),
  tokensOffered: z.coerce.number().min(1, "Debe ser al menos 1").optional(),
  tokenPriceUsd: z.coerce.number().min(0, "Debe ser un número positivo").optional(),
  // --- CORRECCIÓN DEFINITIVA: Usamos `preprocess` para asegurar que el valor sea siempre un string.
  // Se convierte explícitamente a String para manejar números o texto.
  estimatedApy: z.preprocess((val) => String(val ?? ""), z.string()),
  yieldSource: z.enum(["rental_income", "capital_appreciation", "dividends", "royalties", "other"]).optional(),
  lockupPeriod: z.string().optional(),
  fundUsage: z.string().optional(),
  
  // Sección 4: Equipo
  teamMembers: z.array(z.object({
    name: z.string().min(1),
    position: z.string().min(1),
    linkedin: z.string().url().optional().or(z.literal(""))
  })).optional(),
  advisors: z.array(z.object({
    name: z.string().min(1),
    profile: z.string().optional()
  })).optional(),
  tokenDistribution: z.object({
    publicSale: z.coerce.number().min(0).max(100).optional(),
    team: z.coerce.number().min(0).max(100).optional(),
    treasury: z.coerce.number().min(0).max(100).optional(),
    marketing: z.coerce.number().min(0).max(100).optional(),
  }).optional().refine(data => {
    if (!data) return true; // Si no hay datos, es válido
    const sum = Object.values(data).reduce((a: number, b) => a + (Number(b) || 0), 0);
    
    const isSumZero = sum === 0;
    const isSumOneHundred = Math.abs(sum - 100) <= 0.01;

    return isSumZero || isSumOneHundred;
  }, {
    message: "La distribución debe sumar 0% (por defecto) o exactamente 100%"
  }),
  contractAddress: z.string().optional(),
  treasuryAddress: z.string().optional(),
  
  // Sección 5: Due Diligence
  legalStatus: z.string().optional(),
  valuationDocumentUrl: z.string().url().optional().or(z.literal("")),
  fiduciaryEntity: z.string().optional(),
  dueDiligenceReportUrl: z.string().url().optional().or(z.literal("")),
  
  // Sección 6: Parámetros Técnicos
  isMintable: z.boolean().optional(),
  isMutable: z.boolean().optional(),
  updateAuthorityAddress: z.string().optional(),
  
  // Sección 7: Contacto
  applicantName: z.string().min(1, "Nombre requerido").optional(),
  applicantPosition: z.string().optional(),
  applicantEmail: z.string().email("Email inválido").optional(),
  applicantPhone: z.string().optional(),
  verificationAgreement: z.boolean(),
}).refine(data => data.verificationAgreement === true, { message: "Debes aceptar el acuerdo para poder enviar.", path: ["verificationAgreement"] });

export type FullProjectFormData = z.infer<typeof fullProjectSchema>;

interface MultiStepFormProps {
  project?: Project | null;
  isEdit?: boolean;
  apiEndpoint?: string;
  isPublic?: boolean;
}

export function MultiStepForm({ project, isEdit = false, apiEndpoint = "/api/admin/projects", isPublic = false }: MultiStepFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const isAdminUser = !isPublic; // El estado de admin se deriva directamente de la prop.
  const totalSteps = 7;
  
  // Formulario principal
  const methods = useForm<FullProjectFormData>({
    resolver: zodResolver(fullProjectSchema),
    defaultValues: {
      // Sección 1
      title: project?.title ?? undefined,
      description: project?.description ?? undefined,
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
      targetAmount: Number(project?.targetAmount ?? 0),
      totalValuationUsd: Number(project?.totalValuationUsd ?? 0),
      tokenType: (project?.tokenType as "erc20" | "erc721" | "erc1155" | null | undefined) ?? undefined,
      totalTokens: Number(project?.totalTokens ?? 0),
      tokensOffered: Number(project?.tokensOffered ?? 1),
      tokenPriceUsd: Number(project?.tokenPriceUsd ?? 0),
      estimatedApy: project?.estimatedApy ?? undefined,
      yieldSource: (project?.yieldSource as "rental_income" | "capital_appreciation" | "dividends" | "royalties" | "other" | null | undefined) ?? undefined,
      lockupPeriod: project?.lockupPeriod ?? undefined,
      fundUsage: project?.fundUsage ?? undefined,
      
      // Sección 4
      teamMembers: project?.teamMembers ? (JSON.parse(String(project.teamMembers)) as any[]) : [], // Parsear si viene de DB
      advisors: project?.advisors ? (JSON.parse(String(project.advisors)) as any[]) : [], // Parsear si viene de DB
      tokenDistribution: project?.tokenDistribution ? (JSON.parse(String(project.tokenDistribution)) as Record<string, number>) : { publicSale: 0, team: 0, treasury: 0, marketing: 0 }, // Parsear si viene de DB
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
      verificationAgreement: Boolean(project?.verificationAgreement ?? false),
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { handleSubmit, watch, setValue, formState: { errors }, trigger } = methods;

  // Cargar progreso desde localStorage
  useEffect(() => {
    if (isEdit) return;
    
    const savedData = localStorage.getItem("pandoras-project-form");
    if (savedData) {
      const parsed = JSON.parse(savedData) as Partial<FullProjectFormData>;
      Object.keys(parsed).forEach((key) => {
        setValue(key as keyof FullProjectFormData, parsed[key as keyof FullProjectFormData]);
      });
      const savedStep = localStorage.getItem("pandoras-project-step");
      if (savedStep) {
        setCurrentStep(Number(savedStep));
      }
    }
  }, [setValue, isEdit]);

  // Guardar progreso en localStorage
  useEffect(() => {
    if (isEdit) return;
    
    const currentData = watch();
    localStorage.setItem("pandoras-project-form", JSON.stringify(currentData));
    localStorage.setItem("pandoras-project-step", currentStep.toString());
  }, [watch, currentStep, isEdit]);

  // Navegación entre pasos
  const nextStep = async () => {
    const fieldsToValidate = Object.keys(getFieldsForStep(currentStep));

    // Para admins, siempre permitir avanzar sin validar
    if (isAdminUser) {
      if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
      return;
    }

    // Para usuarios normales, validar los campos del paso actual
    const isStepValid = await trigger(fieldsToValidate as (keyof FullProjectFormData)[]);
    if (!isStepValid) {
      toast.error("Por favor completa los campos requeridos de esta sección.");
      return;
    }
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
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
    return fieldMap[step] || {};
  };

  // --- AÑADIDO: Manejador de errores de validación ---
  // Esta función se ejecutará si handleSubmit encuentra errores en el formulario.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onValidationErrors = (formErrors: Record<string, FieldError>) => {
    console.error("Errores de validación del formulario:", formErrors);
    const errorFields = Object.keys(formErrors).join(", ");
    toast.error(`Hay errores en el formulario. Revisa los campos: ${errorFields}`);
  };
  // --- FIN DEL BLOQUE AÑADIDO ---

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onFinalSubmit = async (data: FullProjectFormData) => {
    setIsLoading(true);
    
    // Preparamos los datos, convirtiendo `undefined` a 0 en la distribución
    // y luego stringificando los campos anidados que el backend espera como JSON.
    const finalDistribution = {
      publicSale: data.tokenDistribution?.publicSale ?? 0,
      team: data.tokenDistribution?.team ?? 0,
      treasury: data.tokenDistribution?.treasury ?? 0,
      marketing: data.tokenDistribution?.marketing ?? 0,
    };

    const submitData = {
      ...data,
      teamMembers: JSON.stringify(data.teamMembers || []),
      advisors: JSON.stringify(data.advisors || []),
      tokenDistribution: JSON.stringify(finalDistribution),
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData), // Enviamos los datos preparados
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error del servidor (400):", (errorData as any).errors); // Loguea el error real
        throw new Error((errorData as any).message || "Error al guardar el proyecto");
      }

      await response.json();
      toast.success(`Proyecto ${isEdit ? "actualizado" : isPublic ? "enviado para revisión" : "creado y subido"} exitosamente!`);
      
      if (!isEdit) {
        localStorage.removeItem("pandoras-project-form");
        localStorage.removeItem("pandoras-project-step");
      }
      
      if (isPublic) {
        router.push("/applicants");
      } else {
        router.push("/admin/dashboard");
      }
      router.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Ocurrió un error al guardar el proyecto";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const onAdminQuickSubmit = async (data: FullProjectFormData) => {
    if (isPublic) return; // No quick submit for public users
    
    setIsLoading(true);
    
    // Preparamos los datos, convirtiendo `undefined` a 0 en la distribución
    // y luego stringificando los campos anidados.
    const finalDistribution = {
      publicSale: data.tokenDistribution?.publicSale ?? 0,
      team: data.tokenDistribution?.team ?? 0,
      treasury: data.tokenDistribution?.treasury ?? 0,
      marketing: data.tokenDistribution?.marketing ?? 0,
    };

    const preparedData = {
      ...data,
      teamMembers: JSON.stringify(data.teamMembers || []),
      advisors: JSON.stringify(data.advisors || []),
      tokenDistribution: JSON.stringify(finalDistribution),
    };

    try {
      const response = await fetch(apiEndpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...preparedData, status: "approved" }), // Forzamos el estado a 'approved'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error del servidor (${response.status}):`, errorData); // Loguea el error real y completo
        throw new Error((errorData as any).message || "Error al guardar el proyecto");
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

  return (
    <div className="min-h-screen bg-zinc-950">
      <FormProvider {...methods}>
        <div className="max-w-4xl mx-auto p-4 md:p-8">
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
              <div className="text-sm text-gray-500">
                {currentStep > 1 && (
                  <button
                    onClick={prevStep}
                    className="text-lime-400 hover:text-lime-300 mr-4"
                  >
                    ← Anterior
                  </button>
                )}
                {currentStep < totalSteps && (
                  <button
                    onClick={nextStep}
                    className="text-lime-400 hover:text-lime-300"
                    disabled={!isAdminUser && Object.keys(errors).length > 0}
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>

            {/* Renderizar sección actual */}
            {currentStep === 1 && <ProjectSection1 />}
            {currentStep === 2 && <ProjectSection2 />}
            {currentStep === 3 && <ProjectSection3 />}
            {currentStep === 4 && <ProjectSection4 />}
            {currentStep === 5 && <ProjectSection5 />}
            {currentStep === 6 && <ProjectSection6 />}
            {currentStep === 7 && <ProjectSection7 />}
          </div>

          {/* Botones de Acción - Solo en el último paso */}
          {currentStep === totalSteps && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                type="submit"
                variant="secondary"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isEdit ? "Guardar Cambios" : isPublic ? "Enviar Aplicación" : "Guardar Borrador"}
              </Button>
              
              {!isPublic && isAdminUser && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={async () => {
                    const data = methods.getValues();
                    await onAdminQuickSubmit(data);
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
        </div>
      </FormProvider>
    </div>
  );
}