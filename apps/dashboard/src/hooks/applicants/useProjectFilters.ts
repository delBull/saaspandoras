"use client";

import { useState, useMemo } from "react";
import type { Project } from "./useApplicantsDataBasic";

export type ViewMode = 'grid' | 'list';
export type GridColumns = 3 | 4 | 6;

export interface FilterOptions {
  search: string;
  category: string;
  network: string;
  status: string;
  minTokenPrice: string;
  maxTokenPrice: string;
}

interface UseProjectFiltersProps {
  projects: Project[];
  initialViewMode?: ViewMode;
  initialGridColumns?: GridColumns;
}

export function useProjectFilters({
  projects,
  initialViewMode = 'grid',
  initialGridColumns = 4,
}: UseProjectFiltersProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [gridColumns, setGridColumns] = useState<GridColumns>(initialGridColumns);
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    network: 'all',
    status: 'all',
    minTokenPrice: '',
    maxTokenPrice: '',
  });

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      network: 'all',
      status: 'all',
      minTokenPrice: '',
      maxTokenPrice: '',
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' ||
           filters.category !== 'all' ||
           filters.network !== 'all' ||
           filters.status !== 'all' ||
           filters.minTokenPrice !== '' ||
           filters.maxTokenPrice !== '';
  }, [filters]);

  const filteredProjects = useMemo(() => {
    let filtered = [...projects];

    // Only show approved projects (approved, live, completed)
    filtered = filtered.filter((project: Project) =>
      ['approved', 'live', 'completed'].includes(project.status)
    );

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((project: Project) =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower)
      );
    }

    // Category filter - filter by business category using the actual field
    if (filters.category !== 'all') {
      filtered = filtered.filter((project: Project) =>
        project.businessCategory === filters.category
      );
    }

    // Network filter is hidden as requested
    // Status filter is disabled - we only show approved projects

    return filtered;
  }, [projects, filters]);

  return {
    // View state
    viewMode,
    setViewMode,
    gridColumns,
    setGridColumns,

    // Filters
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters,

    // Filtered data
    filteredProjects,
    totalProjects: projects.length,
    filteredCount: filteredProjects.length,
  };
}
