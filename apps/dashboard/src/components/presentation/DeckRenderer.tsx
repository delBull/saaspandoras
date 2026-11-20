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
    <div className="flex flex-col items-center gap-5 max-w-5xl mx-auto">
      {block.kicker && (
        <span className="text-[clamp(0.85rem,1.6vh,1.05rem)] uppercase tracking-[0.28em] text-purple-200 border border-purple-500/25 bg-purple-500/10 rounded-full px-5 py-2">
          {block.kicker}
        </span>
      )}
      <h1 className="text-[clamp(2.8rem,6vh,4.3rem)] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-zinc-400">
        {block.title}
      </h1>
      {block.subtitle && <p className="text-[clamp(1.5rem,3.2vh,2.35rem)] font-light text-zinc-200 max-w-3xl leading-snug">{block.subtitle}</p>}
      {block.footnote && <p className="mt-6 text-[clamp(1rem,1.9vh,1.3rem)] text-zinc-400">{block.footnote}</p>}
    </div>
  );
}

function SlideShell({ index, title, children }: { index: number; title: string; children: ReactNode }) {
  return (
    <div className="w-full max-w-6xl mx-auto text-left">
      <p className="text-[clamp(0.85rem,1.6vh,1.05rem)] font-mono uppercase tracking-[0.25em] text-purple-300 mb-4">
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
        <div key={index} className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {block.items.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 text-center">
              <p className="text-[clamp(2.4rem,4.8vh,3.3rem)] font-bold text-white tracking-tight">{item.value}</p>
              <p className="mt-2 text-[clamp(0.72rem,1.3vh,0.9rem)] uppercase tracking-wider text-zinc-400">{item.label}</p>
            </div>
          ))}
        </div>
      );

    case "info":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
          {block.boxes.map((box) => (
            <div key={box.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[clamp(0.72rem,1.3vh,0.9rem)] uppercase tracking-wider text-zinc-400">{box.title}</p>
              <p className="mt-2 text-[clamp(1rem,1.9vh,1.3rem)] text-zinc-200 leading-relaxed">{box.text}</p>
            </div>
          ))}
        </div>
      );

    case "numbered":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-8">
          {block.items.map((item, itemIndex) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-mono text-purple-300">{String(itemIndex + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-[clamp(1.15rem,2.3vh,1.5rem)] font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-[clamp(1rem,1.9vh,1.3rem)] text-zinc-300 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "pillars":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
          {block.items.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[clamp(1.15rem,2.3vh,1.5rem)] font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-[clamp(1rem,1.9vh,1.3rem)] text-zinc-300 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "steps":
      return (
        <div key={index} className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full mt-8">
          {block.items.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[clamp(0.72rem,1.3vh,0.9rem)] font-mono uppercase tracking-wider text-purple-300">{item.label}</p>
              <p className="mt-2 text-[clamp(1rem,1.9vh,1.3rem)] font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-[clamp(0.85rem,1.6vh,1.05rem)] text-zinc-300 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      );

    case "checklist":
      return (
        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-8">
          {block.items.map((item) => (
            <div key={item} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <span className="mt-0.5 text-lg text-emerald-400">✓</span>
              <span className="text-[clamp(1rem,1.9vh,1.3rem)] text-zinc-200 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      );

    case "prices":
      return (
        <div key={index} className="w-full mt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {block.items.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-6 text-center ${
                  item.accent ? "border-purple-500/40 bg-purple-500/10" : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <p className="text-[clamp(0.72rem,1.3vh,0.9rem)] uppercase tracking-wider text-zinc-400">{item.label}</p>
                <p className={`mt-2 text-[clamp(2.4rem,4.8vh,3.3rem)] font-bold tracking-tight ${item.accent ? "text-purple-200" : "text-white"}`}>{item.value}</p>
                <p className="mt-2 text-[clamp(0.85rem,1.6vh,1.05rem)] text-zinc-400">{item.note}</p>
              </div>
            ))}
          </div>
          {block.footnote && <p className="mt-5 text-[clamp(0.85rem,1.6vh,1.05rem)] text-zinc-400 leading-relaxed">{block.footnote}</p>}
        </div>
      );

    case "note":
      return (
        <p key={index} className="mt-8 max-w-4xl text-[clamp(1rem,1.9vh,1.3rem)] text-zinc-300 leading-relaxed">
          {block.text}
        </p>
      );

    case "closing":
      return (
        <div key={index} className="w-full mt-4">
          <h2 className="text-[clamp(2.4rem,5.2vh,3.6rem)] font-bold text-white leading-tight text-center tracking-tight">{block.title}</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {block.steps.map((step) => (
              <div key={step.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-left">
                <p className="text-[clamp(0.72rem,1.3vh,0.9rem)] font-mono uppercase tracking-wider text-emerald-300">{step.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{step.title}</p>
                <p className="mt-1 text-base text-zinc-300 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
          {block.footnote && <p className="mt-6 text-center text-base text-zinc-300">{block.footnote}</p>}
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

  return <PresentationEngine slides={slides} deckTitle={deck.title} />;
}
