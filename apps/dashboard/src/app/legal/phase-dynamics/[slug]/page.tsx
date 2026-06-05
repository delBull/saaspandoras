import React from 'react';
import { ShieldCheck, ArrowLeft, Activity } from 'lucide-react';
import { PrintButton } from '@/components/legal/PrintButton';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function PhaseDynamicsPage({ 
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
  
  const project = await db.query.projects.findFirst({
    where: eq(projects.slug, slug)
  });

  const legalEntity = project?.fiduciaryEntity || "Pandoras Protocol Entity";
  const projectName = project?.title || slug.toUpperCase();
  const effectiveDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  const isSnarai = slug.toLowerCase() === 'snarai' || slug.toLowerCase() === "s'narai";

  return (
    <div className="min-h-screen bg-[#050a05] text-white font-sans selection:bg-narai-gold/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none print:hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-narai-gold/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12 lg:py-20 print:py-0 print:px-0">
        <div className="flex items-center justify-between mb-12 print:mb-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-narai-gold rounded-xl flex items-center justify-center text-black shadow-lg shadow-narai-gold/20">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pandoras Legal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Documento Oficial</p>
            </div>
          </div>
          <div className="flex gap-4">
            <PrintButton variant="default" />
            <a href={returnUrl} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <ArrowLeft size={14} /> Volver
            </a>
          </div>
        </div>

        <div className="bg-[#0a140a] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl relative print:bg-white print:text-black print:border-none print:rounded-none print:shadow-none">
          <div className="h-3 bg-gradient-to-r from-narai-gold via-emerald-500 to-narai-gold print:h-1" />
          
          <div className="p-8 lg:p-20 space-y-12 print:p-8 print:space-y-6">
            <div className="text-center space-y-6 print:space-y-2 border-b border-white/10 pb-12 print:border-zinc-200">
               <h2 className="text-3xl lg:text-5xl font-black italic tracking-tighter serif leading-none print:text-2xl print:text-black">
                 Anexo Operativo y Comercial: Dinámicas de Fases y Cláusulas de Salida
               </h2>
               <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40 print:text-zinc-500">
                 <span>Proyecto: {projectName}</span>
                 <span>Fecha Efectiva: {effectiveDate}</span>
               </div>
            </div>

            <div className="space-y-8 text-sm lg:text-base text-white/70 font-light leading-relaxed print:text-xs print:text-zinc-700">
              
              <p className="font-bold text-white print:text-black">
                El presente documento es parte integrante de los acuerdos legales de {projectName} gestionado por {legalEntity}. Establece las reglas operativas para la emisión de participaciones, fijación de precios, y lineamientos para la liquidación o transmisión de derechos en el mercado secundario.
              </p>

              {isSnarai ? (
                <>
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-narai-gold print:text-black">1. ESTRUCTURA DE LEVANTAMIENTO DE CAPITAL Y FASES DE EMISIÓN</h3>
                    <p>El proyecto {projectName} ejecuta un modelo de levantamiento escalonado diseñado para ir en paralelo a la vida de la obra civil y construcción. Esto beneficia directamente a los inversionistas tempranos al reducir los costos de entrada y capitalizar la adquisición anticipada de materiales, mitigando así el riesgo conforme avanza el proyecto.</p>
                    
                    <ul className="list-disc pl-6 space-y-4 mt-4">
                      <li>
                        <strong className="text-white">Fase 1 (Seed / Terreno y Permisos):</strong><br/>
                        Precio por Título: $50 USD. Meta de recaudación: $0 a $10,000,000 MXN.<br/>
                        <em>Propósito:</em> Asegurar estratégicamente el terreno, licencias, permisos y capital inicial para el arranque de la obra. Es la fase de mayor apreciación latente.
                      </li>
                      <li>
                        <strong className="text-white">Fase 2 (Obra Negra y Materiales):</strong><br/>
                        Precio por Título: $75 USD. Meta de recaudación: $30,000,000 a $50,000,000 MXN.<br/>
                        <em>Propósito:</em> Aprovechar la liquidez temprana inyectada para congelar y pre-comprar materiales clave de construcción (ej. acero y cemento) hasta un 30% más baratos, asegurando así los márgenes del proyecto en etapas formativas.
                      </li>
                      <li>
                        <strong className="text-white">Fase 3 (Acabados y Preventa Comercial):</strong><br/>
                        Precio por Título: $100 USD. Meta de recaudación: $50,000,000 a $100,000,000 MXN.<br/>
                        <em>Propósito:</em> La obra ya presenta avances tangibles y el riesgo operativo se ha reducido en un 50% o más. Se habilita el inicio de la preventa comercial paralela al mercado minorista (clientes finales).
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-narai-gold print:text-black">2. CLÁUSULA DE SALIDA Y MERCADO SECUNDARIO (ÁGORA MARKET)</h3>
                    <p>Con el fin de asegurar la viabilidad del proyecto, existen restricciones temporales para la liquidación o transmisión anticipada de los títulos:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Periodo de Bloqueo:</strong> Las transferencias, ventas o cesiones a terceros están <strong>estrictamente bloqueadas</strong> durante toda la Fase 1 y el inicio de la Fase 2.</li>
                      <li><strong>Apertura del Mercado:</strong> La ventana de salida anticipada (transferencia) se habilitará exclusivamente a partir de la <strong>mitad de la Fase 2</strong>.</li>
                      <li><strong>Infraestructura Oficial:</strong> Toda transacción, cuando se habilite, deberá ocurrir <strong>exclusivamente</strong> a través del Ágora Market integrado en el Portal de S'Narai. No se reconocerán ventas realizadas fuera de esta infraestructura.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-narai-gold print:text-black">3. REGLAS DE FIJACIÓN DE PRECIO Y PROTECCIÓN (OTC)</h3>
                    <p>Para proteger al ecosistema, la comunidad de inversionistas y evitar manipulaciones de mercado (dumping), rigen las siguientes condiciones durante las operaciones en Ágora Market:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Límite Superior (Cap):</strong> El Participante no podrá listar sus títulos para venta a un precio que exceda el límite máximo estipulado dinámicamente por la Estructura en ese momento.</li>
                      <li><strong>Límite Inferior y Derecho del Tanto (OTC a Pandoras):</strong> El Participante tiene derecho a ofertar sus títulos a un precio menor al valor de mercado actual. Sin embargo, en cualquier oferta con descuento (menor al precio vigente de la fase actual), el protocolo <strong>Pandoras Growth OS</strong> y/o sus entidades fiduciarias tendrán **Prioridad y Derecho del Tanto** para adquirir dichos títulos a través de una transacción OTC (Over The Counter) automática, antes de que lleguen al mercado público.</li>
                      <li><strong>Penalizaciones de Salida Anticipada:</strong> Salir de forma prematura durante las fases de construcción podría implicar tarifas de re-estructuración o *fees* operacionales del sistema.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-narai-gold print:text-black">4. TRANSMISIÓN DE DERECHOS</h3>
                    <p>Al concretarse exitosamente la venta o transmisión de un título en el mercado secundario autorizado (Ágora Market u OTC de Pandoras), el Participante enajenante cede de forma **absoluta, automática e irrevocable** la totalidad de los derechos vinculados a dichos títulos. Esto incluye:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Derechos de Gobernanza (votos en DAO).</li>
                      <li>Rendimientos pasados no reclamados o acumulados.</li>
                      <li>Utilidades, proyecciones y beneficios de liquidez futuros originados por el activo subyacente.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-20 space-y-6">
                  <Activity size={48} className="mx-auto text-zinc-600 opacity-50" />
                  <h3 className="text-2xl font-bold text-white">Dinámicas por Definirse</h3>
                  <p className="text-zinc-500 max-w-md mx-auto">El desarrollador u operador responsable de <strong>{projectName}</strong> aún no ha publicado el anexo de comercialización, fases y mercado secundario para este protocolo.</p>
                </div>
              )}

            </div>
          </div>
          
          <div className="bg-white/5 p-10 border-t border-white/5 flex items-center justify-between print:p-6 print:bg-transparent print:border-zinc-100">
             <div className="flex items-center gap-5 print:gap-3">
                <div className="p-4 rounded-2xl bg-white/5 print:p-2 print:bg-zinc-100">
                  <ShieldCheck className="text-narai-gold print:w-5 print:h-5" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 print:text-[8px] print:text-zinc-400">Verificable Digitalmente</p>
                  <p className="text-xs font-mono text-white/20 print:text-[10px] print:text-zinc-300">PANDORAS_LEGAL_INFRASTRUCTURE</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
