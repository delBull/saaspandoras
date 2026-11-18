"use client";

import type { ReactNode } from "react";
import { PresentationEngine, type Slide } from "./PresentationEngine";
import type { DeckBlock, DeckDocument } from "@/lib/nexus/deck-schema";

/**
 * Renderiza un deck que viene de la base de datos (CMS).
 * No evalúa HTML: cada bloque es un componente tipado. La navegación, el modo
 * embebido y la sincronización con la sala viven en `PresentationEngine`.
 */

function Hero({ block }: { block: Extract<DeckBlock, { type: "hero" }> }) {
  return (
    <div className="flex flex-col items-center gap-5 max-w-4xl mx-auto">
      {block.kicker && (
        <span className="text-[11px] uppercase tracking-[0.3em] text-purple-300 border border-purple-500/20 bg-purple-500/10 rounded-full px-4 py-1.5">
          {block.kicker}
        </span>
      )}
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-zinc-400">
        {block.title}
      </h1>
      {block.subtitle && <p className="text-2xl md:text-3xl font-light text-zinc-300 max-w-2xl">{block.subtitle}</p>}
      {block.footnote && <p className="mt-6 text-sm text-zinc-500">{block.footnote}</p>}
    </div>
  );
}

function SlideShell({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-5xl mx-auto text-left">
      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-purple-400 mb-2">
        {String(index + 1).padStart(2, "0")} · {title}
      </p>
      {children}
    </div>
  );
}

function renderBlock(block: DeckBlock, index: number): ReactNode {
  switch (block.type) {
    case "hero":
      return <Hero key={index} block={block} />;

    case "metrics":
      return (
        <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
          {block.items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-5 text-center">
              <p className="text-2xl md:text-3xl font-bold text-white">{item.value}</p>
              <p className="mt-1 text-[11px] uppercase tracking-wider text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>
      );

    case "info":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-6">
          {block.boxes.map((box) => (
            <div key={box.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-wider text-zinc-500">{box.title}</p>
              <p className="mt-1 text-sm text-zinc-300 leading-relaxed">{box.text}</p>
            </div>
          ))}
        </div>
      );

    case "numbered":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-6">
          {block.items.map((item, itemIndex) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[11px] font-mono text-purple-300">{String(itemIndex + 1).padStart(2, "0")}</p>
              <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "pillars":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-6">
          {block.items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full mt-6">
          {block.items.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="text-[10px] font-mono uppercase tracking-wider text-purple-300">{item.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full mt-6">
          {block.items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
              <span className="mt-0.5 text-emerald-400">✓</span>
              <span className="text-sm text-zinc-300">{item}</span>
            </div>
          ))}
        </div>
      );

    case "prices":
      return (
        <div key={index} className="w-full mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {block.items.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-5 text-center ${
                  item.accent ? "border-purple-500/40 bg-purple-500/10" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">{item.label}</p>
                <p className={`mt-2 text-3xl font-bold ${item.accent ? "text-purple-200" : "text-white"}`}>{item.value}</p>
                <p className="mt-1 text-[11px] text-zinc-500">{item.note}</p>
              </div>
            ))}
          </div>
          {block.footnote && <p className="mt-4 text-xs text-zinc-500">{block.footnote}</p>}
        </div>
      );

    case "note":
      return (
        <p key={index} className="mt-6 max-w-3xl text-sm text-zinc-400 leading-relaxed">
          {block.text}
        </p>
      );

    case "closing":
      return (
        <div key={index} className="w-full mt-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight text-center">{block.title}</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3">
            {block.steps.map((step) => (
              <div key={step.label} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left">
                <p className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">{step.label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-[11px] text-zinc-400 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
          {block.footnote && <p className="mt-6 text-center text-sm text-zinc-400">{block.footnote}</p>}
        </div>
      );

    default:
      return null;
  }
}

export function DeckRenderer({ deck }: { deck: DeckDocument }) {
  const slides: Slide[] = deck.slides.map((slide, index) => ({
    id: slide.id,
    content: <SlideShell index={index} title={slide.title}>{slide.blocks.map(renderBlock)}</SlideShell>,
  }));

  return <PresentationEngine slides={slides} />;
}
