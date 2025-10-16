'use client';

import React, { createContext, useContext, useState } from 'react';
import { ProjectApplicationModal } from '@/components/modals/ProjectApplicationModal';

interface ProjectModalContextType {
  isOpen: boolean;
  open: () => Promise<void>;
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
    <ProjectApplicationModal
      isOpen={true}
      onClose={close}
      isAdminMode={false}
    />
  );
}

export function ProjectModalProvider({ children }: ProjectModalProviderProps) {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);

  const openProjectModal = async () => {
    // Check admin status when opening modal
    try {
      const response = await fetch('/api/admin/verify');
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

    setIsProjectModalOpen(true);
  };

  const closeProjectModal = () => setIsProjectModalOpen(false);

  const contextValue: ProjectModalContextType = {
    isOpen: isProjectModalOpen,
    open: openProjectModal,
    close: closeProjectModal,
    FormComponent: ProjectFormComponent,
  };

  return (
    <ProjectModalContext.Provider value={contextValue}>
      {isProjectModalOpen ? (
        <ProjectApplicationModal
          isOpen={true}
          onClose={closeProjectModal}
          isAdminMode={isAdminMode}
        />
      ) : children}
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
