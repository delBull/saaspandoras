'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileText,
  Building,
  Users,
  DollarSign,
  Calendar,
  Globe,
  Eye,
  Crown,
  AlertTriangle,
  TrendingUp,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Project } from '@/types/admin';
import Image from 'next/image';

// Función utilitaria para formato de moneda (ajustar según tu contexto)
const formatCurrency = (value: string | number | null | undefined) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || num === null || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function ProjectReportPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // The route is now [slug], so we get 'slug' from params.
  // The API endpoint might expect ID or Slug.
  // We'll pass the slug.
  const projectSlug = params.slug as string;

  useEffect(() => {
    const fetchProject = async () => {
      try {
        // Get wallet address for authentication
        let walletAddress = null;
        if (typeof window !== 'undefined') {
          if (window.localStorage) {
            try {
              const sessionData = localStorage.getItem('wallet-session');
              if (sessionData) {
                const parsedSession = JSON.parse(sessionData) as { address?: string };
                walletAddress = parsedSession.address?.toLowerCase();
              }
            } catch (e) {
              console.warn('Error getting wallet for project fetch:', e);
            }
          }
        }

        const response = await fetch(`/api/admin/projects/${projectSlug}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(walletAddress && {
              'x-thirdweb-address': walletAddress,
              'x-wallet-address': walletAddress,
              'x-user-address': walletAddress
            }),
          }
        });

        if (response.ok) {
          const projectData = await response.json() as Project;
          setProject(projectData);
        } else {
          console.error('Failed to fetch project:', response.status);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkAdminStatus = async () => {
      try {
        let walletAddress = null;
        if (typeof window !== 'undefined') {
          if (window.localStorage) {
            try {
              const sessionData = localStorage.getItem('wallet-session');
              if (sessionData) {
                const parsedSession = JSON.parse(sessionData) as { address?: string };
                walletAddress = parsedSession.address?.toLowerCase();
              }
            } catch (e) {
              console.warn('Error getting wallet for admin check:', e);
            }
          }
        }

        if (walletAddress) {
          const response = await fetch('/api/admin/verify', {
            headers: {
              'Content-Type': 'application/json',
              'x-thirdweb-address': walletAddress,
              'x-wallet-address': walletAddress,
              'x-user-address': walletAddress,
            }
          });

          if (response.ok) {
            const data = await response.json() as { isAdmin?: boolean; isSuperAdmin?: boolean };
            setIsAdmin((data.isAdmin ?? false) || (data.isSuperAdmin ?? false));
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };

    void fetchProject();
    void checkAdminStatus();
  }, [projectSlug]);

  // Función para detectar campos faltantes (simplificada)
  const getMissingFields = (project: Project) => {
    const missingFields = [];

    // Campos críticos (los he simplificado)
    if (!project.description || project.description.trim().length < 10) missingFields.push('Descripción del proyecto');
    if (!project.businessCategory) missingFields.push('Categoría de negocio');
    if (!project.applicantName) missingFields.push('Nombre del representante');
    if (!project.whitepaperUrl) missingFields.push('White Paper');
    if (!project.targetAmount || Number(project.targetAmount) === 0) missingFields.push('Monto objetivo');

    // Campos de Tokenomics (comentados ya que no existen en el tipo actual)
    // if (!project.tokenType) missingFields.push('Tipo de Token');
    // if (!project.expectedYield) missingFields.push('Rendimiento Esperado');

    return missingFields;
  };

  const handleExportPDF = () => {
    try {
      // For now, we'll use a simple approach - open print dialog
      // In a production app, you'd want to use a proper PDF generation library
      window.print();
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error al exportar PDF. Inténtalo de nuevo.');
    }
  };

  if (loading || !isAdmin || !project) {
    // Se mantiene la lógica de loading y error
    return (
      <div className="min-h-screen text-white p-6">
        <div className="max-w-4xl mx-auto text-center py-20">
          <h1 className="text-2xl font-bold mb-4">{loading ? 'Cargando Proyecto...' : !project ? 'Proyecto no encontrado' : 'Acceso no autorizado'}</h1>
          <Link href="/admin/dashboard">
            <Button className="bg-purple-700 hover:bg-purple-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const missingFields = getMissingFields(project);

  return (
    <>
      {/* ======================================================= */}
      {/* 🎯 ESTILOS DE IMPRESIÓN (AISLADO Y PROFESIONAL) */}
      {/* ======================================================= */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: letter;
              margin: 0.2in 0.3in;
            }
            body {
              background: white !important;
              color: black !important;
              font-family: Arial, sans-serif !important;
              font-size: 8px !important;
              line-height: 1.2 !important;
              -webkit-print-color-adjust: exact !important;
            }

            /* AISLAMIENTO DE CONTENIDO: Oculta todo excepto el div de reporte */
            body * {
                visibility: hidden;
            }
            #one-pager-content, #one-pager-content * {
                visibility: visible;
            }
            #one-pager-content {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                /* Restablece el padding de los márgenes @page */
                padding: 0.2in 0.3in;
            }

            /* CLASES DE DISEÑO COMPACTO Y PROFESIONAL */
            .print\\\\:hidden { display: none !important; }
            .print-header { border-bottom: 3px solid #7c3aed; padding-bottom: 5px; } /* COLOR PRINCIPAL: PURPLE */
            .print-title { font-size: 16px !important; font-weight: bold; color: #7c3aed; } /* COLOR PRINCIPAL: PURPLE */
            .print-subtitle {
              font-size: 10px !important;
              font-weight: bold;
              color: #333;
              border-bottom: 1px solid #eee;
              padding-bottom: 2px;
              margin-bottom: 4px;
            }
            .print-metric-value { font-size: 18px !important; font-weight: bold; color: #6d28d9; } /* Color de Métrica: Darker Purple */
          }
        `
      }} />

      <div className="absolute inset-x-0 min-h-screen pb-20 md:pb-6 bg-[#030303] text-white print:bg-white print:text-black font-sans selection:bg-purple-500 selection:text-white">
        {/* Background Gradients (Dynamic) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30 print:hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-600/10 rounded-full blur-[150px]"></div>
        </div>

        {/* Header - Hidden in print */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-950/50 backdrop-blur-xl border-b border-zinc-800/50 sticky top-0 z-[100] print:hidden"
        >
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all shadow-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter text-white">
                  Executive <span className="text-purple-400">One Pager</span>
                </h1>
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-500">Protocol Analysis v3.0</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleExportPDF}
                className="bg-white text-black hover:bg-zinc-200 font-black uppercase italic tracking-tighter px-6 h-11 rounded-xl transition-all shadow-lg shadow-white/5"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Reporte
              </Button>
            </div>
          </div>
        </motion.div>

        <div id="one-pager-content" className="max-w-5xl mx-auto px-6 py-10 print:p-0 relative z-10">
          
          {/* HERO SECTION: IDENTITY & GROWTH STATUS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  Live Protocol
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h1 className="text-6xl md:text-7xl font-black tracking-tighter uppercase italic text-white leading-[0.9]">
                  {project.title}
                </h1>
                <p className="text-2xl text-zinc-400 font-medium tracking-tight max-w-2xl">
                  {project.tagline || project.description?.substring(0, 100) + '...'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Building className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Categoría</p>
                    <p className="text-xs font-bold text-white uppercase">{project.businessCategory || 'General'}</p>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Status</p>
                    <p className="text-xs font-bold text-white uppercase">{project.status}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="aspect-square rounded-[2rem] bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl relative group">
                {project.logoUrl ? (
                  <img src={project.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                    <FileText className="w-16 h-16 text-zinc-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* LEFT COLUMN: MECHANICS & ROI */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Executive Summary */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-900/30 border border-zinc-800 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl rounded-full" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-3">
                  <div className="w-12 h-[1px] bg-zinc-800" /> Tesis de Valor
                </h3>
                <p className="text-xl text-zinc-300 font-medium leading-relaxed italic">
                  "{project.description}"
                </p>
              </div>

              {/* Protocol Mechanics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-4">Mecánica del Protocolo</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {project.protoclMecanism || 'Configuración pendiente de validación técnica.'}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-4">Utilidad del Artefacto</h4>
                  <p className="text-sm text-zinc-400 leading-relaxed font-medium">
                    {project.artefactUtility || 'Los beneficios de holding se activan tras el Deployment.'}
                  </p>
                </div>
                <div className="p-6 rounded-[2rem] bg-zinc-900/50 border border-zinc-800 md:col-span-2">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Mecanismo Work-to-Earn</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed font-bold">
                    {project.worktoearnMecanism || 'Participación activa recompensada vía Smart Contracts.'}
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: NUMBERS & COMPLIANCE */}
            <div className="space-y-8">
              {/* Economic Block */}
              <div className="p-8 rounded-[2.5rem] bg-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-3xl rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">Economic Snapshot</h3>
                
                <div className="space-y-8">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Target Valuation (TVL)</p>
                    <p className="text-4xl font-black text-white italic tracking-tighter">
                      {formatCurrency(project.targetAmount)}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Token Price</p>
                      <p className="text-xl font-bold text-emerald-400">$ {(project as any).tokenPriceUsd || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Yield (APR)</p>
                      <p className="text-xl font-bold text-purple-400">{project.estimatedApy || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-zinc-800">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
                      <span>Progreso de Fondos</span>
                      <span className="text-white">0%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 w-[5%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance & Links */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-4">Compliance & Links</h3>
                <div className="grid grid-cols-1 gap-2">
                  <a href={project.whitepaperUrl} target="_blank" className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800 hover:bg-zinc-800/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300">Whitepaper</span>
                    </div>
                    <Eye className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                  </a>
                  <div className="p-4 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                        <Users className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300">Representante</span>
                    </div>
                    <p className="text-sm font-black text-white px-1">{project.applicantName || 'Confidencial'}</p>
                    <p className="text-[10px] font-medium text-zinc-600 px-1 mt-1">{project.applicantPosition || 'Founder'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-20 pt-8 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-6 print:mt-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xl">
                 <img src="/images/logo_green.png" alt="Pandora" className="w-7 h-7 object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-white">Pandoras Growth Engine</p>
                <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Institutional Infrastructure</p>
              </div>
            </div>
            <p className="text-[10px] font-medium text-zinc-700 uppercase tracking-widest">
              Generated {new Date().toLocaleDateString('es-ES')} • Private & Confidential
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
