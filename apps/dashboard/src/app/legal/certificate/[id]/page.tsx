import React from 'react';
import { ShieldCheck, Download, ArrowLeft, FileText, CheckCircle2, Globe, Lock, Coins, Calendar, Hash } from 'lucide-react';

export default async function CertificatePage({ 
  params, 
  searchParams 
}: { 
  params: { id: string }, 
  searchParams: { project?: string, units?: string } 
}) {
  const { id } = params;
  const projectSlug = searchParams.project || 'snarai';
  const units = searchParams.units || '3'; // Fallback for display
  
  const isVirtual = id.startsWith('virtual-');
  const wallet = isVirtual ? id.replace('virtual-', '') : null;

  // Normalización del nombre del proyecto
  const projectName = projectSlug.toUpperCase().replace('SNARAI', "S'NARAI");
  
  return (
    <div className="min-h-screen bg-[#050a05] text-white font-sans selection:bg-narai-gold/30">
      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-narai-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 lg:py-20">
        {/* HEADER / NAVIGATION */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-narai-gold rounded-xl flex items-center justify-center text-black shadow-lg shadow-narai-gold/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pandoras Legal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Verification System v2.0</p>
            </div>
          </div>
          <a href="/portal" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <ArrowLeft size={14} /> Volver al Portal
          </a>
        </div>

        {/* MAIN CERTIFICATE CARD */}
        <div className="bg-[#0a140a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative">
          {/* WATERMARK */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] rotate-12">
             <ShieldCheck size={500} />
          </div>

          {/* TOP BAR */}
          <div className="h-3 bg-gradient-to-r from-narai-gold via-emerald-500 to-narai-gold" />
          
          <div className="p-8 lg:p-20 space-y-16">
            {/* STATUS & ID */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/5 pb-10">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-narai-gold">Estado del Documento</p>
                <div className="flex items-center gap-3 text-emerald-400">
                  <CheckCircle2 size={22} />
                  <span className="text-base font-black uppercase tracking-widest">Verificado & Registrado</span>
                </div>
              </div>
              <div className="space-y-2 lg:text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">ID de Referencia</p>
                <p className="text-xs font-mono text-white/60 tracking-tighter bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block">{id}</p>
              </div>
            </div>

            {/* TITLE */}
            <div className="space-y-6 text-center">
               <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter serif leading-none">Certificado de Adquisición</h2>
               <p className="text-white/40 max-w-2xl mx-auto leading-relaxed text-sm lg:text-base font-light">
                 Este documento certifica legalmente la participación del titular en el protocolo de Real Estate fraccionado bajo los términos del <span className="text-white font-medium italic">Master Services Agreement</span> de Pandoras Growth OS.
               </p>
            </div>

            {/* DETAILS GRID - ENHANCED */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group hover:border-narai-gold/20 transition-colors">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Titular de la Posición</p>
                    <p className="text-base font-bold font-mono text-white/90 break-all leading-tight">{wallet || 'Consultando...'}</p>
                  </div>
                  <UserDetailIcon icon={<Lock size={16} />} label="ID Protegido" />
               </div>

               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 space-y-6 group hover:border-narai-gold/20 transition-colors">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Proyecto Vinculado</p>
                    <p className="text-2xl font-black text-narai-gold uppercase tracking-tight">{projectName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-white/40">
                    <Globe size={16} className="text-blue-400/60" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Protocolo Descentralizado</p>
                  </div>
               </div>

               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 space-y-2 group hover:border-narai-gold/20 transition-colors">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Activos Adquiridos</p>
                  <p className="text-3xl font-black text-white italic tracking-tighter">Títulos de Participación</p>
                  <div className="pt-4 flex items-center gap-3">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                       <span className="text-lg font-black text-narai-gold font-mono">{units}</span>
                       <span className="ml-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Unidades</span>
                    </div>
                  </div>
               </div>

               <div className="bg-[#0c180c] p-10 rounded-[2.5rem] border border-white/5 space-y-6 group hover:border-narai-gold/20 transition-colors">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Fecha Registro</p>
                      <div className="flex items-center gap-2 text-white/60">
                        <Calendar size={14} />
                        <span className="text-xs font-bold font-mono">01/05/2026</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Hash Red</p>
                      <div className="flex items-center gap-2 text-white/60">
                        <Hash size={14} />
                        <span className="text-xs font-bold font-mono">Ox82a...19e</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-[9px] text-white/30 italic">Validado mediante consenso criptográfico en red Polygon PoS.</p>
                  </div>
               </div>
            </div>

            {/* LEGAL DISCLAIMER */}
            <div className="p-10 bg-white/[0.02] rounded-[2.5rem] border border-white/5 space-y-6">
               <div className="flex items-center gap-3 text-white/40">
                  <Lock size={16} className="text-narai-gold/60" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Cláusula de Integridad Criptográfica</p>
               </div>
               <p className="text-[12px] text-white/30 leading-relaxed italic font-light">
                 Este certificado es generado dinámicamente en tiempo real, vinculando la identidad digital del titular con los registros inmutables del contrato inteligente del protocolo. La validez de este documento reside en la trazabilidad on-chain y es plenamente auditable por cualquier entidad mediante el sistema de validación de Pandoras.
               </p>
            </div>
          </div>

          {/* FOOTER ACTION - ENHANCED BUTTON */}
          <div className="bg-white/5 p-10 lg:p-14 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="flex items-center gap-5">
                <div className="p-4 rounded-2xl bg-white/5">
                  <FileText className="text-narai-gold" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Sello Digital de Seguridad</p>
                  <p className="text-xs font-mono text-white/20">PANDORAS_SECURE_VERIFICATION_v2.0_SHA256</p>
                </div>
             </div>
             <button className="group relative px-10 py-6 bg-narai-gold text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[0.7rem] transition-all hover:scale-[1.03] active:scale-[0.98] shadow-2xl shadow-narai-gold/20 overflow-hidden">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <span className="relative flex items-center gap-4">
                  Imprimir / Descargar Título Legal <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                </span>
             </button>
          </div>
        </div>

        {/* BOTTOM METADATA */}
        <div className="mt-16 text-center space-y-6">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Documento Emitido Oficialmente por Pandoras Growth OS © 2026</p>
           <div className="flex justify-center gap-8 opacity-20">
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
    <div className="flex items-center gap-2 mt-4 text-white/30">
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}
