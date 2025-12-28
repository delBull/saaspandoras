"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export interface Project {
  id: number;
  title: string;
  description: string;
  slug: string;
  createdAt: string;
  status: string;
  businessCategory: string;
  coverPhotoUrl?: string | null;
  targetAmount?: string | number | null;

  raisedAmount?: string | number | null;
  contractAddress?: string;
  licenseContractAddress?: string;
  utilityContractAddress?: string;
  governorContractAddress?: string;
  w2eConfig?: any;
}

export interface ApplicantsData {
  projects: Project[];
  loading: boolean;
  pendingProjects: Project[];
  approvedProjects: Project[];
  approvedOnlyProjects: Project[];
  isPendingPanelCollapsed: boolean;
  showMobilePendingModal: boolean;
  showMobileApprovedModal: boolean;
  setIsPendingPanelCollapsed: (collapsed: boolean) => void;
  setShowMobilePendingModal: (show: boolean) => void;
  setShowMobileApprovedModal: (show: boolean) => void;
  refetchProjects: () => Promise<void>;
}

export function useApplicantsDataBasic(): ApplicantsData {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPendingPanelCollapsed, setIsPendingPanelCollapsed] = useState(false);
  // MOBILE: Sidebar cerrado por default
  const [showMobilePendingModal, setShowMobilePendingModal] = useState(false);
  const [showMobileApprovedModal, setShowMobileApprovedModal] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      console.log('🔍 Basic Hook: Fetching projects from /api/projects-basic');
      const response = await fetch('/api/projects-basic');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const data = await response.json() as Project[];
      console.log('✅ Basic Hook: Projects loaded:', data.length);
      setProjects(data);
    } catch (error) {
      console.error("❌ Basic Hook: Error fetching projects:", error);
      toast.error("No se pudieron cargar los proyectos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjects();
  }, []);

  const pendingProjects = useMemo(() => projects.filter(p => p.status === 'pending'), [projects]);
  const approvedProjects = useMemo(() => projects.filter(p => ['approved', 'live', 'completed'].includes(p.status)), [projects]);
  const approvedOnlyProjects = useMemo(() => projects.filter(p => p.status === 'approved'), [projects]);

  return {
    projects,
    loading,
    pendingProjects,
    approvedProjects,
    approvedOnlyProjects,
    isPendingPanelCollapsed,
    showMobilePendingModal,
    showMobileApprovedModal,
    setIsPendingPanelCollapsed,
    setShowMobilePendingModal,
    setShowMobileApprovedModal,
    refetchProjects: fetchProjects,
  };
}
