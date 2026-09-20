'use client';

/**
 * 🏛️ Directorio Oficial de Agentes y Brokers Certificados RWA
 * apps/dashboard/src/app/academy/directorio/page.tsx
 *
 * Registro Soberano de Especialistas en Tokenización Inmobiliaria
 * Cohorte Génesis — Bahía de Banderas, Nayarit, México
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Building2,
  Award,
  Sparkles,
  MapPin,
  CheckCircle2,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Filter,
  ArrowLeft,
  Share2,
  BadgeCheck
} from 'lucide-react';

interface CertifiedAgent {
  id: string;
  name: string;
  role: string;
  agency: string;
  city: string;
  cohort: string;
  certId: string;
  status: 'CERTIFIED' | 'ADMITTED';
  projectsAuthorized: string[];
  photoUrl?: string;
  phone: string;
  email: string;
  specialty: string;
}

export default function CertifiedAgentsDirectoryPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // 10 Plazas Fundacionales de la Cohorte Génesis
  const genesisAgents: CertifiedAgent[] = [
    {
      id: 'agent_01',
      name: 'Marco Antonio Morales (Founder Lead)',
      role: 'Master RWA Specialist & Head of Expansion',
      agency: 'Pandora\'s Fiduciary Institute',
      city: 'Bahía de Banderas, Nayarit',
      cohort: 'Cohorte Génesis · Cupo #01',
      certId: 'cert_genesis_001_marco',
      status: 'CERTIFIED',
      projectsAuthorized: ['S\'Narai Residences (Bucerías)', 'Torre Vista Horizonte (Bucerías)', 'Pie de Playa (Nuevo Vallarta)'],
      phone: '+52 322 274 1987',
      email: 'marco@pandoras.finance',
      specialty: 'Estructuración Fiduciaria & Preventas Sindicadas'
    },
    {
      id: 'agent_02',
      name: 'Elena Vega Castillo',
      role: 'Directora de Ventas Patrimoniales',
      agency: 'Riviera Gold Real Estate',
      city: 'Bucerías, Nayarit',
      cohort: 'Cohorte Génesis · Cupo #02',
      certId: 'cert_genesis_002_elena',
      status: 'CERTIFIED',
      projectsAuthorized: ['S\'Narai Residences (Bucerías)', 'Torre Vista Horizonte (Bucerías)'],
      phone: '+52 322 100 2345',
      email: 'elena@rivieragold.mx',
      specialty: 'Inversionistas Canadienses & Nómadas Digitales'
    },
    {
      id: 'agent_03',
      name: 'Carlos Mendoza Rivas',
      role: 'Broker Titular & Consultor RWA',
      agency: 'Pacific Luxury Advisors',
      city: 'Nuevo Vallarta, Nayarit',
      cohort: 'Cohorte Génesis · Cupo #03',
      certId: 'cert_genesis_003_carlos',
      status: 'CERTIFIED',
      projectsAuthorized: ['Pie de Playa (Nuevo Vallarta)', 'S\'Narai Residences (Bucerías)'],
      phone: '+52 322 345 6789',
      email: 'carlos@pacificluxury.com',
      specialty: 'Activos Terminados con Flujo Inmediato'
    },
    // Cupos 4 al 10 en proceso de admisión abierta
    ...Array.from({ length: 7 }, (_, i) => ({
      id: `agent_slot_0${i + 4}`,
      name: `Cupo Reservado #${i + 4} (En Proceso de Admisión)`,
      role: 'Postulante Seleccionado — Cohorte Génesis',
      agency: 'Agencia en Proceso de Acreditación',
      city: 'Bahía de Banderas / Puerto Vallarta',
      cohort: `Cohorte Génesis · Cupo #0${i + 4}`,
      certId: `pending_admission_0${i + 4}`,
      status: 'ADMITTED' as const,
      projectsAuthorized: ['S\'Narai (Bucerías)', 'Torre Vista Horizonte', 'Nuevo Vallarta'],
      phone: '+52 322 000 0000',
      email: 'admisiones@pandoras.finance',
      specialty: 'Postulación en Evaluación de Idoneidad'
    }))
  ];

  const filteredAgents = genesisAgents.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 overflow-y-auto bg-black text-white selection:bg-[#D4A853]/30 selection:text-white font-sans antialiased">
      {/* ─── Top Bar ─── */}
      <div className="bg-zinc-950 border-b border-zinc-900 py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href="/academy/master-tokenizacion"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la Landing del Master
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
              <BadgeCheck className="w-3.5 h-3.5" />
              Directorio Público Verificado
            </span>
          </div>
        </div>
      </div>

      {/* ─── Header ─── */}
      <section className="py-16 px-6 border-b border-zinc-900 bg-gradient-to-b from-zinc-950 to-black">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4A853]/10 border border-[#D4A853]/30 text-[#D4A853] text-xs font-mono uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5" />
            Alianza Territorial Bahía de Banderas, Nayarit
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Directorio Oficial de Agentes y Brokers Certificados RWA
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Los 10 profesionales autorizados oficialmente por Pandora's Growth OS para comercializar fracciones inmobiliarias fiduciarias en Bucerías y Nuevo Vallarta.
          </p>

          {/* Search Box */}
          <div className="pt-4 max-w-md mx-auto relative">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por nombre, agencia o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4A853]/50 font-sans"
            />
          </div>
        </div>
      </section>

      {/* ─── Agents Grid ─── */}
      <section className="py-16 px-6 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-zinc-900 pb-3">
          <span>Mostrando <strong>{filteredAgents.length}</strong> especialistas de la Cohorte Génesis</span>
          <span className="text-[#D4A853] font-mono">10 Plazas Totales de la Región</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgents.map((agent) => {
            const isCertified = agent.status === 'CERTIFIED';
            return (
              <div
                key={agent.id}
                className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between space-y-5 ${
                  isCertified
                    ? 'bg-zinc-950 border-[#D4A853]/40 shadow-[0_0_30px_rgba(212,168,83,0.08)] hover:border-[#D4A853]'
                    : 'bg-zinc-950/40 border-zinc-800/80 border-dashed opacity-80'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-[#D4A853] uppercase tracking-wider font-semibold">
                      {agent.cohort}
                    </span>
                    {isCertified ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                        <BadgeCheck className="w-3 h-3" />
                        Certificado Oficial
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                        Postulación Abierta
                      </span>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {agent.name}
                    </h3>
                    <div className="text-xs text-[#D4A853] font-medium mt-0.5">
                      {agent.role}
                    </div>
                    <div className="text-xs text-zinc-400 flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{agent.agency}</span>
                      <span>•</span>
                      <span>{agent.city}</span>
                    </div>
                  </div>

                  {/* Specialty */}
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-300">
                    <span className="text-[10px] text-zinc-500 block uppercase font-mono mb-0.5">Especialidad Fiduciaria:</span>
                    {agent.specialty}
                  </div>

                  {/* Projects Authorized */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-zinc-500 uppercase font-mono block">Proyectos Autorizados:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.projectsAuthorized.map((proj, pIdx) => (
                        <span
                          key={pIdx}
                          className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 font-mono"
                        >
                          {proj}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between gap-2">
                  {isCertified ? (
                    <>
                      <a
                        href={`https://wa.me/${agent.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-[#D4A853] text-black font-bold text-xs hover:brightness-110 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Contactar Asesor</span>
                      </a>
                      <Link
                        href={`/academy/verify/${agent.certId}`}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
                        title="Ver Credencial Soulbound en IPFS"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/academy/master-tokenizacion"
                      className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[#D4A853] font-semibold text-xs transition-all text-center"
                    >
                      Postular para Ocupar este Cupo →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
