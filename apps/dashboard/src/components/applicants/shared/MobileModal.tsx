import { X } from "lucide-react";
import { ProjectGrid } from "./ProjectGrid";
import type { Project } from "../../../hooks/applicants/useApplicantsData";

interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendingProjects: Project[];
}

export function MobileModal({ isOpen, onClose, pendingProjects }: MobileModalProps) {
  return (
    <div className={`fixed inset-0 z-50 lg:hidden transform transition-transform duration-500 ${
      isOpen ? 'translate-y-0' : 'translate-y-full'
    }`}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 min-h-[90vh] overflow-hidden border-t border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">Proyectos en Revisión</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-81px)] p-6 pt-2">
          <ProjectGrid projects={pendingProjects} variant="pending" />
        </div>
      </div>
    </div>
  );
}
