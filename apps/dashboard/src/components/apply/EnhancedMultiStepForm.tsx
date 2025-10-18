"use client";

import { useState, useEffect } from "react";
import { MultiStepForm } from "@/app/(dashboard)/admin/projects/[id]/edit/multi-step-form";

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

interface EnhancedMultiStepFormProps {
  project?: Project | null;
  isEdit?: boolean;
  apiEndpoint?: string;
  isPublic?: boolean;
  onSuccess?: () => void;
  onDraft?: () => void;
  onLoading?: (loading: boolean) => void;
}

export function EnhancedMultiStepForm({
  project,
  isEdit = false,
  apiEndpoint = "/api/admin/projects",
  isPublic = false,
  onSuccess,
  onDraft,
  onLoading
}: EnhancedMultiStepFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interceptar los métodos originales del MultiStepForm
  useEffect(() => {
    // Monitorear cambios en el DOM para detectar cuando se hace click en botones
    const handleButtonClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const button = target.closest('button');

      if (button) {
        const buttonText = button.textContent?.toLowerCase() ?? '';

        if (buttonText.includes('enviar aplicación') || buttonText.includes('publicar')) {
          console.log("🚀 ¡Botón de envío detectado! Activando callback personalizado");
          setIsSubmitting(true);
          onLoading?.(true);

          // Simular el proceso de envío
          setTimeout(() => {
            onSuccess?.();
            setIsSubmitting(false);
            onLoading?.(false);
          }, 2000); // Simular tiempo de procesamiento
        } else if (buttonText.includes('guardar') && !buttonText.includes('enviar')) {
          console.log("📝 ¡Botón de borrador detectado! Activando callback personalizado");
          setIsSubmitting(true);
          onLoading?.(true);

          setTimeout(() => {
            onDraft?.();
            setIsSubmitting(false);
            onLoading?.(false);
          }, 1000);
        }
      }
    };

    // Agregar listener después de que el componente se monte
    setTimeout(() => {
      document.addEventListener('click', handleButtonClick);
    }, 100);

    return () => {
      document.removeEventListener('click', handleButtonClick);
    };
  }, [onSuccess, onDraft, onLoading]);

  return (
    <div className="relative">
      <MultiStepForm
        project={project}
        isEdit={isEdit}
        apiEndpoint={apiEndpoint}
        isPublic={isPublic}
      />

      {/* Overlay de carga personalizado */}
      {isSubmitting && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
          <div className="bg-zinc-900 border border-lime-500/30 rounded-xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 border-4 border-lime-500/20 border-t-lime-500 rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">
              {onDraft ? "Guardando Borrador..." : "Enviando Aplicación..."}
            </h3>
            <p className="text-zinc-400">
              {onDraft ? "Procesando tu borrador de forma segura" : "Procesando tu aplicación premium"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}