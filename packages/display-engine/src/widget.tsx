"use client";

import React from "react";
import { useSovereignDisplay } from "./provider";
import { SovereignDisplayScale, SovereignDisplayTheme } from "./types";

export interface DisplayControlsWidgetProps {
  variant?: "card" | "minimal";
  className?: string;
  onClose?: () => void;
}

export const DisplayControlsWidget = ({ variant = "card", className = "", onClose }: DisplayControlsWidgetProps) => {
  const { profile, setProfile, resetToDefaults } = useSovereignDisplay();

  const handleScaleChange = (scale: SovereignDisplayScale) => {
    setProfile({ scale });
  };

  const handleThemeChange = (theme: SovereignDisplayTheme) => {
    setProfile({ theme });
  };

  return (
    <div 
      className={`${variant === 'card' ? 'p-4 bg-[var(--display-surface)] border border-[var(--display-border)] rounded-lg shadow-sm max-w-sm' : 'py-2'} text-[var(--display-text)] w-full flex flex-col ${className}`}
      role="region"
      aria-label="Controles de visualización y accesibilidad"
    >
      {variant === 'card' && (
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Sovereign Display</h3>
          {onClose && (
            <button onClick={onClose} className="p-1 hover:bg-[var(--display-bg)] rounded text-[var(--display-text-muted)] hover:text-[var(--display-text)] transition-colors">
              ✕
            </button>
          )}
        </div>
      )}
      
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
          <option value="blancos">Blancos (Modo Claro)</option>
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

      {/* Guía rápida: ¿Cómo usarlo? */}
      <div className="pt-3 mb-4 border-t border-[var(--display-border)]">
        <details className="group text-xs">
          <summary className="font-semibold text-[var(--display-primary)] cursor-pointer list-none flex items-center justify-between hover:opacity-80 transition-opacity py-1 select-none">
            <span className="flex items-center gap-1.5">
              <span>💡</span>
              <span>¿Cómo funciona Sovereign Display?</span>
            </span>
            <span className="text-[10px] text-[var(--display-text-muted)] group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-2.5 p-3 rounded-lg bg-[var(--display-bg)] border border-[var(--display-border)] space-y-2 text-[11px] leading-relaxed text-[var(--display-text-muted)]">
            <div>
              <strong className="text-[var(--display-text)] block mb-0.5">🔍 Lupa Focal Segura:</strong>
              Actívala y pasa el cursor sobre contratos, cláusulas legales, hashes criptográficos o balances para activar el zoom de alta precisión.
            </div>
            <div>
              <strong className="text-[var(--display-text)] block mb-0.5">🔠 Escala Proporcional:</strong>
              Aumenta el tamaño al 115% o 130% para lectura descansada sin descuadrar botones ni paneles.
            </div>
            <div>
              <strong className="text-[var(--display-text)] block mb-0.5">🎨 Temas y Filtros:</strong>
              Usa <em>Sepia</em> para lectura nocturna prolongada o <em>Escala de Grises</em> para reducir fatiga visual en auditorías.
            </div>
            <div>
              <strong className="text-[var(--display-text)] block mb-0.5">☁️ Sincronización Automática:</strong>
              Tus preferencias se guardan en tu cuenta y se aplican en todos tus dispositivos.
            </div>
          </div>
        </details>
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
