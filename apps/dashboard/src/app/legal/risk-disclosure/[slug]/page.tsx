import React from 'react';
import { ShieldAlert, FileWarning, Globe, CheckCircle2, Building, Scale, ArrowLeft } from 'lucide-react';
import { PrintButton } from '@/components/legal/PrintButton';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function RiskDisclosurePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ slug: string }>, 
  searchParams: Promise<{ origin?: string }> 
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const origin = resolvedSearchParams.origin || '';
  const returnUrl = origin ? `${origin}?openPortal=true` : '/';
  
  // 1. Fetch Project for Dynamic Legal Entity
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug)
  });

  const legalEntity = project?.fiduciaryEntity || "Pandoras Protocol Entity";
  const projectName = project?.title || slug.toUpperCase().replace('SNARAI', "S'NARAI");
  const effectiveDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-[#050a05] text-white font-sans selection:bg-red-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 lg:py-20 print:py-0 print:px-0">
        <div className="flex items-center justify-between mb-12 print:mb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pandoras Legal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Documento Oficial</p>
            </div>
          </div>
          <div className="flex gap-4">
            <PrintButton variant="warning" />
            <a href={returnUrl} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <ArrowLeft size={14} /> Volver
            </a>
          </div>
        </div>

        <div className="bg-[#0a140a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative print:bg-white print:text-black print:border-none print:rounded-none print:shadow-none">
          <div className="h-3 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 print:h-1" />
          
          <div className="p-8 lg:p-20 space-y-12 print:p-8 print:space-y-6">
            <div className="text-center space-y-6 print:space-y-2 border-b border-white/10 pb-12 print:border-zinc-200">
               <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter serif leading-none print:text-2xl print:text-black">
                 Aviso Integral de Riesgos y Declaraciones del Participante
               </h2>
               <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40 print:text-zinc-500">
                 <span>Ecosistema: {projectName}</span>
                 <span>Fecha Efectiva: {effectiveDate}</span>
               </div>
            </div>

            <div className="space-y-8 text-sm lg:text-base text-white/70 font-light leading-relaxed print:text-xs print:text-zinc-700">
              <p className="font-bold text-red-400 print:text-red-700">LEA ESTE DOCUMENTO DETENIDAMENTE ANTES DE PARTICIPAR.</p>
              
              <p>Al adquirir Certificados de Participación Digital en el ecosistema {projectName} operado bajo {legalEntity}, el Participante declara bajo protesta de decir verdad que comprende, evalúa y asume íntegramente los siguientes riesgos:</p>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">01.</span> RIESGO DE MERCADO E INVERSIÓN
                </h3>
                <p>Las proyecciones, rendimientos y plusvalías mencionadas son estimaciones basadas en estudios y expectativas actuales. <strong>NO ESTÁN GARANTIZADAS.</strong> Factores económicos, ciclos inmobiliarios, oferta/demanda y turismo pueden afectar negativamente los resultados reales. El Participante reconoce que existe riesgo de pérdida de capital.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">02.</span> RIESGOS DE DESARROLLO Y CONSTRUCCIÓN
                </h3>
                <p>El proyecto subyacente puede enfrentar retrasos, incrementos de costos presupuestales, suspensiones de obra, disputas sindicales, escasez de materiales, eventos climáticos severos o causas de fuerza mayor. Las fechas de entrega son estimadas.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">03.</span> RIESGO DE LIQUIDEZ Y TRANSFERENCIA
                </h3>
                <p>No existe garantía de que el Participante pueda revender, ceder o liquidar sus Certificados en el corto o mediano plazo. La liquidez depende enteramente del interés de terceros en un mercado secundario privado o de los mecanismos habilitados, los cuales podrían no existir o sufrir interrupciones.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">04.</span> RIESGO REGULATORIO Y LEGAL
                </h3>
                <p>El marco legal para ecosistemas de participación digital, tokens y criptoactivos en México y el mundo está en evolución. Cambios regulatorios, nuevas leyes o reclamos de autoridades pueden afectar, limitar o impedir el funcionamiento del ecosistema, los Certificados y sus beneficios.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">05.</span> RIESGO OPERATIVO Y DE GESTIÓN
                </h3>
                <p>Los rendimientos operativos dependen de terceros (operadores hoteleros, administradores, comercializadores). Una mala gestión operativa, vacantes prolongadas o fallas de comercialización impactarán la utilidad disponible para distribución.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">06.</span> NATURALEZA DE LA ADQUISICIÓN
                </h3>
                <p>El Participante comprende inequívocamente que los Certificados otorgan participación estructurada y digital, <strong>NO título de propiedad física individual (escritura).</strong></p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white print:text-black flex items-center gap-2">
                  <span className="text-red-500 print:text-red-700 font-mono">07.</span> ACEPTACIÓN PLENA
                </h3>
                <p>La adquisición de Certificados constituye la aceptación voluntaria, informada y expresa de todos los riesgos aquí descritos y los establecidos en el Acuerdo Marco, sin derecho a reclamaciones por fluctuaciones, pérdidas o falta de liquidez.</p>
              </div>

            </div>
          </div>
          
          <div className="bg-white/5 p-10 border-t border-white/5 flex items-center justify-between print:p-6 print:bg-transparent print:border-zinc-100">
             <div className="flex items-center gap-5 print:gap-3">
                <div className="p-4 rounded-2xl bg-white/5 print:p-2 print:bg-zinc-100">
                  <ShieldAlert className="text-red-500 print:w-5 print:h-5" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 print:text-[8px] print:text-zinc-400">Declaración Obligatoria</p>
                  <p className="text-xs font-mono text-white/20 print:text-[10px] print:text-zinc-300">PANDORAS_RISK_DISCLOSURE</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
