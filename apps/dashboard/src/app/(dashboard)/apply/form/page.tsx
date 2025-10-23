"use client";

import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon, Shield, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";
import { ApplicationSuccessNotification } from "@/components/apply/ApplicationSuccessNotification";
import { ApplicationDraftNotification } from "@/components/apply/ApplicationDraftNotification";
import { EnhancedMultiStepForm } from "@/components/apply/EnhancedMultiStepForm";




// Force dynamic rendering - this page uses authentication and should not be prerendered
export const dynamic = 'force-dynamic';

export default function ApplyFormPage() {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isLoading] = useState(false);

  // Mostrar indicador de carga si el formulario está procesando
  const showLoadingIndicator = isFormLoading || isLoading;

  useEffect(() => {
    // Check admin status when component mounts (igual que en el modal original)
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          headers: {
            'Content-Type': 'application/json',
          }
        });
        if (response.ok) {
          const data = await response.json() as { isAdmin?: boolean; isSuperAdmin?: boolean };
          setIsAdminMode(Boolean(data.isAdmin ?? data.isSuperAdmin ?? false));
        } else {
          setIsAdminMode(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdminMode(false);
      }
    };

    void checkAdminStatus();
  }, []);

  // Sistema de detección ultra-sensible para eventos del formulario
  useEffect(() => {
    let lastFormData = localStorage.getItem("pandoras-project-form");
    let lastStep = localStorage.getItem("pandoras-project-step");
    let lastDataSize = lastFormData ? JSON.stringify(JSON.parse(lastFormData)).length : 0;

    const checkFormEvents = () => {
      const currentFormData = localStorage.getItem("pandoras-project-form");
      const currentStep = localStorage.getItem("pandoras-project-step");

      console.log("🔍 Monitoreo localStorage:", {
        lastFormData: lastFormData ? "presente" : "null",
        currentFormData: currentFormData ? "presente" : "null",
        lastStep,
        currentStep,
        lastDataSize,
        currentDataSize: currentFormData ? JSON.stringify(JSON.parse(currentFormData)).length : 0
      });

      // Detectar envío exitoso: datos del formulario desaparecen después del envío
      if (lastFormData && currentFormData === null) {
        console.log("🎉 ¡ENVÍO DETECTADO! - localStorage limpiado después del envío");
        const notificationShown = sessionStorage.getItem("application-success-shown");
        if (!notificationShown) {
          console.log("🎉 Mostrando notificación de éxito");
          setShowSuccessNotification(true);
          sessionStorage.setItem("application-success-shown", "true");
        }
      }

      // Detectar borrador guardado: verificar si se agregó información significativa
      if (currentFormData && lastFormData) {
        try {
          const currentData = JSON.parse(currentFormData) as Record<string, unknown>;
          const currentSize = JSON.stringify(currentData).length;

          // Si los datos aumentaron significativamente (> 200 caracteres), probablemente se guardó
          if (currentSize > lastDataSize + 200) {
            console.log("💾 ¡BORRADOR DETECTADO! - datos aumentaron significativamente");
            const draftNotificationShown = sessionStorage.getItem("draft-saved-shown");
            if (!draftNotificationShown) {
              console.log("💾 Mostrando notificación de borrador");
              setShowDraftNotification(true);
              sessionStorage.setItem("draft-saved-shown", "true");
            }
          }

          lastDataSize = currentSize;
        } catch (error) {
          console.error("Error parsing form data:", error);
        }
      }

      // Actualizar valores para próxima comparación
      lastFormData = currentFormData;
      lastStep = currentStep;
    };

    // Verificar cada 500ms para mejor detección
    const interval = setInterval(checkFormEvents, 500);

    return () => clearInterval(interval);
  }, []);

  // Sistema adicional: monitorear cambios en el DOM para detectar eventos del formulario
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "pandoras-project-form" || e.key === "pandoras-project-step") {
        console.log("💾 Cambio detectado en localStorage:", e.key, e.newValue ? "presente" : "null");

        if (e.key === "pandoras-project-form" && e.oldValue && !e.newValue) {
          console.log("🎉 ¡ENVÍO DETECTADO vía StorageEvent! - localStorage limpiado");
          const notificationShown = sessionStorage.getItem("application-success-shown");
          if (!notificationShown) {
            setShowSuccessNotification(true);
            sessionStorage.setItem("application-success-shown", "true");
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleNotificationClose = () => {
    setShowSuccessNotification(false);
    // Redirigir después de cerrar la notificación
    window.location.href = "/";
  };

  const handleDraftNotificationClose = () => {
    setShowDraftNotification(false);
    // Limpiar la bandera para permitir futuras notificaciones de borrador
    sessionStorage.removeItem("draft-saved-shown");
    // Redirigir a la página de aplicantes
    window.location.href = "/applicants";
  };

  const handleContinueApplication = () => {
    setShowDraftNotification(false);
    // Limpiar la bandera para permitir futuras notificaciones de borrador
    sessionStorage.removeItem("draft-saved-shown");
    // El usuario puede continuar con la aplicación
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white relative">
      <AnimatedBackground />

      <div className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-10 backdrop-blur-xl bg-zinc-950/80 border-b border-zinc-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/apply" passHref>
                  <Button
                    variant="ghost"
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  >
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Volver a Información
                  </Button>
                </Link>

                <div className="hidden md:flex items-center gap-2 text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-lime-400" />
                    <span>Proceso Seguro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-lime-400" />
                    <span>45-60 min estimado</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-lime-500/10 border border-lime-500/20 rounded-full">
                  <CheckCircle className="w-4 h-4 text-lime-400" />
                  <span className="text-sm text-lime-400 font-medium">Aplicación Premium</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="border-b border-zinc-800"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-8 h-8 bg-lime-500 text-black rounded-full flex items-center justify-center font-bold">1</div>
                <span>Información</span>
              </div>
              <div className="w-px h-8 bg-zinc-700" />
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center font-bold">2</div>
                <span>Tokenomics</span>
              </div>
              <div className="w-px h-8 bg-zinc-700" />
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center font-bold">3</div>
                <span>Equipo</span>
              </div>
              <div className="w-px h-8 bg-zinc-700" />
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center font-bold">4</div>
                <span>Legal</span>
              </div>
              <div className="w-px h-8 bg-zinc-700" />
              <div className="flex items-center gap-2 text-zinc-400">
                <div className="w-8 h-8 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center font-bold">5</div>
                <span>Review</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        >
          {/* Header Section */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/10 border border-lime-500/20 rounded-full mb-6"
            >
              <Shield className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium text-lime-400">Formulario Seguro</span>
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
              <span className="bg-gradient-to-r from-white via-lime-200 to-white bg-clip-text text-transparent">
                Aplicación para
              </span>
              <br />
              <span className="bg-gradient-to-r from-lime-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">
                Tokenización Premium
              </span>
            </h1>

            <p className="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
              Completa esta aplicación detallada para que nuestro equipo pueda evaluar adecuadamente
              el potencial de tu proyecto. <span className="text-lime-400 font-semibold">La información completa</span> es crucial para una evaluación precisa.
            </p>
          </div>

          {/* Form Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-zinc-900/60 rounded-2xl border border-zinc-800 backdrop-blur-sm overflow-hidden"
          >
            <div className="p-6 md:p-8 lg:p-12">
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-lime-500/20 border-t-lime-500 rounded-full animate-spin" />
                      <p className="text-zinc-400">Cargando formulario...</p>
                    </div>
                  </div>
                }
              >
                <div className="relative">
                  <EnhancedMultiStepForm
                    project={null}
                    isEdit={false}
                    apiEndpoint={isAdminMode ? "/api/admin/projects" : "/api/projects/draft"}
                    isPublic={!isAdminMode}
                    onSuccess={() => {
                      console.log("🚀 ¡Aplicación enviada exitosamente!");
                      setShowSuccessNotification(true);
                    }}
                    onDraft={() => {
                      console.log("📝 ¡Borrador guardado exitosamente!");
                      setShowDraftNotification(true);
                    }}
                    onLoading={setIsFormLoading}
                  />

                  {/* Overlay de carga personalizado */}
                  {showLoadingIndicator && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-2xl">
                      <div className="bg-zinc-900 border border-lime-500/30 rounded-xl p-8 text-center shadow-2xl">
                        <div className="w-16 h-16 border-4 border-lime-500/20 border-t-lime-500 rounded-full animate-spin mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">
                          Procesando...
                        </h3>
                        <p className="text-zinc-400">
                          Procesando tu aplicación premium
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Suspense>
            </div>
          </motion.div>

          {/* Help Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-12 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-lime-500/10 border border-lime-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-lime-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white mb-2">¿Necesitas Ayuda?</h3>
                <p className="text-zinc-400 mb-4">
                  Nuestro equipo está disponible para asistirte durante el proceso de aplicación.
                  Si tienes dudas sobre algún campo o necesitas aclaraciones, no dudes en contactarnos.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-lime-400" />
                    <span>Soporte técnico disponible</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-lime-400" />
                    <span>Información guardada automáticamente</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-400">
                    <CheckCircle className="w-4 h-4 text-lime-400" />
                    <span>Proceso confidencial y seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Notificación de éxito premium */}
      <ApplicationSuccessNotification
        isOpen={showSuccessNotification}
        onClose={handleNotificationClose}
        title="¡Aplicación Enviada Exitosamente!"
        description="Tu proyecto ha sido recibido y está siendo procesado por nuestro equipo de revisión. Te contactaremos pronto con los próximos pasos del proceso de selección elite."
        redirectDelay={8}
        redirectUrl="/"
      />

      {/* Notificación de borrador premium */}
      <ApplicationDraftNotification
        isOpen={showDraftNotification}
        onClose={handleDraftNotificationClose}
        onContinue={handleContinueApplication}
        title="¡Borrador Guardado Exitosamente!"
        description="Tu progreso ha sido guardado de forma segura. Puedes continuar con tu aplicación en cualquier momento sin perder ningún avance."
        redirectDelay={5}
        redirectUrl="/applicants"
      />
    </div>
  );
}
