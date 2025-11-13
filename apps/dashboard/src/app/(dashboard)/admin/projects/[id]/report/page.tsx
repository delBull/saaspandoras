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

  const projectId = params.id as string;

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

        const response = await fetch(`/api/admin/projects/${projectId}`, {
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
  }, [projectId]);

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
            .print-grid-container {
              /* 3 columnas para mayor densidad, como la imagen de referencia */
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8px;
              margin-top: 10px;
            }
            .print-section {
              padding: 6px;
              border: 1px solid #ddd;
              border-radius: 4px;
              margin-bottom: 5px;
            }
            .print-full-width { grid-column: 1 / -1; }
            .print-half-width { grid-column: span 1 / span 1; }
            /* Secciones de 2/3 para el resumen ejecutivo */
            .print-two-thirds-width { grid-column: span 2 / span 2; }
            .print-one-third-width { grid-column: span 1 / span 1; }

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
            .print-placeholder-chart {
                height: 50px;
                background: #f0f0f0;
                border: 1px solid #ccc;
                border-radius: 4px;
                text-align: center;
                line-height: 50px;
                font-size: 6px;
                color: #888;
                margin-top: 4px;
            }
          }
        `
      }} />

      <div className="absolute inset-x-0 min-h-screen pb-20 md:pb-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white print:bg-white print:text-black">
      {/* Header - Hidden in print */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-zinc-900 backdrop-blur-sm border-b border-zinc-800 print:hidden relative z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="text-gray-400 hover:text-purple-400 transition-colors p-2 rounded-lg hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  One Pager Ejecutivo
                </h1>
                <p className="text-sm text-gray-400">Análisis completo del proyecto</p>
              </div>
            </div>
            <Button
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold mr-40 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/25"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </div>
      </motion.div>

      {/* PDF Header - Only visible in print */}
      <div className="hidden print:block print:text-center print:py-2 print:border-b print:border-gray-300">
        <h1 className="print:text-2xl print:font-bold print:text-black">One Pager Ejecutivo</h1>
        <p className="print:text-sm print:text-gray-600">Análisis completo del proyecto</p>
      </div>

      <div id="one-pager-content" className="max-w-4xl mx-auto px-6 py-6 print:py-1 print:px-2 print:max-w-none">

        {/* SECTION 1: HEADER Y METRICAS CLAVE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-4 print:mb-2 print:p-1 print-header"
        >
          {/* Logo/Cover (Compactado) */}
          {project.coverPhotoUrl && (
             <Image
                src={project.coverPhotoUrl}
                alt={`${project.title} Logo`}
                width={80}
                height={80}
                className="mx-auto rounded-lg mb-2 print:mb-1 print:w-[50px] print:h-[50px] print:rounded"
              />
          )}

          {/* Title & Tagline */}
          <h1 className="text-4xl font-extrabold tracking-tight mb-1 print:text-2xl print:text-black print-title">
            {project.title}
          </h1>
          {project.tagline && (
            <p className="text-xl text-lime-600 font-semibold mb-2 italic print:text-base print:text-gray-600">
              \"{project.tagline}\"
            </p>
          )}

          {/* Status & Category */}
          <div className="flex flex-wrap justify-center gap-4 text-sm print:gap-2 print:text-xs print:mt-1">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800/50 border border-zinc-700 rounded-full print:bg-gray-100 print:border-gray-300 print:text-gray-700">
              <Calendar className="w-3 h-3 text-lime-400 print:text-gray-500" />
              <span>Creado: {new Date(project.createdAt).toLocaleDateString('es-ES')}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              project.status === 'approved' ? 'bg-green-500/20 text-green-400' :
              project.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            } print:bg-gray-100 print:border-gray-300 print:text-gray-700 print:border`}>
              {project.status?.toUpperCase()}
            </div>
          </div>
        </motion.div>

        {/* Missing Fields Alert (Ancho completo) */}
        {missingFields.length > 0 && (
            <div className="print-section print-full-width bg-amber-500/10 border-amber-500/20 print:bg-yellow-50 print:border-yellow-300">
              <h3 className="print-subtitle text-amber-500 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Validación: {missingFields.length} Campos Faltantes
              </h3>
              <p className="text-xs text-zinc-300 print:text-xs print:text-gray-600">
                **REQUIERE ATENCIÓN:** {missingFields.join('; ')}.
              </p>
            </div>
        )}

        {/* Grilla de Contenido Principal (3 Columnas en Desktop, 3 en Print) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 print-grid-container">

          {/* COLUMNA 1 - RESUMEN Y TOKENOMICS (Full Width en Mobile/Desktop, Half en Print) */}

          {/* Visión General (2/3 de Ancho en Desktop, Full Width en Print) */}
          <div className="md:col-span-2 print-section print-two-thirds-width bg-zinc-900/50 border-zinc-700 shadow-lg rounded-lg print:bg-gray-50 print:border-gray-200 print:shadow-none">
            <h2 className="print-subtitle text-purple-400 flex items-center gap-2">
              <Eye className="w-3 h-3" />
              Resumen Ejecutivo
            </h2>
            <p className="text-sm text-zinc-300 leading-snug print:text-sm print:text-gray-700 line-clamp-4">
              {project.description}
            </p>
          </div>

          {/* Información Corporativa (1/3 de Ancho en Desktop, Half Width en Print) */}
          <div className="md:col-span-1 print-section print-one-third-width bg-zinc-900/50 border-zinc-700 shadow-lg rounded-lg print:bg-gray-50 print:border-gray-200 print:shadow-none">
            <h2 className="print-subtitle text-indigo-400 flex items-center gap-2">
              <Building className="w-3 h-3" />
              Detalles Corporativos
            </h2>
            <div className="space-y-1.5 print:space-y-1">
              <p className="text-sm print:text-xs">
                <span className="text-zinc-400 print:text-gray-600 font-semibold">Categoría:</span>
                <span className="text-white font-medium ml-1 print:text-gray-800">{project.businessCategory ?? 'N/A'}</span>
              </p>
              <p className="text-sm print:text-xs">
                <span className="text-zinc-400 print:text-gray-600 font-semibold">Estatus Legal:</span>
                <span className="text-white font-medium ml-1 print:text-gray-800">{project.legalStatus ?? 'N/A'}</span>
              </p>
              <p className="text-sm print:text-xs">
                <span className="text-zinc-400 print:text-gray-600 font-semibold">Fiduciaria:</span>
                <span className="text-white font-medium ml-1 print:text-gray-800">{project.fiduciaryEntity ?? 'N/A'}</span>
              </p>
              {/* Espacio para la imagen / logo */}
               {project.coverPhotoUrl && (
                    <Image
                        src={project.coverPhotoUrl}
                        alt={`${project.title} Cover`}
                        width={120}
                        height={60}
                        className="mx-auto rounded-md mt-2 print:mt-1 print:w-full print:h-[40px] object-cover"
                    />
                )}
            </div>
          </div>

          {/* 🎯 Métricas Financieras (1/3 de Ancho en Desktop, Half Width en Print) */}
          <div className="print-section print-one-third-width bg-zinc-900/50 border-zinc-700 shadow-lg rounded-lg print:bg-gray-50 print:border-gray-200 print:shadow-none">
            <h2 className="print-subtitle text-fuchsia-400 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Financiamiento
            </h2>
            <div className="space-y-2 print:space-y-1">
              <div className="flex justify-between items-center text-sm print:text-xs border-b border-zinc-700/50 print:border-gray-200 pb-1">
                <span className="text-zinc-400 font-medium print:text-gray-600">Capital Objetivo:</span>
                <span className="print-metric-value text-white print:text-purple-700">
                  {formatCurrency(project.targetAmount)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm print:text-xs">
                <div>
                    <span className="text-zinc-400 font-medium print:text-gray-600 block">Tipo de Token:</span>
                    <span className="font-semibold text-white print:text-gray-800">ERC20</span>
                </div>
                <div>
                    <span className="text-zinc-400 font-medium print:text-gray-600 block">Suministro:</span>
                    <span className="font-semibold text-white print:text-gray-800">
                    N/A
                    </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm print:text-xs pt-1 border-t border-zinc-700/50 print:border-gray-200">
                <span className="text-zinc-400 font-medium print:text-gray-600 flex items-center gap-1">
                    <TrendingUp className='w-3 h-3'/> Rendimiento Esperado:
                </span>
                <span className="font-semibold text-purple-400 print:text-purple-700">10-20% Anual</span>
              </div>
            </div>
          </div>

          {/* 📊 Proyecciones (1/3 de Ancho en Desktop, Half Width en Print) */}
          <div className="print-section print-one-third-width bg-zinc-900/50 border-zinc-700 shadow-lg rounded-lg print:bg-gray-50 print:border-gray-200 print:shadow-none">
            <h2 className="print-subtitle text-pink-400 flex items-center gap-2">
              <Target className="w-3 h-3" />
              Proyecciones & Crecimiento
            </h2>
            <div className="space-y-2 print:space-y-1">
                {/* Placeholder para Gráfico 1: Proyección de Rendimiento */}
                <div className='print-placeholder-chart'>
                    [Gráfico: Proyección de Rendimiento - PLACEHOLDER]
                </div>
                {/* Placeholder para Gráfico 2: Distribución de Token */}
                <div className='print-placeholder-chart'>
                    [Gráfico de Tarta: Distribución de Token - PLACEHOLDER]
                </div>
            </div>
          </div>

          {/* Documentación (Full Width en Desktop, pero en la grilla de 3) */}
          <div className="md:col-span-3 print-section print-full-width bg-zinc-900/50 border-zinc-700 shadow-lg rounded-lg print:bg-gray-50 print:border-gray-200 print:shadow-none">
            <h2 className="print-subtitle text-yellow-400 flex items-center gap-2">
              <FileText className="w-3 h-3" />
              Documentación & Compliance
            </h2>
            {/* Se usa grid-cols-5 para añadir Contacto en la grilla. */}
            <div className="grid grid-cols-5 gap-3 print:gap-2 print:grid-cols-5">
              {/* Whitepaper */}
              <a href={project.whitepaperUrl} target="_blank" rel="noopener noreferrer" className={`col-span-1 flex items-center gap-2 p-1 rounded-md transition-colors print:p-0.5 print:border print:border-gray-300 ${project.whitepaperUrl ? 'bg-zinc-800/50 hover:bg-zinc-700/50' : 'bg-zinc-800/20'}`}>
                <FileText className="w-3 h-3 text-green-400" />
                <div>
                  <div className="text-green-400 font-medium text-xs">White Paper</div>
                  <div className="text-zinc-400 text-xs print:text-[6px] truncate">{project.whitepaperUrl ? 'Disponible' : 'Faltante'}</div>
                </div>
              </a>
              {/* Valuación */}
              <a href={project.valuationDocumentUrl} target="_blank" rel="noopener noreferrer" className={`col-span-1 flex items-center gap-2 p-1 rounded-md transition-colors print:p-0.5 print:border print:border-gray-300 ${project.valuationDocumentUrl ? 'bg-zinc-800/50 hover:bg-zinc-700/50' : 'bg-zinc-800/20'}`}>
                <FileText className="w-3 h-3 text-purple-400" />
                <div>
                  <div className="text-purple-400 font-medium text-xs">Valuación</div>
                  <div className="text-zinc-400 text-xs print:text-[6px] truncate">{project.valuationDocumentUrl ? 'Disponible' : 'Faltante'}</div>
                </div>
              </a>
              {/* Due Diligence */}
              <a href={project.dueDiligenceReportUrl} target="_blank" rel="noopener noreferrer" className={`col-span-1 flex items-center gap-2 p-1 rounded-md transition-colors print:p-0.5 print:border print:border-gray-300 ${project.dueDiligenceReportUrl ? 'bg-zinc-800/50 hover:bg-zinc-700/50' : 'bg-zinc-800/20'}`}>
                <FileText className="w-3 h-3 text-cyan-400" />
                <div>
                  <div className="text-cyan-400 font-medium text-xs">Due Diligence</div>
                  <div className="text-zinc-400 text-xs print:text-[6px] truncate">{project.dueDiligenceReportUrl ? 'Disponible' : 'Faltante'}</div>
                </div>
              </a>
              {/* Equipo Principal y Contacto (2/5 del ancho) */}
              <div className="col-span-2 print-section bg-zinc-800/50 border-zinc-700 print:bg-gray-100 print:border-gray-300 print:p-1.5 print:shadow-none">
                <h3 className="print-subtitle text-orange-400 flex items-center gap-2 mb-0">
                    <Users className="w-3 h-3" /> Equipo Principal
                </h3>
                <div className="flex justify-between items-center text-xs print:text-[7px]">
                    <span className="text-white print:text-gray-800 font-medium">{project.applicantName ?? 'N/A'}</span>
                    <a href={project.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                        <Globe className="w-3 h-3" /> LinkedIn
                    </a>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Footer (Ancho completo, compacto) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.4 }}
          className="md:col-span-3 text-center py-4 border-t border-zinc-800 mt-6 print:py-2 print:mt-4 print:border-gray-300 print-full-width"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full print:bg-gray-100 print:border-gray-300 print:text-gray-600 print:px-2 print:py-0.5 print:mb-1">
            <Crown className="w-3 h-3 text-purple-400 print:text-gray-500" />
            <span className="text-xs font-medium print:text-xs">Pandoras Platform</span>
          </div>
          <p className="text-zinc-400 text-xs mt-1 print:text-[6px] print:text-gray-500">
            Reporte generado el {new Date().toLocaleDateString('es-ES')} • ID: {project.id} • Esta información es estrictamente **CONFIDENCIAL**.
          </p>
        </motion.div>
      </div>
    </div>
    </>
  );
}
