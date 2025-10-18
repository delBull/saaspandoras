"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@saasfly/ui";

interface Step {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

interface ApplicationProgressProps {
  steps: Step[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function ApplicationProgress({ steps, onStepClick, className }: ApplicationProgressProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center relative">
              <motion.button
                initial={{ scale: 0.8 }}
                animate={{ scale: step.current ? 1.1 : 1 }}
                whileHover={onStepClick && !step.completed ? { scale: 1.05 } : {}}
                whileTap={onStepClick && !step.completed ? { scale: 0.95 } : {}}
                onClick={() => onStepClick?.(step.id)}
                disabled={!onStepClick || step.completed}
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                  step.completed
                    ? "bg-lime-500 border-lime-500 text-white"
                    : step.current
                    ? "bg-zinc-800 border-lime-400 text-lime-400"
                    : "bg-zinc-800 border-zinc-600 text-zinc-400",
                  onStepClick && !step.completed && "hover:border-lime-300 cursor-pointer"
                )}
              >
                {step.completed ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="font-bold text-sm">{index + 1}</span>
                )}
              </motion.button>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[100px]">
                <div className={cn(
                  "text-sm font-medium transition-colors",
                  step.completed || step.current ? "text-white" : "text-zinc-400"
                )}>
                  {step.title}
                </div>
                <div className="text-xs text-zinc-500 mt-1 hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-px mx-4 relative">
                <div className="h-full bg-zinc-700" />
                {step.completed && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    className="absolute inset-0 bg-gradient-to-r from-lime-500 to-emerald-500 origin-left"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface NavigationButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSave?: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  showSave?: boolean;
  className?: string;
}

export function NavigationButtons({
  onPrevious,
  onNext,
  onSave,
  canGoPrevious = false,
  canGoNext = false,
  isLoading = false,
  nextLabel = "Siguiente",
  showSave = false,
  className
}: NavigationButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex items-center justify-between pt-8 border-t border-zinc-800", className)}
    >
      <div>
        {onPrevious && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: canGoPrevious ? 1 : 0.5, x: 0 }}
            whileHover={canGoPrevious ? { scale: 1.02 } : {}}
            whileTap={canGoPrevious ? { scale: 0.98 } : {}}
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200",
              canGoPrevious
                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                : "bg-zinc-900 text-zinc-500 cursor-not-allowed"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </motion.button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showSave && onSave && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onSave}
            disabled={isLoading}
            className="px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors"
          >
            Guardar Progreso
          </motion.button>
        )}

        {onNext && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: canGoNext ? 1 : 0.5, x: 0 }}
            whileHover={canGoNext ? { scale: 1.02 } : {}}
            whileTap={canGoNext ? { scale: 0.98 } : {}}
            onClick={onNext}
            disabled={!canGoNext || isLoading}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all duration-200",
              canGoNext && !isLoading
                ? "bg-gradient-to-r from-lime-500 to-emerald-500 text-black hover:from-lime-400 hover:to-emerald-400"
                : "bg-zinc-900 text-zinc-500 cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-black border-t-transparent rounded-full"
              />
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}