'use client';

import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar el estado global de proyectos featured
 * Proporciona persistencia en localStorage independiente de la sesión de usuario
 */
export function useFeaturedProjects() {
  const [featuredProjectIds, setFeaturedProjectIds] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') {
      return new Set();
    }

    try {
      // Obtener todas las claves de localStorage que empiecen con 'featured_'
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

      console.log('🔧 useFeaturedProjects: Loaded featured projects:', featuredKeys);
      return new Set(featuredKeys);
    } catch (error) {
      console.warn('Error loading featured projects from localStorage:', error);
      return new Set();
    }
  });

  // Función para marcar/desmarcar un proyecto como featured
  const toggleFeatured = useCallback((projectId: number) => {
    setFeaturedProjectIds(prev => {
      const newSet = new Set(prev);

      if (newSet.has(projectId)) {
        newSet.delete(projectId);
        localStorage.setItem(`featured_${projectId}`, JSON.stringify(false));
        console.log(`🔧 useFeaturedProjects: Removed project ${projectId} from featured`);
      } else {
        newSet.add(projectId);
        localStorage.setItem(`featured_${projectId}`, JSON.stringify(true));
        console.log(`🔧 useFeaturedProjects: Added project ${projectId} to featured`);
      }

      return newSet;
    });
  }, []);

  // Función para verificar si un proyecto está marcado como featured
  const isFeatured = useCallback((projectId: number) => {
    return featuredProjectIds.has(projectId);
  }, [featuredProjectIds]);

  // Función para obtener todos los proyectos featured
  const getFeaturedProjects = useCallback(() => {
    return Array.from(featuredProjectIds);
  }, [featuredProjectIds]);

  // Función para limpiar todos los featured
  const clearAllFeatured = useCallback(() => {
    setFeaturedProjectIds(new Set());
    featuredProjectIds.forEach(projectId => {
      localStorage.setItem(`featured_${projectId}`, JSON.stringify(false));
    });
    console.log('🔧 useFeaturedProjects: Cleared all featured projects');
  }, [featuredProjectIds]);

  // Función para sincronizar con datos externos (útil para debugging)
  const syncWithLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
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

      const newSet = new Set(featuredKeys);
      setFeaturedProjectIds(newSet);
      console.log('🔧 useFeaturedProjects: Synced with localStorage:', featuredKeys);
    } catch (error) {
      console.warn('Error syncing with localStorage:', error);
    }
  }, []);

  return {
    featuredProjectIds,
    toggleFeatured,
    isFeatured,
    getFeaturedProjects,
    clearAllFeatured,
    syncWithLocalStorage
  };
}