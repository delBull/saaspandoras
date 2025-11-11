"use client";
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useInfoModals } from './modals';
import {
  TextInput,
  TextareaInput,
  SelectInput,
  NumberInput,
  UrlInput,
  CheckboxInput,
  RecurringRewardsInput,
  FileInput
} from './inputComponents';
import type { FormQuestion } from './types';

interface FormContentProps {
  currentStep: number;
  currentQuestion: FormQuestion | undefined;
  projectTitle: string;
  formQuestions: FormQuestion[];
  acceptanceChecked: boolean;
  onAcceptanceChange: (checked: boolean) => void;
  setValue: <TName extends string | number | symbol>(name: TName, value: unknown) => void;
  setInfoModal: (state: { isOpen: boolean; title: string; description: string; content: React.ReactNode; icon?: string }) => void;
  onOpenTermsModal: () => void;
}

export default function FormContent({
  currentStep,
  currentQuestion,
  projectTitle,
  formQuestions,
  acceptanceChecked,
  onAcceptanceChange,
  setValue,
  setInfoModal,
  onOpenTermsModal
}: FormContentProps) {
  const { watch } = useFormContext();

  // Personalizar labels basado en el nombre del proyecto
  const getPersonalizedLabel = useCallback((originalLabel: string, title: string): string => {
    if (!title || title === 'tu Creación') {
      return originalLabel;
    }
    return originalLabel
      .replace(/Protocolo de Utilidad/g, title);
  }, []);

  // Hook para modales
  const modals = useInfoModals(setInfoModal);

  // Verificar si se debe mostrar el campo de detalles legales
  const legalStatus = watch('legalStatus');
  const showLegalStatusDetails = legalStatus === 'otra_jurisdiccion' || legalStatus === 'otra_entidad_mexico' || legalStatus === 'otra_entidad_usa';

  // Función para renderizar componente de input
  const renderInputComponent = useCallback((question: FormQuestion) => {
    const baseProps = { name: question.id, placeholder: question.placeholder };

    switch (question.component) {
      case 'text-input': {
        let onHelpClick;
        if (question.id === 'legalStatus') {
          onHelpClick = modals.openLegalModal;
        } else if (question.id === 'monetizationModel') {
          onHelpClick = modals.openMonetizationModalDetailed;
        }
        return <TextInput {...baseProps} maxLength={question.maxLength} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'textarea-input': {
        let onHelpClick;
        if (question.id === 'protoclMecanism') {
          onHelpClick = modals.openBenefitModal;
        } else if (question.id === 'artefactUtility') {
          onHelpClick = modals.openUtilityModal;
        } else if (question.id === 'worktoearnMecanism') {
          onHelpClick = modals.openWorkToEarnModal;
        } else if (question.id === 'adquireStrategy') {
          onHelpClick = modals.openAdoptionStrategyModal;
        }
        return <TextareaInput {...baseProps} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'select-input': {
        let onHelpClick;
        if (question.id === 'tokenType') {
          onHelpClick = modals.openTokenTypeModal;
        }
        return <SelectInput {...baseProps} options={question.options} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'number-input': {
        let onHelpClick;
        if (question.id === 'totalTokens') {
          onHelpClick = modals.openSupplyModal;
        } else if (question.id === 'tokensOffered') {
          onHelpClick = modals.openCommunityOfferingModal;
        }
        return <NumberInput {...baseProps} relatedField={question.relatedField} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'url-input': {
        let onHelpClick;
        if (question.id === 'whitepaperUrl') {
          onHelpClick = modals.openMechanicModal;
        }
        return <UrlInput {...baseProps} info={question.info} onHelpClick={onHelpClick} />;
      }
      case 'file-input':
        return <FileInput {...baseProps} accept="image/png,image/jpeg,image/svg+xml" info={question.info} />;
      case 'checkbox-input':
        return <CheckboxInput name={question.id} info={question.info} label={question.label} />;
      case 'recurring-rewards-input':
        return <RecurringRewardsInput onHelpClick={modals.openRecurringRewardsModal} />;
      default:
        return <TextInput {...baseProps} />;
    }
  }, [modals]);

  return (
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
                Declaración del Creador (Aceptación de Términos SaaS): Declaro que toda la información proporcionada es precisa. Entiendo y acepto que Pandora's Finance actúa exclusivamente como un proveedor de infraestructura SaaS 'no-code', y que soy el único responsable de la estructura legal, la promesa de utilidad y la gestión de la comunidad de mi 'Piterillos' y sus Artefactos.
              </div>

              {/* Checkbox de aceptación */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={acceptanceChecked}
                  onChange={(e) => {
                    onAcceptanceChange(e.target.checked);
                  }}
                  className="mt-1 w-5 h-5 text-lime-400 bg-zinc-800 border-zinc-600 rounded focus:ring-lime-400 focus:ring-2"
                />
                <span className="text-white text-base leading-relaxed">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={onOpenTermsModal}
                    className="text-lime-400 underline hover:text-lime-300 transition-colors"
                  >
                    términos y condiciones
                  </button>{" "}
                  del servicio SaaS de Pandora's Finance
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

              {/* Campo adicional para detalles legales cuando se selecciona "otra" */}
              {currentQuestion.id === 'legalStatus' && showLegalStatusDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6"
                >
                  <div className="block font-bold text-white text-2xl md:text-3xl leading-tight">
                    Especifica detalles adicionales sobre tu estatus legal
                  </div>
                  <TextInput
                    name="legalStatusDetails"
                    placeholder="Ej: Sociedad Anónima en Panamá, Cooperativa en Argentina, etc."
                    maxLength={256}
                    info="Si seleccionaste 'Otra jurisdicción' o 'Otra Entidad', especifica aquí los detalles exactos de tu estatus legal y jurisdicción."
                  />
                </motion.div>
              )}
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
