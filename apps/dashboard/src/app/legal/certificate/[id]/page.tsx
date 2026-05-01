import React from 'react';
import { ShieldCheck, Download, ArrowLeft, FileText, CheckCircle2, Globe, Lock } from 'lucide-react';

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const isVirtual = id.startsWith('virtual-');
  const wallet = isVirtual ? id.replace('virtual-', '') : null;

  // En una versión real, aquí haríamos fetch a la DB si no es virtual
  // Por ahora, generamos la vista legal para ambos casos
  
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
            <div className="w-10 h-10 bg-narai-gold rounded-xl flex items-center justify-center text-black">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pandoras Legal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Verification System v2.0</p>
            </div>
          </div>
          <a href="/" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <ArrowLeft size={14} /> Volver
          </a>
        </div>

        {/* MAIN CERTIFICATE CARD */}
        <div className="bg-[#0a140a] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
          {/* WATERMARK */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.02] rotate-12">
             <ShieldCheck size={500} />
          </div>

          {/* TOP BAR */}
          <div className="h-2 bg-gradient-to-r from-narai-gold via-emerald-500 to-narai-gold" />
          
          <div className="p-8 lg:p-16 space-y-12">
            {/* STATUS & ID */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-narai-gold">Estado del Documento</p>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 size={18} />
                  <span className="text-sm font-bold uppercase tracking-widest">Verificado & Registrado</span>
                </div>
              </div>
              <div className="space-y-1 lg:text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">ID de Referencia</p>
                <p className="text-sm font-mono text-white/60 tracking-tighter">{id}</p>
              </div>
            </div>

            {/* TITLE */}
            <div className="space-y-4 text-center">
               <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter serif">Certificado de Adquisición</h2>
               <p className="text-white/40 max-w-xl mx-auto leading-relaxed text-sm">
                 Este documento certifica legalmente la participación del titular en el protocolo de Real Estate fraccionado bajo los términos del Master Services Agreement de Pandoras.
               </p>
            </div>

            {/* DETAILS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
               <div className="bg-[#0c180c] p-8 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Titular de la Posición</p>
                  <p className="text-lg font-bold font-mono text-white/90 break-all">{wallet || 'Consultando...'}</p>
               </div>
               <div className="bg-[#0c180c] p-8 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Proyecto Vinculado</p>
                  <p className="text-lg font-bold text-narai-gold uppercase tracking-widest">S'Narai Riviera Maya</p>
               </div>
               <div className="bg-[#0c180c] p-8 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Activos Adquiridos</p>
                  <p className="text-2xl font-black text-white italic">Títulos de Participación</p>
               </div>
               <div className="bg-[#0c180c] p-8 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Registro de Red</p>
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-400" />
                    <p className="text-sm font-bold text-white/60 uppercase tracking-widest">Blockchain Verified</p>
                  </div>
               </div>
            </div>

            {/* LEGAL DISCLAIMER */}
            <div className="p-8 bg-white/[0.02] rounded-3xl border border-white/5 space-y-4">
               <div className="flex items-center gap-2 text-white/40">
                  <Lock size={14} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Cláusula de Integridad</p>
               </div>
               <p className="text-[11px] text-white/30 leading-relaxed italic">
                 Este certificado es generado dinámicamente basándose en los registros inmutables de la red blockchain vinculada. Cualquier alteración de este documento físico o digital es detectable mediante el sistema de validación criptográfica de Pandoras.
               </p>
            </div>
          </div>

          {/* FOOTER ACTION */}
          <div className="bg-white/5 p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
             <div className="flex items-center gap-4">
                <FileText className="text-narai-gold" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Sello Digital: PANDORAS_SECURE_V2</p>
             </div>
             <button className="px-8 py-4 bg-narai-gold text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 hover:scale-105 transition-all shadow-xl shadow-narai-gold/20">
               Imprimir / Descargar PDF <Download size={18} />
             </button>
          </div>
        </div>

        {/* BOTTOM METADATA */}
        <div className="mt-12 text-center space-y-4">
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Certificado Emitido por Pandoras Growth OS © 2026</p>
        </div>
      </div>
    </div>
  );
}
