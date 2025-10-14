"use client";

// Force dynamic rendering - this page uses cookies and should not be prerendered
export const dynamic = 'force-dynamic';

import React from "react";
import { Loader2, ArrowLeftIcon } from "lucide-react";
import { Button } from "@saasfly/ui/button";
import { ApplicantsDesktop } from "./ApplicantsDesktop";
import { ApplicantsMobile } from "./ApplicantsMobile";
import { ApplicantsFilters } from "./ApplicantsFilters";
import { MultiStepForm } from "../../app/(dashboard)/admin/projects/[id]/edit/multi-step-form";
import { useApplicantsDataBasic, type ApplicantsData } from "../../hooks/applicants/useApplicantsDataBasic";
import { useProjectFilters } from "../../hooks/applicants/useProjectFilters";

interface FormProps {
  showForm: boolean;
  onCancel: () => void;
}

function NewProjectForm({ showForm, onCancel }: FormProps) {
  if (!showForm) return null;

  return (
    <div className="min-h-screen text-white">
      {/* Header with Cancel Button */}
      <div className="top-0 z-10 flex items-center p-6 backdrop-blur">
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
              apiEndpoint="/api/projects/draft"
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
  }: ApplicantsData = useApplicantsDataBasic();

  // Sistema de filtros mejorado
  const {
    viewMode,
    setViewMode,
    gridColumns,
    setGridColumns,
    filters,
    setFilters,
    filteredProjects,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    totalProjects,
    filteredCount,
  } = useProjectFilters([...pendingProjects, ...approvedProjects]);

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

  // Separar proyectos filtrados en pending y approved
  const filteredPendingProjects = filteredProjects.filter(p => p.status === 'pending');
  const filteredApprovedProjects = filteredProjects.filter(p => ['approved', 'live', 'completed'].includes(p.status));

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950/0">
      {/* Filtros y controles mejorados */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/0 backdrop-blur-xl border-b border-gray-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <ApplicantsFilters
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            gridColumns={gridColumns}
            onGridColumnsChange={setGridColumns}
            filters={filters}
            onFiltersChange={setFilters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalProjects={totalProjects}
            filteredCount={filteredCount}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ApplicantsDesktop
          pendingProjects={filteredPendingProjects}
          approvedProjects={filteredApprovedProjects}
          isPendingPanelCollapsed={isPendingPanelCollapsed}
          onTogglePanelCollapse={() => setIsPendingPanelCollapsed(!isPendingPanelCollapsed)}
          onApplyClick={handleApplyClick}
          viewMode={viewMode}
          gridColumns={gridColumns}
        />

        <ApplicantsMobile
          pendingProjects={filteredPendingProjects}
          approvedProjects={filteredApprovedProjects}
          showMobileModal={showMobilePendingModal}
          setShowMobileModal={setShowMobilePendingModal}
          onApplyClick={handleApplyClick}
          viewMode={viewMode}
          gridColumns={gridColumns}
        />
      </div>
    </div>
  );
}
