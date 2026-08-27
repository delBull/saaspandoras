"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, FileSignature, Users, Layers, Search, 
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Clock, 
  AlertCircle, ExternalLink, RefreshCw, Filter, Sparkles, 
  FileText, Database, ShieldAlert, KeyRound
} from 'lucide-react';

interface Metrics {
  totalEnvelopes: number;
  completedCount: number;
  pendingCount: number;
  draftCount: number;
  anchoredCount: number;
  anchorRatePercent: number;
  uniqueSignersCount: number;
  uniqueOrgsCount: number;
}

interface EnvelopeItem {
  id: string;
  title: string;
  organizationId: string;
  signingPolicy: string;
  status: string;
  documentHash: string;
  evidencePackageCid: string | null;
  blockchainEvidence: any;
  signers: any[];
  createdAt: string;
  completedAt: string | null;
}

interface UserItem {
  email: string;
  name: string;
  totalEnvelopes: number;
  signedCount: number;
  pendingCount: number;
  walletAddresses: string[];
  lastActive: string;
  envelopes: { id: string; title: string; status: string }[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function SovereignSignAdminClient() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ENVELOPES' | 'USERS'>('ENVELOPES');

  // Metrics
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  // Envelopes Tab State
  const [envelopes, setEnvelopes] = useState<EnvelopeItem[]>([]);
  const [envPage, setEnvPage] = useState(1);
  const [envLimit, setEnvLimit] = useState(10);
  const [envStatus, setEnvStatus] = useState<string>('ALL');
  const [envSearch, setEnvSearch] = useState('');
  const [envPagination, setEnvPagination] = useState<PaginationMeta | null>(null);
  const [loadingEnvelopes, setLoadingEnvelopes] = useState(false);

  // Users Tab State
  const [users, setUsers] = useState<UserItem[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [userLimit, setUserLimit] = useState(10);
  const [userSearch, setUserSearch] = useState('');
  const [userPagination, setUserPagination] = useState<PaginationMeta | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Check auth session
  useEffect(() => {
    fetch('/api/v1/deal-signing/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.session?.isAdmin) {
          setIsAdmin(true);
          setAdminEmail(data.session.email);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, []);

  const fetchMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch('/api/v1/deal-signing/admin/metrics');
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  const fetchEnvelopes = useCallback(async () => {
    setLoadingEnvelopes(true);
    try {
      const params = new URLSearchParams({
        page: envPage.toString(),
        limit: envLimit.toString(),
        ...(envStatus !== 'ALL' ? { status: envStatus } : {}),
        ...(envSearch.trim() ? { q: envSearch.trim() } : {}),
      });
      const res = await fetch(`/api/v1/deal-signing/admin/envelopes?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEnvelopes(data.envelopes || []);
        setEnvPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching envelopes:', err);
    } finally {
      setLoadingEnvelopes(false);
    }
  }, [envPage, envLimit, envStatus, envSearch]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: userLimit.toString(),
        ...(userSearch.trim() ? { q: userSearch.trim() } : {}),
      });
      const res = await fetch(`/api/v1/deal-signing/admin/users?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setUserPagination(data.pagination);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  }, [userPage, userLimit, userSearch]);

  useEffect(() => {
    if (isAdmin) {
      fetchMetrics();
    }
  }, [isAdmin, fetchMetrics]);

  useEffect(() => {
    if (isAdmin && activeTab === 'ENVELOPES') {
      fetchEnvelopes();
    }
  }, [isAdmin, activeTab, fetchEnvelopes]);

  useEffect(() => {
    if (isAdmin && activeTab === 'USERS') {
      fetchUsers();
    }
  }, [isAdmin, activeTab, fetchUsers]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#07070B] flex items-center justify-center text-zinc-400 font-mono text-xs">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-400 mr-2" />
        Verificando privilegios de administrador...
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#07070B] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4 shadow-xl shadow-red-500/10">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Acceso No Autorizado</h2>
        <p className="text-xs text-zinc-400 max-w-md mt-2">
          Esta consola está restringida exclusivamente a la administración de Pandora's Sovereign Sign.
        </p>
        <Link
          href="/deal/sign"
          className="mt-6 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-mono font-bold text-xs hover:brightness-110 transition-all flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Portal de Firmas
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070B] text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Admin Navbar */}
      <header className="h-16 shrink-0 bg-[#0C0C12] border-b border-white/[0.08] px-4 md:px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            href="/deal/sign"
            className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            title="Regresar al Portal"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              <span>SOVEREIGN SIGN · MINI ADMIN</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                SUPER ADMIN
              </span>
            </h1>
            <p className="text-[11px] font-mono text-zinc-500 truncate max-w-xs md:max-w-md">
              {adminEmail} &bull; MÉTRICAS, AUDITORÍA Y USUARIOS
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchMetrics();
            if (activeTab === 'ENVELOPES') fetchEnvelopes();
            else fetchUsers();
          }}
          className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-mono"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics || loadingEnvelopes || loadingUsers ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl w-full mx-auto">
        
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Envelopes */}
          <div className="p-5 rounded-2xl bg-[#0D0D14] border border-white/[0.08] relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest">ENVELOPES TOTALES</span>
              <FileSignature className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {metrics?.totalEnvelopes ?? '...'}
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 mt-3 pt-2 border-t border-white/[0.04]">
              <span className="text-emerald-400">{metrics?.completedCount ?? 0} Completados</span>
              <span>&bull;</span>
              <span className="text-amber-400">{metrics?.pendingCount ?? 0} Pendientes</span>
              <span>&bull;</span>
              <span className="text-zinc-400">{metrics?.draftCount ?? 0} Borradores</span>
            </div>
          </div>

          {/* Card 2: On-Chain Anchors */}
          <div className="p-5 rounded-2xl bg-[#0D0D14] border border-white/[0.08] relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest">ANCLAJES ON-CHAIN</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {metrics?.anchoredCount ?? '...'}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-300 mt-3 pt-2 border-t border-white/[0.04]">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" />
              <span>{metrics?.anchorRatePercent ?? 0}% de tasa de anclaje Base L2</span>
            </div>
          </div>

          {/* Card 3: Unique Signers */}
          <div className="p-5 rounded-2xl bg-[#0D0D14] border border-white/[0.08] relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest">FIRMANTES ÚNICOS</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {metrics?.uniqueSignersCount ?? '...'}
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-3 pt-2 border-t border-white/[0.04]">
              Identidades de firmantes registradas
            </div>
          </div>

          {/* Card 4: Unique Tenants / Orgs */}
          <div className="p-5 rounded-2xl bg-[#0D0D14] border border-white/[0.08] relative overflow-hidden shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest">ORGANIZACIONES</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {metrics?.uniqueOrgsCount ?? '...'}
            </div>
            <div className="text-[10px] font-mono text-purple-300 mt-3 pt-2 border-t border-white/[0.04]">
              Tenants emitiendo contratos
            </div>
          </div>

        </div>

        {/* Tab Controls */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs font-mono">
            <button
              onClick={() => { setActiveTab('ENVELOPES'); setEnvPage(1); }}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'ENVELOPES'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>ENVELOPES & CONTRATOS ({metrics?.totalEnvelopes ?? 0})</span>
            </button>

            <button
              onClick={() => { setActiveTab('USERS'); setUserPage(1); }}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                activeTab === 'USERS'
                  ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>USUARIOS & FIRMANTES ({metrics?.uniqueSignersCount ?? 0})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ENVELOPES TABLE */}
        {activeTab === 'ENVELOPES' && (
          <div className="bg-[#0D0D14] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
            
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por título, ID o tenant..."
                  value={envSearch}
                  onChange={(e) => { setEnvSearch(e.target.value); setEnvPage(1); }}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={envStatus}
                  onChange={(e) => { setEnvStatus(e.target.value); setEnvPage(1); }}
                  className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:border-amber-400 focus:outline-none"
                >
                  <option value="ALL">Todos los Estados</option>
                  <option value="PENDING_SIGNATURES">PENDIENTE DE FIRMAS</option>
                  <option value="COMPLETED">COMPLETADO</option>
                  <option value="DRAFT">BORRADOR</option>
                </select>

                <select
                  value={envLimit}
                  onChange={(e) => { setEnvLimit(parseInt(e.target.value, 10)); setEnvPage(1); }}
                  className="px-2.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:border-amber-400 focus:outline-none"
                >
                  <option value={10}>10 / pág</option>
                  <option value={20}>20 / pág</option>
                  <option value={50}>50 / pág</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                    <th className="py-3 px-3">DOCUMENTO / ID</th>
                    <th className="py-3 px-3">TENANT</th>
                    <th className="py-3 px-3">POLÍTICA</th>
                    <th className="py-3 px-3">FIRMANTES</th>
                    <th className="py-3 px-3">ESTADO</th>
                    <th className="py-3 px-3">ANCLAJE ON-CHAIN</th>
                    <th className="py-3 px-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loadingEnvelopes ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                        Cargando envelopes...
                      </td>
                    </tr>
                  ) : envelopes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500">
                        No se encontraron envelopes que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    envelopes.map((env) => {
                      const signers = env.signers || [];
                      const signedCount = signers.filter(s => s.status === 'SIGNED').length;
                      const hasOnChain = env.blockchainEvidence && Object.keys(env.blockchainEvidence).length > 0;

                      return (
                        <tr key={env.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-white truncate max-w-xs">{env.title}</div>
                            <div className="text-[10px] text-zinc-500 truncate max-w-xs mt-0.5">
                              ID: {env.id}
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                              {env.organizationId}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-zinc-400">
                            {env.signingPolicy}
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 rounded-full" 
                                  style={{ width: `${signers.length > 0 ? (signedCount / signers.length) * 100 : 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-400">{signedCount}/{signers.length}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              env.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            }`}>
                              {env.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            {hasOnChain ? (
                              <span className="text-emerald-400 flex items-center gap-1 text-[11px]" title={env.blockchainEvidence.transactionHash}>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Base L2</span>
                              </span>
                            ) : (
                              <span className="text-zinc-600 text-[10px]">Pendiente</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/deal/envelopes/${env.id}`}
                                target="_blank"
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
                                title="Abrir Studio de Firma"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {envPagination && envPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs font-mono text-zinc-400">
                <div>
                  Mostrando página {envPagination.page} de {envPagination.totalPages} ({envPagination.totalItems} envelopes)
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEnvPage(p => Math.max(1, p - 1))}
                    disabled={!envPagination.hasPrevPage}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold text-white">
                    {envPagination.page}
                  </span>
                  <button
                    onClick={() => setEnvPage(p => p + 1)}
                    disabled={!envPagination.hasNextPage}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: USERS & SIGNERS TABLE */}
        {activeTab === 'USERS' && (
          <div className="bg-[#0D0D14] border border-white/[0.08] rounded-2xl p-6 shadow-2xl space-y-5">
            
            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por email, nombre o wallet..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>

              <select
                value={userLimit}
                onChange={(e) => { setUserLimit(parseInt(e.target.value, 10)); setUserPage(1); }}
                className="px-2.5 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:border-amber-400 focus:outline-none"
              >
                <option value={10}>10 / pág</option>
                <option value={20}>20 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-500 uppercase text-[10px]">
                    <th className="py-3 px-3">FIRMATE / EMAIL</th>
                    <th className="py-3 px-3">CONTRATOS TOTALES</th>
                    <th className="py-3 px-3">FIRMADOS</th>
                    <th className="py-3 px-3">PENDIENTES</th>
                    <th className="py-3 px-3">WALLETS ASOCIADAS</th>
                    <th className="py-3 px-3 text-right">ÚLTIMA ACTIVIDAD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500">
                        No se encontraron usuarios que coincidan con la búsqueda.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.email} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-[10px] text-zinc-500">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-3 text-zinc-300 font-bold">
                          {u.totalEnvelopes}
                        </td>
                        <td className="py-3.5 px-3 text-emerald-400">
                          {u.signedCount}
                        </td>
                        <td className="py-3.5 px-3 text-amber-400">
                          {u.pendingCount}
                        </td>
                        <td className="py-3.5 px-3">
                          {u.walletAddresses.length > 0 && u.walletAddresses[0] ? (
                            <span className="text-[10px] text-zinc-400 font-mono" title={u.walletAddresses.join(', ')}>
                              {u.walletAddresses[0].slice(0, 6)}...{u.walletAddresses[0].slice(-4)}
                              {u.walletAddresses.length > 1 && ` (+${u.walletAddresses.length - 1})`}
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">Sin wallet registrada</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right text-zinc-500 text-[10px]">
                          {new Date(u.lastActive).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {userPagination && userPagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] text-xs font-mono text-zinc-400">
                <div>
                  Mostrando página {userPagination.page} de {userPagination.totalPages} ({userPagination.totalItems} usuarios)
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setUserPage(p => Math.max(1, p - 1))}
                    disabled={!userPagination.hasPrevPage}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold text-white">
                    {userPagination.page}
                  </span>
                  <button
                    onClick={() => setUserPage(p => p + 1)}
                    disabled={!userPagination.hasNextPage}
                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}

export default SovereignSignAdminClient;
