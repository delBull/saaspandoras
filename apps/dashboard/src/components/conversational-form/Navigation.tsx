"use client";
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  acceptanceChecked: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
}

export default function Navigation({
  currentStep,
  totalSteps,
  isSubmitting,
  acceptanceChecked,
  onPrevStep,
  onNextStep,
  onSubmit
}: NavigationProps) {
  return (
    <>
      {/* Navegación */}
      <div className="flex justify-between items-center pt-8">
        <Button
          type="button"
          onClick={onPrevStep}
          disabled={currentStep === 0}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </Button>

        {currentStep === totalSteps - 1 ? (
          <Button
            type="button"
            onClick={onSubmit}
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
            onClick={onNextStep}
            className="bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-bold px-8 py-3 rounded-xl hover:from-lime-400 hover:to-emerald-400 transition-all duration-300 flex items-center gap-2"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Indicador de paso */}
      <div className="text-center text-zinc-500 text-sm">
        Paso {currentStep + 1} de {totalSteps}
      </div>
    </>
  );
}