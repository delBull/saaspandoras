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

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((project: Project) =>
        project.title.toLowerCase().includes(searchLower) ||
        project.description.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((project: Project) => project.status === filters.status);
    }

    // Note: Category and network filters would need additional fields in Project type
    // For now, they act as pass-through filters

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