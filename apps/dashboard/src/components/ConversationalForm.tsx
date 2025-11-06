"use client";
import { useState, useEffect, useCallback } from 'react';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import type { FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
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
// 🎯 COMPONENTES MODULARIZADOS
import ProgressBar from './conversational-form/ProgressBar';
import FormContent from './conversational-form/FormContent';
import Navigation from './conversational-form/Navigation';
import { projectSchema, type ProjectFormData } from './conversational-form/types';
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

  const handleAcceptanceChange = (checked: boolean) => {
    setAcceptanceChecked(checked);
    setValue('verificationAgreement', checked ? 'accepted' : '');
  };

  const handleOpenTermsModal = () => {
    openModal();
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
            {/* Contenido del formulario */}
            <FormContent
              currentStep={currentStep}
              currentQuestion={currentQuestion}
              projectTitle={projectTitle}
              formQuestions={formQuestions}
              acceptanceChecked={acceptanceChecked}
              onAcceptanceChange={handleAcceptanceChange}
              setValue={setValue as <TName extends string | number | symbol>(name: TName, value: unknown) => void}
              setInfoModal={setInfoModal}
              onOpenTermsModal={handleOpenTermsModal}
            />

            {/* Navegación */}
            <Navigation
              currentStep={currentStep}
              totalSteps={formQuestions.length}
              isSubmitting={isSubmitting}
              acceptanceChecked={acceptanceChecked}
              onPrevStep={prevStep}
              onNextStep={nextStep}
              onSubmit={handleSubmit(onSubmit)}
            />
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