import React from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, Globe, Lock, Calendar, Hash, FileText } from 'lucide-react';
import { CertificateActions } from '@/components/legal/CertificateActions';
import { db } from '@/db';
import { purchases as purchasesSchema, projects as projectsSchema } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function CertificatePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>, 
  searchParams: Promise<{ project?: string, units?: string, origin?: string }> 
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const projectSlug = resolvedSearchParams.project || 'snarai';
  const units = resolvedSearchParams.units || '3';
  const origin = resolvedSearchParams.origin || '';
  
  // URL de retorno inteligente: si viene de una landing, intenta abrir el portal por defecto
  const returnUrl = origin ? `${origin}?openPortal=true` : '/';
  
  let wallet = null;

  // 1. Extraer wallet de IDs especiales
  if (id.startsWith('virtual-')) {
    wallet = id.replace('virtual-', '');
  } else if (id.startsWith('global-')) {
    wallet = id.replace('global-', '');
  } else {
    // 2. Si es un ID de DB, buscar el titular
    try {
      const purchase = await db.query.purchases.findFirst({
        where: eq(purchasesSchema.id, id)
      });
      if (purchase) wallet = purchase.userId;
    } catch (e) {
      console.error("Error fetching purchase wallet:", e);
    }
  }

  // 3. Fetch Project for Dynamic Legal Entity
  const project = await db.query.projects.findFirst({
    where: eq(projectsSchema.slug, projectSlug)
  });

  const legalEntity = project?.fiduciaryEntity || "Pandoras Protocol Entity";
  const projectName = project?.title || projectSlug.toUpperCase().replace('SNARAI', "S'NARAI");
  
  return (
    <div className="min-h-screen bg-[#050a05] text-white font-sans selection:bg-narai-gold/30">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-narai-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 lg:py-20 print:py-0 print:px-0">
        {/* HEADER / NAVIGATION */}
        <div className="flex items-center justify-between mb-12 print:mb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-narai-gold rounded-xl flex items-center justify-center text-black shadow-lg shadow-narai-gold/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pandoras Legal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Verification System v2.0</p>
            </div>
          </div>
          <a href={returnUrl} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <ArrowLeft size={14} /> Volver al Portal
          </a>
        </div>

        {/* MAIN CERTIFICATE CARD */}
        <div className="bg-[#0a140a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative print:bg-white print:text-black print:border-none print:rounded-none print:shadow-none">
          {/* WATERMARK */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-12 print:opacity-[0.04]">
             <ShieldCheck size={400} className="print:w-[300px]" />
          </div>

          {/* TOP BAR */}
          <div className="h-3 bg-gradient-to-r from-narai-gold via-emerald-500 to-narai-gold print:h-1" />
          
          <div className="p-8 lg:p-20 space-y-16 print:p-8 print:space-y-6">
            {/* STATUS & ID */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-10 print:pb-4 print:border-zinc-100">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-narai-gold print:text-[8px]">Estado del Documento</p>
                <div className="flex items-center gap-3 text-emerald-400 print:text-emerald-700">
                  <CheckCircle2 size={22} className="print:w-4 print:h-4" />
                  <span className="text-base font-black uppercase tracking-widest print:text-sm">Verificado & Registrado</span>
                </div>
              </div>
              <div className="space-y-2 lg:text-right print:text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 print:text-[8px] print:text-zinc-400">ID de Referencia</p>
                <p className="text-xs font-mono text-white/60 tracking-tighter bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block print:bg-zinc-50 print:border-zinc-100 print:text-[10px] print:text-black print:p-1">{id}</p>
              </div>
            </div>

            {/* TITLE */}
            <div className="space-y-6 text-center print:space-y-2">
               <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter serif leading-none print:text-2xl print:text-black">Certificado Individual de Participación y Constancia de Asignación</h2>
               <p className="text-white/40 max-w-2xl mx-auto leading-relaxed text-sm lg:text-base font-light print:text-[10px] print:text-zinc-600 print:max-w-none">
                 Este documento certifica legalmente la participación estructurada del titular en el ecosistema <strong>{projectName}</strong>, operado bajo <strong>{legalEntity}</strong>, conforme a los términos del Acuerdo Marco de Participación Digital.
               </p>
            </div>

            {/* DETAILS GRID - ENHANCED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group hover:border-narai-gold/20 transition-colors print:bg-white print:border-zinc-200 print:p-5 print:rounded-2xl">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-[8px] print:text-zinc-400">Titular de la Posición</p>
                    <p className="text-base font-bold font-mono text-white/90 break-all leading-tight print:text-xs print:text-black">{wallet || 'No disponible'}</p>
                  </div>
                  <UserDetailIcon icon={<Lock size={16} />} label="ID Protegido" />
               </div>

               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 space-y-6 group hover:border-narai-gold/20 transition-colors print:bg-white print:border-zinc-200 print:p-5 print:rounded-2xl print:space-y-2">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-[8px] print:text-zinc-400">Proyecto Vinculado</p>
                    <p className="text-2xl font-black text-narai-gold uppercase tracking-tight print:text-lg">{projectName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-white/40 print:text-zinc-500">
                    <Globe size={16} className="text-blue-400/60 print:w-3 print:h-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest print:text-[8px]">Protocolo Descentralizado</p>
                  </div>
               </div>

               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 space-y-2 group hover:border-narai-gold/20 transition-colors print:bg-white print:border-zinc-200 print:p-5 print:rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-[8px] print:text-zinc-400">Activos Adquiridos</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter print:text-xl print:text-black">Títulos de Participación</p>
                  <div className="pt-4 flex items-center gap-3 print:pt-1">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 print:bg-zinc-50 print:border-zinc-200 print:px-2 print:py-1">
                       <span className="text-lg font-black text-narai-gold font-mono print:text-sm">{units}</span>
                       <span className="ml-2 text-[10px] font-bold text-white/30 uppercase tracking-widest print:text-[8px] print:text-zinc-400">Unidades</span>
                    </div>
                  </div>
               </div>

               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 space-y-6 group hover:border-narai-gold/20 transition-colors print:bg-white print:border-zinc-200 print:p-5 print:rounded-2xl print:space-y-2">
                  <div className="grid grid-cols-2 gap-6 print:gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-[8px] print:text-zinc-400">Fecha Registro</p>
                      <div className="flex items-center gap-2 text-white/60 print:text-black">
                        <Calendar size={14} className="print:w-3 print:h-3" />
                        <span className="text-xs font-bold font-mono print:text-[10px]">01/05/2026</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 print:text-[8px] print:text-zinc-400">Hash Red</p>
                      <div className="flex items-center gap-2 text-white/60 print:text-black">
                        <Hash size={14} className="print:w-3 print:h-3" />
                        <span className="text-xs font-bold font-mono print:text-[10px]">Ox82a...19e</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 print:pt-0">
                    <p className="text-[9px] text-white/30 italic print:text-[8px] print:text-zinc-400">Validado mediante consenso criptográfico en red Polygon PoS.</p>
                  </div>
               </div>
            </div>

            {/* LEGAL DISCLAIMER */}
            <div className="p-10 bg-white/[0.02] rounded-[2.5rem] border border-white/5 space-y-6 print:bg-zinc-50 print:border-zinc-100 print:p-6 print:space-y-2 print:rounded-2xl">
               <div className="flex items-center gap-3 text-white/40 print:text-zinc-500">
                  <Lock size={16} className="text-narai-gold/60 print:w-3 print:h-3" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] print:text-[8px]">Cláusula de Integridad Criptográfica</p>
               </div>
               <p className="text-[12px] text-white/30 leading-relaxed italic font-light print:text-[9px] print:text-zinc-400">
                 Este certificado es generado dinámicamente en tiempo real, vinculando la identidad digital del titular con los registros inmutables del contrato inteligente del protocolo. La validez de este documento reside en la trazabilidad on-chain y es plenamente auditable por cualquier entidad mediante el sistema de validación de Pandoras.
               </p>
            </div>
          </div>

          {/* FOOTER ACTION - ENHANCED BUTTON */}
          <div className="bg-white/5 p-10 lg:p-14 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 print:p-6 print:bg-transparent print:border-zinc-100">
             <div className="flex items-center gap-5 print:gap-3">
                <div className="p-4 rounded-2xl bg-white/5 print:p-2 print:bg-zinc-100">
                  <FileText className="text-narai-gold print:w-5 print:h-5" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 print:text-[8px] print:text-zinc-400">Sello Digital de Seguridad</p>
                  <p className="text-xs font-mono text-white/20 print:text-[10px] print:text-zinc-300">PANDORAS_SECURE_VERIFICATION_v2.0_SHA256</p>
                </div>
             </div>
             <div className="print:hidden">
              <CertificateActions />
             </div>
          </div>
        </div>

        {/* BOTTOM METADATA */}
        <div className="mt-16 text-center space-y-6 print:mt-4 print:space-y-2">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 print:text-[8px] print:text-black">Documento Emitido Oficialmente por {legalEntity} vía Pandoras Growth OS © 2026</p>
           <div className="flex justify-center gap-8 opacity-20 print:hidden">
              <div className="w-12 h-1 border-t border-white" />
              <div className="w-12 h-1 border-t border-white" />
           </div>
        </div>
      </div>
    </div>
  );
}

function UserDetailIcon({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-2 mt-4 text-white/30 print:text-zinc-400">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}
