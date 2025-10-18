"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowLeftIcon, Shield, Clock, CheckCircle } from "lucide-react";
import { Button } from "@saasfly/ui/button";
import Link from "next/link";
import { MultiStepForm } from "../../admin/projects/[id]/edit/multi-step-form";
import { AnimatedBackground } from "@/components/apply/AnimatedBackground";

export default function ApplyFormPage() {
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
                <MultiStepForm
                  project={null}
                  isEdit={false}
                  apiEndpoint="/api/projects/draft"
                  isPublic={true}
                />
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
    </div>
  );
}