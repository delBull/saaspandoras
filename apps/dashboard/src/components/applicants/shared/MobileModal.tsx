import { X } from "lucide-react";
import { ProjectGrid } from "./ProjectGrid";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingProjects: Project[];
  approvedProjects?: Project[];
  title?: string;
}

export function MobileModal({ isOpen, onClose, pendingProjects, approvedProjects, title }: MobileModalProps) {
  // Si hay approvedProjects, usamos esos, si no, usamos pending
  const displayProjects = approvedProjects ?? pendingProjects;
  const displayTitle = title ?? 'Creaciones en Revisión';
  const displayVariant: 'pending' | 'approved' = approvedProjects ? 'approved' : 'pending';
  return (
    <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-out ${
      isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-full invisible'
    }`}>
      {/* Backdrop */}
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      {/* Modal Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 min-h-[90vh] overflow-hidden border-t border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">{displayTitle}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-81px)] px-6 lg:px-0 py-8">
          <ProjectGrid projects={displayProjects} variant={displayVariant} />
        </div>
      </div>
    </div>
  );
}
