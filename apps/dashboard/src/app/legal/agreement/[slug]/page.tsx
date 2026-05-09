import React from 'react';
import { ShieldCheck, FileText, Globe, CheckCircle2, Building, Scale, ArrowLeft } from 'lucide-react';

export default function AgreementPage({ 
  params, 
  searchParams 
}: { 
  params: { slug: string }, 
  searchParams: { origin?: string } 
}) {
  const { slug } = params;
  const origin = searchParams.origin || '';
  const returnUrl = origin ? `${origin}?openPortal=true` : '/';
  
  const projectName = slug.toUpperCase().replace('SNARAI', "S'NARAI");
  const effectiveDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

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
              <Scale size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Pandoras Legal</h1>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Documento Oficial</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2">
              <FileText size={14} /> Imprimir / PDF
            </button>
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
                 Acuerdo Marco de Participación Digital y Uso del Ecosistema {projectName}
               </h2>
               <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40 print:text-zinc-500">
                 <span>Versión: 1.0</span>
                 <span>Fecha Efectiva: {effectiveDate}</span>
               </div>
            </div>

            <div className="space-y-8 text-sm lg:text-base text-white/70 font-light leading-relaxed print:text-xs print:text-zinc-700">
              <p>Entre:</p>
              <p className="font-bold text-white print:text-black">
                AZTECAZ HUB S.A.P.I. DE C.V., sociedad mercantil debidamente constituida conforme a las leyes de los Estados Unidos Mexicanos, así como sus vehículos, fideicomisos, contratos auxiliares y estructuras operativas relacionadas operando bajo la marca registrada S'Narai (en conjunto, “Narai”, la “Estructura” o el “Protocolo”),
              </p>
              <p>y</p>
              <p className="font-bold text-white print:text-black">el usuario adquirente de Certificados de Participación Digital (el “Participante”).</p>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">1. OBJETO DEL ACUERDO</h3>
                <p>El presente Acuerdo regula los términos, condiciones, derechos, limitaciones y obligaciones aplicables a la adquisición, tenencia, transferencia y uso de Certificados de Participación Digital emitidos dentro del ecosistema {projectName}.</p>
                <p>Los Certificados constituyen instrumentos digitales contractuales vinculados al ecosistema y a determinados beneficios de utilidad, gobernanza y participación económica condicionada conforme a las reglas aquí establecidas.</p>
                <p>La adquisición de Certificados implica aceptación total e irrevocable del presente Acuerdo.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">2. NATURALEZA JURÍDICA</h3>
                <p>Los Certificados:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>NO constituyen escritura pública.</li>
                  <li>NO representan copropiedad inmobiliaria directa.</li>
                  <li>NO constituyen acciones societarias de AZTECAZ HUB S.A.P.I DE C.V.</li>
                  <li>NO constituyen títulos de crédito ni valores mobiliarios listados.</li>
                  <li>NO implican garantía de rendimiento fijo o devolución de capital.</li>
                </ul>
                <p>Los Certificados representan exclusivamente derechos contractuales digitales limitados conforme al presente Acuerdo. La adquisición no transmite dominio directo sobre bienes inmuebles.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">3. DERECHOS DEL PARTICIPANTE</h3>
                <p>Sujeto al cumplimiento del presente Acuerdo, el Participante podrá acceder a:</p>
                <p><strong>Derechos de utilidad:</strong> Acceso al ecosistema, beneficios exclusivos, noches de estancia o experiencias, según su nivel (Tier) y disponibilidad.</p>
                <p><strong>Derechos de gobernanza:</strong> Participación en votaciones operativas permitidas mediante el mecanismo DAO.</p>
                <p><strong>Participación económica condicionada:</strong> Derecho a participar proporcionalmente en Distribuciones Operativas eventuales, sujetas al desempeño real, disponibilidad de excedentes y políticas internas.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">4. LIMITACIONES</h3>
                <p>El Participante reconoce que NO adquiere posesión física individual, uso irrestricto, facultad de administración unilateral, control sobre la construcción, ni garantía de liquidez inmediata.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">5. ACEPTACIÓN DIGITAL</h3>
                <p>La adquisición, pago, firma electrónica, aprobación digital, wallet signature, interacción blockchain o minteo correspondiente constituye manifestación expresa, inequívoca e irrevocable de consentimiento y aceptación del presente Acuerdo. El Participante acepta que dichos mecanismos sustituyen la firma autógrafa y producen efectos jurídicos vinculantes.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">6. MERCADO SECUNDARIO Y CESIONES</h3>
                <p>Los Certificados podrán ser transferidos únicamente conforme a las reglas autorizadas por la Estructura. Toda cesión podrá estar sujeta a validación técnica, compliance y tarifas. No se garantiza liquidez, comprador ni precio de salida.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold text-narai-gold print:text-black">7. LEY APLICABLE Y JURISDICCIÓN</h3>
                <p>El presente Acuerdo se rige por las leyes de los Estados Unidos Mexicanos. Para la interpretación y cumplimiento, las partes se someten a la jurisdicción de los tribunales competentes en México, renunciando a cualquier otra jurisdicción.</p>
              </div>

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
