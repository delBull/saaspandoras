"use client";

import React from "react";
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { Button } from "@saasfly/ui/button";
import { ApplicantsDesktop } from "./ApplicantsDesktop";
import { ApplicantsMobile } from "./ApplicantsMobile";
import { MultiStepForm } from "../../app/(dashboard)/admin/projects/[id]/edit/multi-step-form";
import { useApplicantsData, type ApplicantsData } from "../../hooks/applicants/useApplicantsData";

interface FormProps {
  showForm: boolean;
  onCancel: () => void;
}

function NewProjectForm({ showForm, onCancel }: FormProps) {
  if (!showForm) return null;

  return (
    <div className="min-h-screen text-white">
      {/* Header with Cancel Button */}
      <div className="sticky top-0 z-10 flex items-center p-6 backdrop-blur">
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-gray-400 hover:text-white hover:bg-zinc-700 mr-4 p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Cancelar
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Crear Nuevo Proyecto</h1>
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
              apiEndpoint="/api/projects/apply"
              isPublic={true}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ApplicantsPage() {
  const {
    loading,
    pendingProjects,
    approvedProjects,
    isPendingPanelCollapsed,
    showMobilePendingModal,
    setIsPendingPanelCollapsed,
    setShowMobilePendingModal,
  }: ApplicantsData = useApplicantsData();
  const [showForm, setShowForm] = React.useState(false);

  const handleApplyClick = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-lime-500" />
          <p className="text-lg text-gray-400">Cargando Proyectos...</p>
        </div>
      </div>
    );
  }

  // Si está mostrando el formulario, renderiza eso
  if (showForm) {
    return <NewProjectForm showForm={showForm} onCancel={handleCancel} />;
  }

  return (
    <>
      <ApplicantsDesktop
        pendingProjects={pendingProjects}
        approvedProjects={approvedProjects}
        isPendingPanelCollapsed={isPendingPanelCollapsed}
        onTogglePanelCollapse={() => setIsPendingPanelCollapsed(!isPendingPanelCollapsed)}
        onApplyClick={handleApplyClick}
      />

      <ApplicantsMobile
        pendingProjects={pendingProjects}
        approvedProjects={approvedProjects}
        showMobileModal={showMobilePendingModal}
        setShowMobileModal={setShowMobilePendingModal}
        onApplyClick={handleApplyClick}
      />
    </>
  );
}
