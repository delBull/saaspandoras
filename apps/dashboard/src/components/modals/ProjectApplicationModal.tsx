'use client';

import React from 'react';
import { MultiStepForm } from "@/app/(dashboard)/admin/projects/[id]/edit/multi-step-form";

interface ProjectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminMode?: boolean;
}

export function ProjectApplicationModal({ isOpen, onClose, isAdminMode = false }: ProjectApplicationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-zinc-950 overflow-hidden">
      <div className="h-screen flex flex-col text-white bg-zinc-950">
        {/* Header with Cancel Button */}
        <div className="flex items-center p-6 backdrop-blur border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-zinc-700 mr-4 p-2 rounded transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Cancelar
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">
              {isAdminMode ? "Crear Nuevo Proyecto (Admin)" : "Aplicar Nuevo Proyecto"}
            </h1>
            <p className="text-gray-400 truncate">
              {isAdminMode
                ? "Completa el formulario para crear un proyecto aprobado"
                : "Completa el formulario multi-step para enviar tu aplicación"
              }
            </p>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto">
          <section className="py-12 md:py-24">
            <div className="max-w-4xl mx-auto px-6">
              <div className={`bg-zinc-900/60 rounded-2xl p-6 md:p-8 border ${
                isAdminMode ? 'border-purple-400/20' : 'border-lime-400/20'
              }`}>
                {isAdminMode && (
                  <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-purple-400">👑</span>
                      <span className="text-sm font-semibold text-purple-400">Modo Administrador</span>
                    </div>
                    <p className="text-xs text-purple-200">
                      • La creación se creará como borrador automáticamente<br/>
                      • La validación es más flexible para permitir pruebas
                    </p>
                  </div>
                )}
                <MultiStepForm
                  project={null}
                  isEdit={false}
                  apiEndpoint={isAdminMode ? "/api/admin/projects-quick" : "/api/projects/draft"}
                  isPublic={!isAdminMode}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
