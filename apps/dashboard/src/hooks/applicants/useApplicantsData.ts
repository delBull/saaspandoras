"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export interface Project {
  id: number;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  status: string;
  coverPhotoUrl?: string | null;
  targetAmount?: string | number | null;
  raisedAmount?: string | number | null;
}

export interface ApplicantsData {
  projects: Project[];
  loading: boolean;
  pendingProjects: Project[];
  approvedProjects: Project[];
  isPendingPanelCollapsed: boolean;
  showMobilePendingModal: boolean;
  setIsPendingPanelCollapsed: (collapsed: boolean) => void;
  setShowMobilePendingModal: (show: boolean) => void;
  refetchProjects: () => Promise<void>;
}

export function useApplicantsData(): ApplicantsData {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPendingPanelCollapsed, setIsPendingPanelCollapsed] = useState(false);
  const [showMobilePendingModal, setShowMobilePendingModal] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json() as Project[];
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const pendingProjects = projects.filter(p => p.status === 'pending');
  const approvedProjects = projects.filter(p => ['approved', 'live', 'completed'].includes(p.status));

  return {
    projects,
    loading,
    pendingProjects,
    approvedProjects,
    isPendingPanelCollapsed,
    showMobilePendingModal,
    setIsPendingPanelCollapsed,
    setShowMobilePendingModal,
    refetchProjects: fetchProjects,
  };
}
