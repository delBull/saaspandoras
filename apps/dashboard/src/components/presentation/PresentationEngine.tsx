/**
 * TODO [NEXUS-MEET-INTEGRATION]:
 * Roadmap de unificación:
 * 1. Vincular PresentationEngine nativamente con SovereignMeetRoom.
 * 2. Permitir que desde Nexus se cree una "Presentation Meet" (crea la meet + asocia un ID de pitch).
 * 3. Inyectar el motor de presentación directamente como un iframe colaborativo o 
 *    compartición de pantalla automatizada dentro del Jitsi JaaS (API-driven).
 * 4. Objetivo: Que el host presione "Presentar Pitch X", la sala se abra para todos,
 *    y la sincronización de slides sea controlada por el Host, sin enviar enlaces de pitch por chat.
 */
"use client";

import { useEffect, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface Slide {
  id: string;
  content: ReactNode;
}

interface PresentationEngineProps {
  slides: Slide[];
  /** Reunión: activa la sincronización del slide con los invitados. */
  meetId?: string;
  /** Host: publica el slide actual. Invitado: lo sigue. */
  host?: boolean;
  /** Slug del deck (para el estado compartido). */
  presentationId?: string;
}

export function PresentationEngine({ slides, meetId, host = false, presentationId = 'celeste' }: PresentationEngineProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [live, setLive] = useState(false);

  // Host: publica el slide actual (idempotente; el invitado nunca escribe).
  useEffect(() => {
    if (!meetId || !host) return;
    const id = setTimeout(() => {
      void fetch(`/api/v1/meet/${meetId}/presentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slideIndex: currentSlide, presentationId }),
      }).catch(() => undefined);
    }, 250);
    return () => clearTimeout(id);
  }, [currentSlide, meetId, host, presentationId]);

  // Invitado: sigue el slide del host por polling (2s).
  useEffect(() => {
    if (!meetId || host) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/v1/meet/${meetId}/presentation`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (typeof data.slideIndex === 'number') {
          setCurrentSlide((prev) => (data.slideIndex === prev ? prev : data.slideIndex));
          setLive(true);
        }
      } catch {
        // sin conexión: se mantiene el slide actual
      }
    };
    void tick();
    const timer = setInterval(tick, 2000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [meetId, host]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space" || e.key === " ") {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [slides.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden selection:bg-white/20">
      {/* Background elements to make it look premium (Apple Keynote style) */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-white/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-6xl px-12 flex flex-col justify-center items-center text-center"
        >
          {slides[currentSlide]?.content}
        </motion.div>
      </AnimatePresence>

      {meetId && (
        <div className="absolute top-4 left-4 z-20 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] uppercase tracking-widest text-zinc-300">
          {host ? 'Presentando en vivo' : live ? 'En vivo' : 'Conectando…'} · {currentSlide + 1}/{slides.length}
        </div>
      )}

      {/* Progress indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentSlide ? "w-8 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
