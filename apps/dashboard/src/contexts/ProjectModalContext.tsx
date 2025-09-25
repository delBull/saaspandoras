'use client';

import React, { createContext, useContext, useState } from 'react';
import { MultiStepForm } from '@/app/(dashboard)/admin/projects/[id]/edit/multi-step-form';
import { Button } from '@saasfly/ui/button';
import { ArrowLeftIcon } from 'lucide-react';

interface ProjectModalContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  FormComponent: React.ComponentType;
}

const ProjectModalContext = createContext<ProjectModalContextType | null>(null);

interface ProjectModalProviderProps {
  children: React.ReactNode;
}

function ProjectFormComponent() {
  const { close } = useProjectModal();

  return (
    <div className="min-h-screen text-white bg-zinc-950">
      {/* Header with Cancel Button */}
      <div className="top-0 z-10 flex items-center p-6 backdrop-blur">
        <Button
          variant="ghost"
          onClick={close}
          className="text-gray-400 hover:text-white hover:bg-zinc-700 mr-4 p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Cancelar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Aplicar Nuevo Proyecto</h1>
          <p className="text-gray-400">Completa el formulario multi-step para enviar tu aplicación</p>
        </div>
      </div>

      {/* Form Content - Matching Admin Layout */}
      <section className="py-12 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-zinc-900/60 rounded-2xl p-6 md:p-8 border border-lime-400/20">
            <MultiStepForm
              project={null}
              isEdit={false}
              apiEndpoint="/api/projects/draft"
              isPublic={true}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProjectModalProvider({ children }: ProjectModalProviderProps) {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const openProjectModal = () => setIsProjectModalOpen(true);
  const closeProjectModal = () => setIsProjectModalOpen(false);

  const contextValue: ProjectModalContextType = {
    isOpen: isProjectModalOpen,
    open: openProjectModal,
    close: closeProjectModal,
    FormComponent: ProjectFormComponent,
  };

  return (
    <ProjectModalContext.Provider value={contextValue}>
      {isProjectModalOpen ? <ProjectFormComponent /> : children}
    </ProjectModalContext.Provider>
  );
}

export function useProjectModal() {
  const context = useContext(ProjectModalContext);
  if (!context) {
    throw new Error('useProjectModal must be used within ProjectModalProvider');
  }
  return context;
}
