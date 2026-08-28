'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  ShieldCheck, 
  Database, 
  Layers, 
  Workflow, 
  Lock, 
  Sparkles, 
  Bot, 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  FileText, 
  Server,
  KeyRound,
  Eye,
  Radio,
  Share2,
  LogIn
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GrowthOSLeadModal } from "@/components/marketing/GrowthOSLeadModal";

export default function HermesArchitecturePage() {
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [modalSource, setModalSource] = useState('hermes_architecture_landing');

  const handleOpenCTA = (source: string) => {
    setModalSource(source);
    setIsLeadModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white selection:bg-purple-500 selection:text-black font-sans relative overflow-hidden">
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[550px] bg-gradient-to-b from-purple-500/15 via-indigo-500/5 to-transparent blur-[160px] pointer-events-none" />
      <div className="absolute top-1/2 right-0 w-[600px] h-[600px] bg-purple-500/5 blur-[180px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/growth-os/hermes"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
                <Cpu className="w-6 h-6" />
              </div>
              <div>
                <span className="text-lg font-light tracking-tight text-white">HERMES OS</span>
                <span className="text-xs text-purple-400 font-mono ml-2 hidden sm:inline">Topología & Arquitectura</span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-light">
            <a href="#pipeline" className="hover:text-white transition-colors">Pipeline de 5 Capas</a>
            <a href="#vault" className="hover:text-white transition-colors">Bóveda Criptográfica</a>
            <a href="#isolation" className="hover:text-white transition-colors">Aislamiento Multi-Tenant</a>
            <a href="#omnichannel" className="hover:text-white transition-colors">Omnicanalidad</a>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleOpenCTA('hermes_arch_cta')}
              className="border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl transition-all"
            >
              <span className="hidden sm:inline">Solicitar Assessment</span>
              <span className="sm:hidden">Assessment</span>
            </Button>
            <Link 
              href="/portal/login"
              title="Acceder al Portal"
              className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-purple-500/40 transition-all flex items-center justify-center"
            >
              <LogIn className="w-4 h-4 text-purple-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-4 py-1.5 rounded-full mb-8 font-mono inline-flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Hermes Cognitive Operating System — Governance & Architecture Blueprint</span>
        </Badge>

        <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
          Cómo transformamos conocimiento institucional en <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-purple-500 bg-clip-text text-transparent font-normal">agentes autónomos de alta fidelidad</span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 font-light max-w-3xl mx-auto leading-relaxed mb-12">
          Hermes OS no es una envoltura de LLMs tradicional. Es un sistema operativo cognitivo determinista que combina <strong>bóvedas descentralizadas en IPFS</strong>, <strong>identidades criptográficas institucionales</strong> y <strong>firewalls de gobernanza post-LLM</strong> para garantizar cero alucinaciones financieras y estricta certidumbre legal.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto font-mono text-xs text-zinc-300">
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-purple-400 font-bold text-lg mb-1">0%</div>
            <div className="text-zinc-500 text-[11px]">Alucinaciones Comerciales</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-emerald-400 font-bold text-lg mb-1">100%</div>
            <div className="text-zinc-500 text-[11px]">Aislamiento Multi-Tenant</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-indigo-400 font-bold text-lg mb-1">AES-256</div>
            <div className="text-zinc-500 text-[11px]">Bóveda IPFS Cifrada</div>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-amber-400 font-bold text-lg mb-1">EIP-712</div>
            <div className="text-zinc-500 text-[11px]">Firma de Contratos de Hechos</div>
          </div>
        </div>
      </section>

      {/* PIPELINE DE 5 CAPAS */}
      <section id="pipeline" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-800/80">
        <div className="text-center mb-16">
          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-mono mb-4">
            Pipeline Cognitivo de Ejecución
          </Badge>
          <h2 className="text-3xl md:text-4xl font-light text-white mb-4">
            La Anatomía de una Interacción Segura
          </h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-2xl mx-auto font-light">
            Cada mensaje recibido desde cualquier canal atraviesa una secuencia de validación estricta antes de generar y emitir cualquier respuesta al usuario.
          </p>
        </div>

        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Layer 1 */}
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/70 p-8 flex flex-col md:flex-row gap-6 items-start hover:border-purple-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 shrink-0">
              <Radio className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">Capa 01</span>
                <Badge className="bg-zinc-900 border-zinc-800 text-[10px] font-mono text-zinc-400">Omnichannel Mesh</Badge>
              </div>
              <h3 className="text-lg font-medium text-white">Canal & Adaptador de Entrada</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                El mensaje entra vía WhatsApp Cloud API, Telegram Bot (@snaraiassit_bot / @pandorasHermes_bot), SignalWire SMS o Web Widget. El adaptador normaliza el payload y extrae los identificadores de sesión sin exponer tokens ni credenciales.
              </p>
            </div>
          </div>

          {/* Layer 2 */}
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/70 p-8 flex flex-col md:flex-row gap-6 items-start hover:border-purple-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Capa 02</span>
                <Badge className="bg-zinc-900 border-zinc-800 text-[10px] font-mono text-zinc-400">Authority Boundary</Badge>
              </div>
              <h3 className="text-lg font-medium text-white">Resolución de Autoridad & Aislamiento de Tenant</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                El sistema valida el UUID canónico del tenant en la sesión. Se activan las políticas de Row-Level Security (RLS) en la base de datos para impedir cualquier cruce de información entre organizaciones o clientes distintos.
              </p>
            </div>
          </div>

          {/* Layer 3 */}
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/70 p-8 flex flex-col md:flex-row gap-6 items-start hover:border-purple-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">Capa 03</span>
                <Badge className="bg-zinc-900 border-zinc-800 text-[10px] font-mono text-zinc-400">Cognitive Context Builder</Badge>
              </div>
              <h3 className="text-lg font-medium text-white">Inyección de Conocimiento Soberano & Identidad de Marca</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                Se construye el contexto cognitivo exclusivo del proyecto: Soul de marca, hechos verificados en la Bóveda IPFS, embudos de conversión (Journeys) y Add-Ons activos (ej. Real Estate Pack, Presale Strategy).
              </p>
            </div>
          </div>

          {/* Layer 4 */}
          <div className="border border-zinc-800 rounded-3xl bg-zinc-950/70 p-8 flex flex-col md:flex-row gap-6 items-start hover:border-purple-500/30 transition-all">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-amber-400 uppercase tracking-wider">Capa 04</span>
                <Badge className="bg-zinc-900 border-zinc-800 text-[10px] font-mono text-zinc-400">Hermes Reasoning Runtime</Badge>
              </div>
              <h3 className="text-lg font-medium text-white">Razonamiento Guiado & Delimitación Epistémica</h3>
              <p className="text-xs text-zinc-400 font-light leading-relaxed">
                El motor de inferencia procesa la consulta bajo instrucciones estrictas de categorización de hechos (FACT / PROCESS / PROJECTION), evitando supuestos infundados y ciñéndose a la certidumbre jurídica autorizada.
              </p>
            </div>
          </div>

          {/* Layer 5 */}
          <div className="border border-purple-500/40 rounded-3xl bg-gradient-to-b from-purple-500/10 via-zinc-950 to-zinc-950 p-8 flex flex-col md:flex-row gap-6 items-start shadow-xl">
            <div className="p-3.5 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-purple-300 uppercase tracking-wider">Capa 05 (Gobernanza)</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] font-mono">Post-LLM Safety Gate</Badge>
              </div>
              <h3 className="text-lg font-medium text-white">Firewall de Divulgación & Normalización Automática</h3>
              <p className="text-xs text-zinc-300 font-light leading-relaxed">
                Antes de ser transmitida al usuario, la respuesta es auditada por el <strong>TenantResponsePolicyGate</strong> y el <strong>ClaimContractEngine</strong>. Se normaliza el vocabulario institucional, se permite transparencia en aclaraciones legales y se bloquean de forma determinista promesas financieras indebidas o intentos de exfiltración.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BÓVEDA CRIPTOGRÁFICA EN IPFS */}
      <section id="vault" className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs px-3 py-1 font-mono mb-6">Sovereign Knowledge Vault</Badge>
            <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
              Tus documentos institucionales resguardados con <span className="text-purple-400 font-normal">inmutabilidad descentralizada</span>
            </h2>
            <p className="text-sm text-zinc-300 font-light leading-relaxed mb-6">
              Cada proyecto custodia su verdad operativa en una bóveda soberana en IPFS. Los contratos, brochures técnicos y balances financieros se cifran mediante Envelope Encryption (AES-256-GCM) antes de su anclaje.
            </p>

            <div className="space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-zinc-300"><strong>Envelope Encryption:</strong> Llaves efímeras por documento, cero almacenamiento en texto plano.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-zinc-300"><strong>Claim Contract EIP-712:</strong> Cada hecho es firmado criptográficamente por la wallet del agente.</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-zinc-300"><strong>Recibos Notarizados de Evidencia:</strong> Respuestas auditables con hash-chain inmutable.</span>
              </div>
            </div>
          </div>

          <div className="border border-zinc-800 rounded-3xl bg-zinc-950 p-8 space-y-4 font-mono text-xs relative">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <span className="text-zinc-400">ClaimProvenanceReceipt (K26.1)</span>
              <Badge className="bg-emerald-500/10 text-emerald-400 text-[10px]">VERIFIED_PROOF</Badge>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/80 text-zinc-300 space-y-2 overflow-x-auto text-[11px] leading-relaxed">
              <div><span className="text-purple-400">tenantId:</span> &quot;snarai&quot;</div>
              <div><span className="text-purple-400">governanceStatus:</span> &quot;ACTIVE&quot;</div>
              <div><span className="text-purple-400">contractCid:</span> &quot;ipfs://bafkreicnahivpdzug3rrsm...&quot;</div>
              <div><span className="text-purple-400">agentSigner:</span> &quot;0x121A897F0f5A9b7C44756F40bDb2C8E87D2834fa&quot;</div>
              <div><span className="text-purple-400">policyDecision:</span> &quot;ALLOW&quot; [Epistemic Backing Confirmed]</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-24 px-6 max-w-7xl mx-auto border-t border-zinc-800/80 text-center">
        <div className="max-w-3xl mx-auto border border-zinc-800 rounded-3xl bg-zinc-950 p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-2xl md:text-3xl font-light text-white mb-4">
            Despliega la infraestructura autónoma de tu empresa
          </h2>
          <p className="text-sm text-zinc-400 font-light mb-8 max-w-xl mx-auto">
            Integra tus documentos institucionales, configura tus embudos comerciales y opera agentes auditables en Telegram, WhatsApp y Web en minutos.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => handleOpenCTA('hermes_arch_bottom_cta')}
              size="lg"
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm px-8 py-4 rounded-2xl shadow-xl shadow-purple-600/20 transition-all"
            >
              Solicitar Assessment Enterprise
            </Button>
            <Link
              href="/growth-os/hermes"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-light transition-all"
            >
              Volver a Hermes Overview
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-zinc-900 bg-[#050507] text-zinc-500 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>© {new Date().getFullYear()} Pandora&apos;s Group. Todos los derechos reservados.</div>
          <div className="flex items-center gap-6">
            <Link href="/growth-os/hermes" className="hover:text-zinc-300 transition-colors">Hermes OS</Link>
            <Link href="/growth-os" className="hover:text-zinc-300 transition-colors">Growth OS</Link>
            <Link href="/media" className="hover:text-zinc-300 transition-colors">Media Co</Link>
          </div>
        </div>
      </footer>

      <GrowthOSLeadModal 
        isOpen={isLeadModalOpen} 
        onClose={() => setIsLeadModalOpen(false)} 
        source={modalSource} 
      />
    </div>
  );
}
