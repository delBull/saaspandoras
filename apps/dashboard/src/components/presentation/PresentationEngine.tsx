/**
 * 🏛️ ARCHITECTURE NOTE: Sovereign Presentation Engine
 * ===================================================
 * Motor de slides de los decks `/pitch/<slug>`.
 *
 * Integración con Sovereign Meet (NEXUS-MEET-INTEGRATION):
 *   - `?embed=1` oculta la UI de navegación (el deck se muestra dentro de la sala).
 *   - `?slide=N` permite abrir el deck en un slide concreto.
 *   - El host de la sala controla el slide y lo difunde; cada cliente inyecta el
 *     índice recibido vía `postMessage({ type: 'pandora:presentation:go', index })`.
 *   - El motor emite `pandora:presentation:state` para que la sala conozca el
 *     total de slides sin duplicar el contenido del deck.
 *
 * Seguridad: este componente NO evalúa datos de usuario; solo mueve un índice.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export interface Slide {
  id: string;
  content: ReactNode;
}

interface PresentationEngineProps {
  slides: Slide[];
  /** Slide inicial (0-based). Si se omite, se lee `?slide=` de la URL. */
  initialSlide?: number;
  /** Título del deck para la firma de marca (opcional). */
  deckTitle?: string;
}

const MESSAGE_GO = "pandora:presentation:go";
const MESSAGE_STATE = "pandora:presentation:state";

function readEmbedFlag(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

function readSlideFromUrl(): number {
  if (typeof window === "undefined") return 0;
  const raw = new URLSearchParams(window.location.search).get("slide");
  const parsed = raw === null ? NaN : Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function PresentationEngine({ slides, initialSlide, deckTitle }: PresentationEngineProps) {
  const [currentSlide, setCurrentSlide] = useState(() => initialSlide ?? readSlideFromUrl());
  const [isEmbed, setIsEmbed] = useState(false);
  const iframeParentRef = useRef<Window | null>(null);

  const clamp = useCallback(
    (index: number) => Math.min(Math.max(index, 0), Math.max(slides.length - 1, 0)),
    [slides.length]
  );

  useEffect(() => {
    setIsEmbed(readEmbedFlag());
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      iframeParentRef.current = window.parent;
    }
  }, []);

  // Keyboard navigation (only outside embed mode — in-room control belongs to the host)
  useEffect(() => {
    if (isEmbed) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Space" || e.key === " ") {
        setCurrentSlide((prev) => clamp(prev + 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentSlide((prev) => clamp(prev - 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clamp, isEmbed]);

  // Remote control from the meeting room (host-driven sync)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; index?: number } | null;
      if (!data || data.type !== MESSAGE_GO || typeof data.index !== "number") return;
      setCurrentSlide(clamp(data.index));
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [clamp]);

  // Publish state so the room can render its own controls without knowing the deck.
  useEffect(() => {
    const target = iframeParentRef.current;
    if (!target) return;
    target.postMessage({ type: MESSAGE_STATE, index: currentSlide, count: slides.length }, "*");
  }, [currentSlide, slides.length]);

  const progress = useMemo(
    () => (slides.length > 0 ? ((currentSlide + 1) / slides.length) * 100 : 0),
    [currentSlide, slides.length]
  );

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden selection:bg-white/20">
      {/* Marca de la casa: presente en todos los decks, sin tapar el contenido */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 z-20 h-px bg-gradient-to-r from-transparent via-lime-400/40 to-transparent" />
      <div className="pointer-events-none absolute right-6 top-5 z-20 flex items-center gap-3 sm:right-9 sm:top-7">
        <Image
          src="/images/logo_green.png"
          alt="Pandora's"
          width={44}
          height={43}
          className="h-9 w-auto opacity-90 sm:h-10"
        />
        <div className="text-right">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/85 sm:text-xs">
            Pandora&apos;s
          </p>
          <p className="text-[8px] font-mono uppercase tracking-[0.22em] text-zinc-500 sm:text-[10px]">
            Sovereign Presentation
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute -right-16 top-1/2 z-0 -translate-y-1/2 opacity-[0.035]">
        <Image
          src="/images/logo_green.png"
          alt=""
          width={720}
          height={696}
          className="h-[68vh] w-auto"
          aria-hidden="true"
        />
      </div>

      <div className="pointer-events-none absolute bottom-5 right-6 z-20 text-right sm:bottom-6 sm:right-9">
        <p className="text-[8px] font-mono uppercase tracking-[0.25em] text-zinc-600 sm:text-[10px]">
          Pandora&apos;s Group · Confidential
        </p>
        {deckTitle && (
          <p className="max-w-[42vw] truncate text-[8px] font-mono text-zinc-700 sm:text-[10px]">
            {deckTitle}
          </p>
        )}
      </div>

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
          className="relative z-10 w-full max-w-7xl px-8 md:px-16 flex flex-col justify-center items-center text-center"
        >
          {slides[currentSlide]?.content}
        </motion.div>
      </AnimatePresence>

      {/* Embedded mode: thin progress bar only, no interactive chrome */}
      {isEmbed ? (
        <div className="absolute bottom-0 left-0 h-0.5 bg-white/40 z-20 transition-all duration-300" style={{ width: `${progress}%` }} />
      ) : (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((slide, idx) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-8 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
