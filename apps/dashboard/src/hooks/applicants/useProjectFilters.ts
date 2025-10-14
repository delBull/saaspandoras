"use client";

import { useMemo, useState } from "react";
import type { Project } from "./useApplicantsData";

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

const initialFilters: FilterOptions = {
  search: '',
  category: 'all',
  network: 'all',
  status: 'all',
  minTokenPrice: '',
  maxTokenPrice: '',
};

export function useProjectFilters(projects: Project[]) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridColumns, setGridColumns] = useState<GridColumns>(3);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Category filter (placeholder - will be implemented when category data is available)
      if (filters.category !== 'all') {
        // TODO: Filter by project category when available in Project interface
        // For now, this filter is prepared for future implementation
      }

      // Network filter (placeholder - will be implemented when network data is available)
      if (filters.network !== 'all') {
        // TODO: Filter by blockchain network when available in Project interface
        // For now, this filter is prepared for future implementation
      }

      // Status filter
      if (filters.status !== 'all') {
        if (project.status !== filters.status) return false;
      }

      // Token price range filter (placeholder - will be implemented when tokenPrice data is available)
      if (filters.minTokenPrice || filters.maxTokenPrice) {
        // TODO: Filter by token price when available in Project interface
        // For now, this filter is prepared for future implementation
      }

      return true;
    });
  }, [projects, filters]);

  const updateFilter = (key: keyof FilterOptions, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return filters.search !== '' ||
           filters.category !== 'all' ||
           filters.network !== 'all' ||
           filters.status !== 'all' ||
           filters.minTokenPrice !== '' ||
           filters.maxTokenPrice !== '';
  }, [filters]);

  return {
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
    totalProjects: projects.length,
    filteredCount: filteredProjects.length,
  };
}