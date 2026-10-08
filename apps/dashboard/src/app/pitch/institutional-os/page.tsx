"use client";

import { PresentationEngine, Slide } from "@/components/presentation/PresentationEngine";

const slides: Slide[] = [
  {
    id: "s1-title",
    content: (
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-white via-white/90 to-white/50">
          PANDORA&apos;S
        </h1>
        <h2 className="text-3xl font-medium text-white/60 tracking-wide uppercase">
          Institutional Agent OS
        </h2>
        <div className="mt-8 p-1 px-8 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
          <p className="text-xl text-white/80 font-medium tracking-tight">
            AI that can operate — without becoming the authority.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "s2-problem",
    content: (
      <div className="flex flex-col items-start text-left max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-8 uppercase tracking-widest">El Problema</h2>
        <h3 className="text-5xl font-semibold mb-12 leading-tight">La IA empresarial ya puede razonar.</h3>
        <p className="text-2xl text-white/70 mb-8">Pero todavía existe una brecha enorme entre:</p>
        <div className="flex flex-col gap-6 w-full mt-4">
          <div className="p-6 border-l-4 border-white/20 bg-white/5">
            <span className="text-3xl font-medium text-white/50">&ldquo;La IA puede responder&rdquo;</span>
          </div>
          <div className="p-6 border-l-4 border-white bg-white/10">
            <span className="text-3xl font-medium text-white">&ldquo;La IA puede operar&rdquo;</span>
          </div>
        </div>
        <p className="text-xl text-white/50 mt-12">
          ¿Quién es el usuario? ¿En qué organización está? ¿Qué puede hacer? ¿Quién autoriza?
        </p>
      </div>
    ),
  },
  {
    id: "s3-opportunity",
    content: (
      <div className="flex flex-col items-start text-left max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-8 uppercase tracking-widest">La Oportunidad</h2>
        <h3 className="text-6xl font-bold mb-12 leading-tight">Convertir agentes de IA en infraestructura operativa.</h3>
        <ul className="space-y-6 text-3xl text-white/80 font-medium">
          <li className="flex items-center gap-4"><span className="text-white/30">→</span> No otro chatbot.</li>
          <li className="flex items-center gap-4"><span className="text-white/30">→</span> No otro copiloto.</li>
          <li className="flex items-center gap-4 text-white"><span className="text-white/30">→</span> Una capa institucional.</li>
        </ul>
        <div className="flex gap-4 mt-16 text-lg font-mono text-white/50 uppercase">
          <span>Identidad</span>•<span>Contexto</span>•<span>Permisos</span>•<span>Gobernanza</span>•<span>Ejecución</span>
        </div>
      </div>
    ),
  },
  {
    id: "s4-pandoras",
    content: (
      <div className="flex flex-col items-center max-w-5xl">
        <h2 className="text-6xl font-bold mb-6 tracking-tight">Pandora&apos;s</h2>
        <h3 className="text-3xl font-medium text-white/50 mb-16">Institutional Agent OS</h3>
        <p className="text-3xl text-white/80 leading-relaxed text-center mb-16">
          Proporciona la infraestructura para que una organización pueda desplegar agentes de IA capaces de:
        </p>
        <div className="flex flex-wrap justify-center items-center gap-4 text-2xl font-bold">
          <span className="px-6 py-3 bg-white/10 rounded-lg">Entender</span>
          <span className="text-white/30">→</span>
          <span className="px-6 py-3 bg-white/10 rounded-lg">Proponer</span>
          <span className="text-white/30">→</span>
          <span className="px-6 py-3 bg-white/20 rounded-lg text-white">Solicitar autorización</span>
          <span className="text-white/30">→</span>
          <span className="px-6 py-3 border border-white/20 rounded-lg">Ejecutar</span>
          <span className="text-white/30">→</span>
          <span className="px-6 py-3 border border-white/10 text-white/50 rounded-lg">Auditar</span>
        </div>
      </div>
    ),
  },
  {
    id: "s5-hermes",
    content: (
      <div className="flex flex-col items-center max-w-4xl">
        <h2 className="text-6xl font-bold mb-6 tracking-tight">Hermes</h2>
        <h3 className="text-3xl font-medium text-white/50 mb-16">Cognitive Runtime</h3>
        <div className="text-left w-full space-y-8">
          <p className="text-3xl font-medium text-white/90">
            Su función no es controlar la organización.
          </p>
          <p className="text-3xl font-medium text-white/60">
            Su función es:
          </p>
          <ul className="text-4xl font-bold space-y-4">
            <li>Entender el contexto.</li>
            <li>Razonar.</li>
            <li>Proponer decisiones y acciones.</li>
          </ul>
          <div className="mt-12 p-6 border border-white/10 bg-white/5 rounded-xl">
            <p className="text-2xl text-white">La autoridad permanece fuera del modelo.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "s6-architecture",
    content: (
      <div className="flex flex-col items-center w-full pb-20">
        <h2 className="text-4xl font-bold text-white/50 mb-4 uppercase tracking-widest">La Arquitectura</h2>
        <h3 className="text-3xl font-medium text-white/80 mb-8">De la inteligencia a la ejecución</h3>
        
        <div className="flex flex-col items-center text-lg font-mono uppercase tracking-widest gap-1.5">
          <div className="py-1.5 px-8 rounded bg-white/5 text-white/70">Identity</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded bg-white/5 text-white/70">Context</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded bg-white/5 text-white/70">Knowledge</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded bg-white/10 text-white/90">Capabilities</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded bg-white/10 text-white/90">Policy</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded border border-white/30 text-white">Governance</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded bg-white text-black font-bold">Action Gateway</div>
          <div className="text-white/20 text-sm">↓</div>
          <div className="py-1.5 px-8 rounded border border-white/10 text-white/50">Operations</div>
        </div>
      </div>
    ),
  },
  {
    id: "s7-rule",
    content: (
      <div className="flex flex-col items-center text-center max-w-4xl">
        <h2 className="text-3xl font-bold text-white/50 mb-16 uppercase tracking-widest">Una regla fundamental</h2>
        <div className="space-y-6 text-6xl font-bold tracking-tight">
          <p className="text-white/50">Hermes proposes.</p>
          <p className="text-white/80">Governance authorizes.</p>
          <p className="text-white">Operations execute.</p>
        </div>
      </div>
    ),
  },
  {
    id: "s8-difference",
    content: (
      <div className="flex flex-col items-start text-left max-w-5xl w-full">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">¿Por qué es diferente?</h2>
        <h3 className="text-7xl font-extrabold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/40">
          AI ≠ Authority
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
            <h4 className="text-2xl font-bold mb-4">Inteligencia</h4>
            <p className="text-white/60 text-lg">La IA interpreta y propone.</p>
          </div>
          <div className="p-8 bg-white/10 border border-white/20 rounded-2xl">
            <h4 className="text-2xl font-bold mb-4">Autoridad</h4>
            <p className="text-white text-lg">La organización determina qué está permitido.</p>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-2xl">
            <h4 className="text-2xl font-bold mb-4">Ejecución</h4>
            <p className="text-white/60 text-lg">Los sistemas autorizados realizan la acción.</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "s9-objective",
    content: (
      <div className="flex flex-col items-center text-center max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">El objetivo</h2>
        <h3 className="text-5xl font-semibold mb-16 leading-tight">
          Hacer posible el siguiente salto de la IA empresarial.
        </h3>
        <div className="flex items-center gap-6 text-3xl font-bold">
          <span className="text-white/30 line-through">Chatbots</span>
          <span className="text-white/30">→</span>
          <span className="text-white/60">Agents</span>
          <span className="text-white/30">→</span>
          <span className="text-white px-6 py-3 border-2 border-white rounded-xl">Institutional Agents</span>
        </div>
      </div>
    ),
  },
  {
    id: "s10-status",
    content: (
      <div className="flex flex-col items-start text-left max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">Estado actual</h2>
        <h3 className="text-5xl font-bold mb-8">No estamos presentando un demo artificial.</h3>
        <p className="text-3xl text-white/70 mb-12 leading-relaxed">
          Hermes todavía no está en estado de demo comercial.<br/>
          <span className="text-white font-bold">Y eso es deliberado.</span>
        </p>
        <p className="text-xl text-white/50 mb-8 uppercase tracking-widest font-mono">
          Cerrando arquitectura fundamental:
        </p>
        <div className="flex flex-wrap gap-4 text-xl">
          {["Autoridad", "Seguridad", "Identidad", "Contexto", "Permisos", "Ejecución", "Auditoría"].map(t => (
            <span key={t} className="px-4 py-2 bg-white/10 rounded-lg">{t}</span>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "s11-define",
    content: (
      <div className="flex flex-col items-center text-center max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">Definición Estratégica</h2>
        <h3 className="text-6xl font-bold mb-16">¿Dónde debe vivir el primer Hermes?</h3>
        <p className="text-2xl text-white/60 mb-12">Buscamos identificar:</p>
        <div className="flex flex-col gap-6 text-4xl font-bold">
          <div className="flex items-center gap-6 justify-center">
            <span className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full text-2xl">1</span>
            <span className="text-white/80">mercado prioritario</span>
          </div>
          <div className="flex items-center gap-6 justify-center">
            <span className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full text-2xl">3</span>
            <span className="text-white/80">oportunidades concretas</span>
          </div>
          <div className="flex items-center gap-6 justify-center">
            <span className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full text-2xl">1</span>
            <span className="text-white">piloto estratégico</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "s12-market-fit",
    content: (
      <div className="flex flex-col items-start text-left max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">Lo que necesitamos validar</h2>
        <h3 className="text-6xl font-bold mb-16">Market Fit</h3>
        <ul className="space-y-8 text-3xl font-medium text-white/80">
          <li>¿Qué organizaciones tienen este problema?</li>
          <li>¿Qué parte de su operación tiene mayor valor?</li>
          <li>¿Qué riesgo están dispuestas a resolver?</li>
          <li className="text-white">¿Cuál sería un piloto suficientemente valioso?</li>
        </ul>
      </div>
    ),
  },
  {
    id: "s13-beachhead",
    content: (
      <div className="flex flex-col items-center text-center max-w-5xl">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">El primer beachhead</h2>
        <h3 className="text-5xl font-medium text-white/80 mb-16">No necesitamos conquistar todo el mercado.</h3>
        <div className="flex flex-wrap justify-center items-center gap-6 text-3xl font-bold">
          <span className="text-white">Una organización</span>
          <span className="text-white/30">→</span>
          <span className="text-white/80">Un problema crítico</span>
          <span className="text-white/30">→</span>
          <span className="text-white px-6 py-3 bg-white/10 rounded-xl">Un piloto</span>
          <span className="text-white/30">→</span>
          <span className="text-white/50">Un caso de referencia</span>
        </div>
      </div>
    ),
  },
  {
    id: "s14-sequence",
    content: (
      <div className="flex flex-col items-center w-full">
        <h2 className="text-3xl font-bold text-white/50 mb-12 uppercase tracking-widest">De piloto a plataforma</h2>
        <div className="flex flex-col items-center text-2xl font-bold uppercase tracking-wider gap-4">
          <div className="text-white/40">Problema</div>
          <div className="text-white/20">↓</div>
          <div className="text-white/60">Piloto</div>
          <div className="text-white/20">↓</div>
          <div className="text-white/80">Primer cliente estratégico</div>
          <div className="text-white/20">↓</div>
          <div className="text-white px-8 py-3 border border-white/20 rounded-xl">Caso de uso validado</div>
          <div className="text-white/20">↓</div>
          <div className="text-white/80">Plataforma</div>
          <div className="text-white/20">↓</div>
          <div className="text-white/60">Escalamiento</div>
          <div className="text-white/20">↓</div>
          <div className="text-white/40">Capital</div>
        </div>
      </div>
    ),
  },
  {
    id: "s15-vision",
    content: (
      <div className="flex flex-col items-center text-center max-w-4xl">
        <h2 className="text-4xl font-bold text-white/50 mb-12 uppercase tracking-widest">La Visión</h2>
        <h3 className="text-6xl font-extrabold mb-12 bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40">
          AI infrastructure for institutions.
        </h3>
        <p className="text-3xl text-white/70 leading-relaxed font-medium">
          La infraestructura que permita a organizaciones desplegar agentes de IA capaces de{" "}
          <span className="text-white">razonar y operar dentro de sistemas reales</span>,{" "}
          sin perder el control institucional.
        </p>
      </div>
    ),
  },
  {
    id: "s16-final",
    content: (
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-8xl font-black tracking-tighter mb-4">
          PANDORA&apos;S
        </h1>
        <h2 className="text-4xl font-medium text-white/80 tracking-tight">
          AI that can operate.
        </h2>
        <h3 className="text-3xl font-medium text-white/50 tracking-tight mb-12">
          Without becoming the authority.
        </h3>
        <div className="flex gap-4 mt-8 text-sm font-mono text-white/40 uppercase tracking-widest">
          <span>Identity</span>•<span>Context</span>•<span>Capability</span>•<span>Policy</span>•<span>Governance</span>•<span>Execution</span>
        </div>
      </div>
    ),
  },
];

export default function PitchPage() {
  return <PresentationEngine slides={slides} />;
}
