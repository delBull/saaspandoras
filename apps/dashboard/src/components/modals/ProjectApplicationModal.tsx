'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@saasfly/ui/dialog';
import { MultiStepForm } from "@/app/(dashboard)/admin/projects/[id]/edit/multi-step-form";

interface ProjectApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectApplicationModal({ isOpen, onClose }: ProjectApplicationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-8 pb-4">
          <DialogTitle className="text-3xl font-bold text-white">
            Aplicar Nuevo Proyecto
          </DialogTitle>
          <p className="text-gray-400 text-base mt-3">
            Completa el formulario multi-step para enviar tu aplicación
          </p>
        </DialogHeader>
        <div className="px-8 pb-8">
          <MultiStepForm
            project={null}
            isEdit={false}
            apiEndpoint="/api/projects/draft"
            isPublic={true}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
