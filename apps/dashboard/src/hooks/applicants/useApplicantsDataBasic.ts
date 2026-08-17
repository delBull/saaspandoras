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
  artifacts?: any[];
  chainId?: number | null;
  protocolVersion?: number | null;
  hasHermes?: boolean;
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
      
      // 🛡️ FILTER: Only Pandoras projects with tokenization should appear in /applicants
      // - Exclude internal "Pandoras Access" projects
      // - Exclude Hermes-ONLY projects (no tokenization contracts)
      // - Include hybrid projects like S'Narai (Hermes + Pandoras tokenization)
      const filteredData = data.filter(p => {
        const pSlug = (p.slug || '').toLowerCase();
        const pTitle = (p.title || '').toLowerCase();
        
        // Exclude internal Pandoras Access projects
        const isAccessSlug = pSlug === 'pandoras-access' || pSlug === 'pandora-access' || pSlug === 'pandoras-protocol';
        const isAccessTitle = pTitle.includes("pandora's access") || pTitle === "pandora's access";
        
        // 🛡️ Exclude Hermes-ONLY projects (no tokenization contracts)
        // A project is "Hermes-only" if it has Hermes installed BUT no license/utility/contract addresses
        const hasTokenization = !!(p.contractAddress || p.licenseContractAddress || p.utilityContractAddress || p.governorContractAddress);
        const isHermesOnly = p.hasHermes === true && !hasTokenization;
        
        return !isAccessSlug && !isAccessTitle && !isHermesOnly;
      });

      console.log('✅ Basic Hook: Projects loaded and filtered:', filteredData.length);
      setProjects(filteredData);
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
  const approvedProjects = useMemo(() => projects.filter(p => ['approved', 'live', 'completed', 'deployed', 'active'].includes(p.status?.toLowerCase())), [projects]);
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
