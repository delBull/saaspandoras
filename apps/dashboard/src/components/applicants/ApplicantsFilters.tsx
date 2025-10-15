"use client";

import React from "react";
import { Search, Filter, Grid3X3, List, X } from "lucide-react";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";

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

interface ApplicantsFiltersProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridColumns: GridColumns;
  onGridColumnsChange: (columns: GridColumns) => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  updateFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  totalProjects: number;
  filteredCount: number;
}

const categories = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'residential_real_estate', label: 'Bienes Raíces Residencial' },
  { value: 'commercial_real_estate', label: 'Bienes Raíces Comercial' },
  { value: 'tech_startup', label: 'Startup Tecnológica' },
  { value: 'renewable_energy', label: 'Energías Renovables' },
  { value: 'art_collectibles', label: 'Arte y Coleccionables' },
  { value: 'intellectual_property', label: 'Propiedad Intelectual' },
  { value: 'other', label: 'Otro' },
];

// const networks = [
//   { value: 'all', label: 'Todas las redes' },
//   { value: 'ethereum', label: 'Ethereum' },
//   { value: 'polygon', label: 'Polygon' },
//   { value: 'arbitrum', label: 'Arbitrum' },
//   { value: 'base', label: 'Base' },
// ];

const statuses = [
  { value: 'all', label: 'Todos los Estados' },
  { value: 'pending', label: 'En Revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'live', label: 'Activo' },
  { value: 'completed', label: 'Completado' },
  { value: 'rejected', label: 'Rechazado' },
];

export function ApplicantsFilters({
  viewMode,
  onViewModeChange,
  gridColumns,
  onGridColumnsChange,
  filters,
  onFiltersChange: _onFiltersChange,
  updateFilter,
  clearFilters,
  hasActiveFilters,
  totalProjects,
  filteredCount,
}: ApplicantsFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Filters Bar */}
      <div className="hidden lg:flex items-center justify-between gap-4 p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-200 dark:border-zinc-800">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar proyectos..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>

          {/* Quick Filters */}
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="w-48 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700">
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="w-40 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-xs text-gray-900 dark:text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700">
              {statuses.map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-lime-500 text-black' : 'text-gray-400'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1 ${viewMode === 'list' ? 'bg-lime-500 text-black' : 'text-gray-400'}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Grid Columns (only for grid view) */}
          {viewMode === 'grid' && (
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
              {[3, 4, 6].map((cols) => (
                <Button
                  key={cols}
                  variant={gridColumns === cols ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onGridColumnsChange(cols as GridColumns)}
                  className={`px-2 py-1 text-xs ${gridColumns === cols ? 'bg-lime-500 text-black' : 'text-gray-600 dark:text-gray-400'}`}
                >
                  {cols}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Bar */}
      <div className="lg:hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Mobile View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-lime-500 text-black' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 ${viewMode === 'list' ? 'bg-lime-500 text-black' : 'text-gray-600 dark:text-gray-400'}`}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Grid Columns - Oculto según requerimiento */}
            {viewMode === 'grid' && (
              <div className="hidden">
                {/* Grid column controls hidden on mobile as requested */}
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 bg-lime-500 rounded-full"></span>
            )}
          </Button>
        </div>

        {/* Mobile Quick Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white min-w-[140px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700">
              {categories.slice(0, 4).map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.status} onValueChange={(value) => updateFilter('status', value)}>
            <SelectTrigger className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700 text-gray-900 dark:text-white min-w-[120px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700">
              {statuses.slice(0, 4).map((status) => (
                <SelectItem key={status.value} value={status.value} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-700">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Counter */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Mostrando {filteredCount} de {totalProjects} proyectos
        </span>
        {hasActiveFilters && (
          <Button
            onClick={clearFilters}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4 mr-1" />
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
}