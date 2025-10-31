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

      {/* Modal Panel - Positioned with top margin to clear mobile header */}
      <div className="absolute top-20 left-2 right-2 bottom-2 bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/95">
          <h3 className="text-lg font-bold text-white">{displayTitle}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Content with proper scrolling */}
        <div className="overflow-y-auto h-[calc(100%-60px)] p-2">
          <ProjectGrid projects={displayProjects} variant={displayVariant} />
        </div>
      </div>
    </div>
  );
}
