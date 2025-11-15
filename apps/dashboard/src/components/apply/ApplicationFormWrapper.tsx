"use client";

import { MultiStepForm } from "@/app/dashboard/admin/projects/[id]/edit/multi-step-form";

interface ApplicationFormWrapperProps {
  isAdminMode: boolean;
  onSuccess: () => void;
  onDraft?: () => void;
}

export function ApplicationFormWrapper({ isAdminMode }: ApplicationFormWrapperProps) {
  return (
    <MultiStepForm
      project={null}
      isEdit={false}
      apiEndpoint={isAdminMode ? "/api/admin/projects" : "/api/projects/draft"}
      isPublic={!isAdminMode}
    />
  );
}