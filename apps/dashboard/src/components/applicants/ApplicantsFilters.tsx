"use client";

import React from "react";
import { Search, Filter, Grid3X3, List, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@saasfly/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";

export type ViewMode = 'grid' | 'list';
export type GridColumns = 3 | 4;

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
  // NEW: Para cálculos dinámicos de contadores
  approvedProjects?: { status: string }[];
}

const categories = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'residential_real_estate', label: 'Bienes Raíces Residenciales' },
  { value: 'commercial_real_estate', label: 'Bienes Raíces Comerciales' },
  { value: 'tech_startup', label: 'Tech Startup' },
  { value: 'renewable_energy', label: 'Energías Renovables' },
  { value: 'art_collectibles', label: 'Arte y Coleccionables' },
  { value: 'intellectual_property', label: 'Propiedad Intelectual' },
  { value: 'defi', label: 'DeFi (Finanzas Descentralizadas)' },
  { value: 'gaming', label: 'Gaming y NFTs de Juegos' },
  { value: 'metaverse', label: 'Metaverso y Real Estate Virtual' },
  { value: 'music_audio', label: 'Música y NFTs de Audio' },
  { value: 'sports_fan_tokens', label: 'Deportes y Fan Tokens' },
  { value: 'education', label: 'Educación y Aprendizaje' },
  { value: 'healthcare', label: 'Salud y Biotecnología' },
  { value: 'supply_chain', label: 'Cadena de Suministro' },
  { value: 'infrastructure', label: 'Infraestructura y DAO Tools' },
  { value: 'social_networks', label: 'Redes Sociales Web3' },
  { value: 'carbon_credits', label: 'Créditos de Carbono' },
  { value: 'insurance', label: 'Seguros Paramétricos' },
  { value: 'prediction_markets', label: 'Mercados de Predicción' },
  { value: 'other', label: 'Otro' },
];

// const networks = [
//   { value: 'all', label: 'Todas las redes' },
//   { value: 'ethereum', label: 'Ethereum' },
//   { value: 'polygon', label: 'Polygon' },
//   { value: 'arbitrum', label: 'Arbitrum' },
//   { value: 'base', label: 'Base' },
// ];

// Statuses ocultos - solo mostramos proyectos aprobados
// const statuses = [
//   { value: 'all', label: 'Todos los Estados' },
//   { value: 'pending', label: 'En Revisión' },
//   { value: 'approved', label: 'Aprobado' },
//   { value: 'live', label: 'Activo' },
//   { value: 'completed', label: 'Completado' },
//   { value: 'rejected', label: 'Rechazado' },
// ];

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
  totalProjects: _totalProjects,
  filteredCount: _filteredCount,
  approvedProjects,
}: ApplicantsFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Desktop Filters Bar */}
      {/* Desktop Filters Bar */}
      <div className="hidden lg:flex items-center justify-between gap-4 p-4 bg-black/40 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Buscar protocolos..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 bg-black/20 border-white/10 text-xs text-white placeholder-zinc-500 focus:border-lime-500/50 transition-colors"
            />
          </div>

          {/* Quick Filters */}
          <Select value={filters.category} onValueChange={(value) => updateFilter('category', value)}>
            <SelectTrigger className="w-48 bg-black/20 border-white/10 text-xs text-zinc-300">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-white hover:bg-zinc-800 focus:bg-zinc-800">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado oculto - solo mostramos proyectos aprobados */}
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-lime-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-1 ${viewMode === 'list' ? 'bg-lime-500 text-black' : 'text-zinc-500 hover:text-white'}`}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Grid Columns (only for grid view) */}
          {viewMode === 'grid' && (
            <div className="flex items-center bg-black/20 rounded-lg p-1 border border-white/5">
              {[3, 4].map((cols) => (
                <Button
                  key={cols}
                  variant={gridColumns === cols ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onGridColumnsChange(cols as GridColumns)}
                  className={`px-2 py-1 text-xs ${gridColumns === cols ? 'bg-lime-500 text-black' : 'text-zinc-500 hover:text-white'}`}
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
            <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-lime-500 text-black' : 'text-zinc-500'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className={`px-3 py-1 ${viewMode === 'list' ? 'bg-lime-500 text-black' : 'text-zinc-500'}`}
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

          <Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-900 text-zinc-300">
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
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white min-w-[140px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {categories.slice(0, 4).map((category) => (
                <SelectItem key={category.value} value={category.value} className="text-white hover:bg-zinc-800">
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Estado oculto en móvil también - solo mostramos proyectos aprobados */}
        </div>
      </div>

      {/* Results Counter */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          Mostrando {approvedProjects ? approvedProjects.filter(p => p.status === 'live').length : 0} de {approvedProjects ? approvedProjects.length : 0} protocolos
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
