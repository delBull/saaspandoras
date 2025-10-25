'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Hook personalizado para manejar el estado global de proyectos featured
 * Usa la base de datos para persistencia global entre sesiones
 */
export function useFeaturedProjects() {
  const [featuredProjectIds, setFeaturedProjectIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Cargar proyectos featured desde la base de datos
  const loadFeaturedProjects = useCallback(async () => {
    try {
      const response = await fetch('/api/projects/featured');
      if (response.ok) {
        const projects = await response.json() as { id: number }[];
        const projectIds = projects.map(p => p.id);
        setFeaturedProjectIds(new Set(projectIds));
        console.log('🎯 useFeaturedProjects: Loaded featured projects from DB:', projectIds);
      } else {
        console.error('❌ useFeaturedProjects: Failed to load featured projects');
      }
    } catch (error) {
      console.error('❌ useFeaturedProjects: Error loading featured projects:', error);
    }
  }, []);

  // Migrar featured projects del localStorage a la base de datos (ejecutar una sola vez)
  const migrateFromLocalStorage = useCallback(async () => {
    if (typeof window === 'undefined') return;

    try {
      // Leer featured projects del localStorage
      const featuredKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('featured_'))
        .map(key => {
          try {
            const value = localStorage.getItem(key);
            return value === 'true' ? parseInt(key.replace('featured_', '')) : null;
          } catch {
            return null;
          }
        })
        .filter((id): id is number => id !== null);

      if (featuredKeys.length === 0) return; // Nothing to migrate

      console.log('🔄 useFeaturedProjects: Found local featured projects to migrate:', featuredKeys);

      // Marcar cada proyecto como featured en la base de datos
      const promises = featuredKeys.map(projectId =>
        fetch('/api/projects/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, featured: true }),
        })
      );

      await Promise.all(promises);
      console.log('✅ useFeaturedProjects: Migration completed, marked', featuredKeys.length, 'projects as featured');

      // Recargar desde la DB para actualizar el estado
      await loadFeaturedProjects();

      // Limpiar localStorage después de migración exitosa
      featuredKeys.forEach(projectId => {
        localStorage.removeItem(`featured_${projectId}`);
      });

    } catch (error) {
      console.error('❌ useFeaturedProjects: Migration failed:', error);
    }
  }, [loadFeaturedProjects]);

  // Cargar proyectos al montar el hook
  useEffect(() => {
    void loadFeaturedProjects();

    // Ejecutar migración una sola vez
    const hasMigrated = localStorage.getItem('featured_migrated_to_db');
    if (!hasMigrated) {
      void migrateFromLocalStorage();
      localStorage.setItem('featured_migrated_to_db', 'true');
    }
  }, [loadFeaturedProjects, migrateFromLocalStorage]);

  // Función para marcar/desmarcar un proyecto como featured
  const toggleFeatured = useCallback(async (projectId: number) => {
    const wasFeatured = featuredProjectIds.has(projectId);

    try {
      // Optimistically update UI first
      setFeaturedProjectIds(prev => {
        const newSet = new Set(prev);
        if (wasFeatured) {
          newSet.delete(projectId);
        } else {
          newSet.add(projectId);
        }
        return newSet;
      });

      setIsLoading(true);

      // Call API to update database
      const response = await fetch('/api/projects/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          featured: !wasFeatured,
        }),
      });

      if (response.ok) {
        console.log(`✅ useFeaturedProjects: Project ${projectId} ${!wasFeatured ? 'marked as' : 'removed from'} featured`);
      } else {
        // Revert on error
        setFeaturedProjectIds(prev => {
          const newSet = new Set(prev);
          if (!wasFeatured) {
            newSet.delete(projectId);
          } else {
            newSet.add(projectId);
          }
          return newSet;
        });
        console.error('❌ useFeaturedProjects: Failed to update featured status');
      }
    } catch (error) {
      // Revert on error
      setFeaturedProjectIds(prev => {
        const newSet = new Set(prev);
        if (!wasFeatured) {
          newSet.delete(projectId);
        } else {
          newSet.add(projectId);
        }
        return newSet;
      });
      console.error('❌ useFeaturedProjects: Error updating featured status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [featuredProjectIds]);

  // Función para verificar si un proyecto está marcado como featured
  const isFeatured = useCallback((projectId: number) => {
    return featuredProjectIds.has(projectId);
  }, [featuredProjectIds]);

  // Función para obtener todos los proyectos featured
  const getFeaturedProjects = useCallback(() => {
    return Array.from(featuredProjectIds);
  }, [featuredProjectIds]);

  // Función para limpiar todos los featured (Admin function)
  const clearAllFeatured = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get all current featured projects
      const currentFeatured = getFeaturedProjects();

      // Remove featured status for each project
      const promises = currentFeatured.map(projectId =>
        fetch('/api/projects/featured', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, featured: false }),
        })
      );

      await Promise.all(promises);

      // Clear local state
      setFeaturedProjectIds(new Set());
      console.log('🔧 useFeaturedProjects: Cleared all featured projects via API');
    } catch (error) {
      console.error('❌ useFeaturedProjects: Error clearing all featured:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getFeaturedProjects]);

  // Función para sincronizar desde la base de datos
  const syncFromDatabase = useCallback(() => {
    void loadFeaturedProjects();
  }, [loadFeaturedProjects]);

  return {
    featuredProjectIds,
    toggleFeatured,
    isFeatured,
    getFeaturedProjects,
    clearAllFeatured,
    syncFromDatabase,
    isLoading,
  };
}
