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

    // Category filter - filter by business category (placeholder for now)
    // TODO: Add businessCategory field to Project type when available
    if (filters.category !== 'all') {
      // For now, we'll filter by title containing category-related keywords
      const categoryKeywords: Record<string, string[]> = {
        'residential_real_estate': ['residencial', 'casa', 'apartamento', 'vivienda'],
        'commercial_real_estate': ['comercial', 'oficina', 'local', 'comercio'],
        'tech_startup': ['tecnología', 'tech', 'startup', 'software'],
        'renewable_energy': ['renovable', 'solar', 'energía', 'verde'],
        'art_collectibles': ['arte', 'colección', 'coleccionable', 'obra'],
        'intellectual_property': ['propiedad intelectual', 'patente', 'marca'],
        'other': ['otro', 'otros']
      };

      const keywords = categoryKeywords[filters.category] ?? [];
      filtered = filtered.filter((project: Project) =>
        keywords.some(keyword =>
          project.title.toLowerCase().includes(keyword) ||
          project.description.toLowerCase().includes(keyword)
        )
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