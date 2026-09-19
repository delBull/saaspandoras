"use client";

import React from "react";
import { useSovereignDisplay } from "./provider";
import { SovereignDisplayScale, SovereignDisplayTheme } from "./types";

export const DisplayControlsWidget = () => {
  const { profile, setProfile, resetToDefaults } = useSovereignDisplay();

  const handleScaleChange = (scale: SovereignDisplayScale) => {
    setProfile({ scale });
  };

  const handleThemeChange = (theme: SovereignDisplayTheme) => {
    setProfile({ theme });
  };

  return (
    <div 
      className="p-4 bg-[var(--display-surface)] text-[var(--display-text)] border border-[var(--display-border)] rounded-lg shadow-sm w-full max-w-sm"
      role="region"
      aria-label="Controles de visualización y accesibilidad"
    >
      <h3 className="font-semibold mb-3">Sovereign Display</h3>
      
      {/* Escala (Typography/Layout Scale) */}
      <div className="mb-4">
        <label className="block text-sm mb-1 text-[var(--display-text-muted)]">Tamaño de Texto</label>
        <div className="flex gap-2">
          {(["100", "115", "130"] as SovereignDisplayScale[]).map(s => (
            <button 
              key={s}
              onClick={() => handleScaleChange(s)}
              className={`px-3 py-1 text-sm border rounded ${profile.scale === s ? 'bg-[var(--display-primary)] text-white border-[var(--display-primary)]' : 'border-[var(--display-border)] hover:bg-[var(--display-bg)]'} focus:outline-none focus:ring-2 focus:ring-[var(--display-primary)]`}
              aria-pressed={profile.scale === s}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      {/* Themes */}
      <div className="mb-4">
        <label className="block text-sm mb-1 text-[var(--display-text-muted)]">Tema Visual</label>
        <select 
          value={profile.theme}
          onChange={(e) => handleThemeChange(e.target.value as SovereignDisplayTheme)}
          className="w-full p-2 border border-[var(--display-border)] bg-[var(--display-bg)] text-[var(--display-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--display-primary)]"
          aria-label="Seleccionar tema visual"
        >
          <option value="base">Predeterminado</option>
          <option value="high-contrast">Alto Contraste</option>
          <option value="sepia">Sepia (Lectura)</option>
          <option value="grayscale">Escala de Grises</option>
          <option value="low-light">Baja Luminosidad</option>
        </select>
      </div>

      {/* Accesibilidad (Toggles) */}
      <div className="space-y-2 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={profile.magnifier}
            onChange={(e) => setProfile({ magnifier: e.target.checked })}
            className="w-4 h-4 accent-[var(--display-primary)] focus:ring-[var(--display-primary)]"
          />
          <span className="text-sm">Activar Lupa Segura</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={profile.reducedMotion}
            onChange={(e) => setProfile({ reducedMotion: e.target.checked })}
            className="w-4 h-4 accent-[var(--display-primary)] focus:ring-[var(--display-primary)]"
          />
          <span className="text-sm">Reducir Movimiento</span>
        </label>
      </div>

      <button 
        onClick={resetToDefaults}
        className="w-full py-2 text-sm text-[var(--display-text-muted)] hover:text-[var(--display-text)] border border-transparent hover:border-[var(--display-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--display-primary)] transition-colors"
      >
        Restaurar Valores por Defecto
      </button>
    </div>
  );
};
