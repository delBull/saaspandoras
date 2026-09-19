"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { SovereignDisplayContextType, SovereignDisplayProfile } from "./types";
import { DEFAULT_DISPLAY_PROFILE, LOCAL_STORAGE_KEY } from "./constants";
import { sanitizeProfile, applyProfileToDom } from "./engine";

const SovereignDisplayContext = createContext<SovereignDisplayContextType | undefined>(undefined);

export const SovereignDisplayProvider = ({
  children,
  initialProfile,
}: {
  children: ReactNode;
  initialProfile?: SovereignDisplayProfile;
}) => {
  const [profile, setProfileState] = useState<SovereignDisplayProfile>(
    initialProfile || DEFAULT_DISPLAY_PROFILE
  );

  // 1. Hidratación segura desde localStorage (Origin-Bound Cache)
  useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        setProfileState(sanitizeProfile(JSON.parse(cached)));
      } else if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // Fallback al SO para a11y
        setProfileState((prev) => ({ ...prev, reducedMotion: true }));
      }
    } catch (err) {
      console.warn("[SovereignDisplay] Failed to parse local cache, falling back to defaults.", err);
    }
  }, []);

  // 1b. Sincronización asíncrona con el servidor para perfiles autenticados
  useEffect(() => {
    let isMounted = true;
    const fetchServerProfile = async () => {
      try {
        const res = await fetch("/api/v1/user/display-preferences");
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.authenticated && data.profile && isMounted) {
          setProfileState((prev) => ({
            ...prev,
            ...sanitizeProfile(data.profile),
          }));
        }
      } catch {
        // Fail-safe silencioso si no hay red o está fuera del contexto dashboard
      }
    };
    fetchServerProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const setProfile = (updates: Partial<SovereignDisplayProfile>) => {
    setProfileState((prev) => {
      const safeCache = sanitizeProfile({ ...prev, ...updates });
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(safeCache));
      } catch (err) {
        // Ignore quota or security errors for localStorage
      }

      // Sincronizar con el servidor de forma fail-safe
      try {
        fetch("/api/v1/user/display-preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(safeCache),
        }).catch(() => {});
      } catch {
        // No-op
      }

      return safeCache;
    });
  };

  const resetToDefaults = () => {
    setProfile(DEFAULT_DISPLAY_PROFILE);
  };

  // 2. Aplicar el profile al DOM de manera segura sin romper React Trees ajenos
  useEffect(() => {
    applyProfileToDom(profile);
  }, [profile]);

  return (
    <SovereignDisplayContext.Provider value={{ profile, setProfile, resetToDefaults }}>
      {children}
    </SovereignDisplayContext.Provider>
  );
};

export const useSovereignDisplay = () => {
  const context = useContext(SovereignDisplayContext);
  if (context === undefined) {
    throw new Error("useSovereignDisplay must be used within a SovereignDisplayProvider");
  }
  return context;
};
