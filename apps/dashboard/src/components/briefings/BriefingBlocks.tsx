'use client';

import React from 'react';
import Link from 'next/link';

export function BlockHero({ data }: { data: any }) {
  return (
    <section className="relative w-full min-h-[85vh] flex flex-col justify-between px-6 md:px-12 lg:px-24 pt-12 pb-24 border-b border-black/10 print:min-h-0 print:h-[100vh] print:border-none print:break-after-page">
      <div className="relative z-10">
        <span className="inline-block text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-black/50 mb-4 border border-black/10 px-3 py-1">
          Pandora's Knowledge Layer
        </span>
        <h1 className="text-4xl md:text-6xl lg:text-8xl font-medium tracking-tighter text-black max-w-5xl leading-[0.9]">
          {data.title}
        </h1>
        {data.subtitle && (
          <p className="mt-6 text-lg md:text-xl text-black/60 max-w-2xl font-light tracking-wide">
            {data.subtitle}
          </p>
        )}
      </div>

      {data.hook && (
        <div className="relative z-10 mt-24 md:mt-0 max-w-4xl">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif italic text-black leading-tight">
            "{data.hook}"
          </h2>
        </div>
      )}
    </section>
  );
}

export function BlockJourney({ data }: { data: any }) {
  const title = data.title || "El Recorrido";
  const steps = data.steps || ["Descubrir", "Entender", "Participar", "Beneficiarse"];

  return (
    <section className="px-6 md:px-12 lg:px-24 py-24 border-b border-black/10 print:py-12 print:border-none print:break-inside-avoid">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-16 text-black/40">{title}</h3>
      
      <div className="flex flex-col md:flex-row items-start md:items-start justify-between gap-8 md:gap-0">
        {steps.map((step: any, index: number) => {
          const isString = typeof step === 'string';
          const stepNumber = isString ? `0${index + 1}` : (step.step || `0${index + 1}`);
          const stepTitle = isString ? step : step.title;
          const stepText = isString ? null : step.text;

          return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-start gap-2 max-w-[200px]">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-[10px] font-mono text-black/30">{stepNumber}</span>
                <span className="text-xl md:text-2xl font-medium tracking-tight text-black">{stepTitle}</span>
              </div>
              {stepText && (
                <p className="text-sm text-black/60 font-light">{stepText}</p>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="hidden md:block flex-1 h-[1px] bg-black/10 mx-8 mt-4" />
            )}
            {index < steps.length - 1 && (
              <div className="block md:hidden h-8 w-[1px] bg-black/10 ml-5" />
            )}
          </React.Fragment>
          );
        })}
      </div>
    </section>
  );
}

export function BlockSixtySeconds({ data }: { data: any }) {
  const q1 = data.q1 || { title: 'Qué es', content: '' };
  const q2 = data.q2 || { title: 'Cómo funciona', content: '' };
  const q3 = data.q3 || { title: 'Qué recibes', content: '' };
  const q4 = data.q4 || { title: 'Qué sigue', content: '' };

  const cards = [q1, q2, q3, q4];

  return (
    <section className="px-6 md:px-12 lg:px-24 py-24 border-b border-black/10 bg-white print:py-12 print:border-none print:break-inside-avoid">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-16 text-black/40">En 60 segundos</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {cards.map((card: any, index: number) => (
          <div key={index} className="flex flex-col space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.1em] text-black border-b border-black/10 pb-4">
              {card.title}
            </h4>
            <div className="text-sm text-black/70 leading-relaxed font-light">
              {card.content}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BlockPrinciples({ data }: { data: any }) {
  const title = data.title || "Principios";
  const principles = data.principles || data.list || [
    "Transparencia antes que complejidad.",
    "Infraestructura antes que especulación.",
    "Participación antes que exclusividad.",
    "Largo plazo antes que ciclos.",
    "Acceso antes que privilegio."
  ];

  return (
    <section className="px-6 md:px-12 lg:px-24 py-24 border-b border-black/10 print:py-12 print:border-none print:break-inside-avoid">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-16 text-black/40">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl">
        {principles.map((principle: any, index: number) => {
          const isString = typeof principle === 'string';
          const pTitle = isString ? principle : principle.title;
          const pText = isString ? null : principle.text;

          return (
            <div key={index} className="flex items-start gap-6">
              <div className="w-1.5 h-1.5 rounded-full bg-black mt-2.5 shrink-0" />
              <div>
                <p className={`text-xl md:text-2xl text-black ${isString ? 'font-light' : 'font-medium'} tracking-tight`}>{pTitle}</p>
                {pText && (
                  <p className="mt-2 text-black/60 font-light text-sm max-w-sm">{pText}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function BlockNextSteps({ data, projectSlug }: { data: any, projectSlug: string }) {
  const steps = data.steps || [
    { title: "Agenda una conversación", action: "mailto:hello@pandoras.finance" },
    { title: "Explora el Portal", action: "https://dash.pandoras.finance" },
    { title: "Lee el Whitepaper", action: "#" },
    { title: "Únete a Telegram", action: "#" },
    { title: "Consulta la documentación legal", action: "#" }
  ];

  return (
    <section className="px-6 md:px-12 lg:px-24 py-24 bg-black text-white print:bg-white print:text-black print:border-t print:border-black/10 print:py-12 print:break-inside-avoid">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-16 text-white/40 print:text-black/40">Próximo paso</h3>
      
      <div className="flex flex-col space-y-4 max-w-2xl">
        {steps.map((step: any, index: number) => (
          <React.Fragment key={index}>
            <a 
              href={step.action} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex items-center justify-between text-2xl md:text-3xl lg:text-4xl font-light hover:italic transition-all duration-300"
            >
              <span>{step.title}</span>
              <span className="opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                →
              </span>
            </a>
            {index < steps.length - 1 && (
              <div className="h-[1px] w-full bg-white/10 print:bg-black/10" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
