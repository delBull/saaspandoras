'use client';

import { useEffect } from 'react';
import { X, ShieldCheck, ShieldAlert } from 'lucide-react';

interface LegalDocModalProps {
  type: 'agreement' | 'risk-disclosure' | 'phase-dynamics';
  projectName: string;
  onClose: () => void;
}

export function LegalDocModal({ type, projectName, onClose }: LegalDocModalProps) {
  const displayName = projectName.toUpperCase().replace('SNARAI', "S'NARAI");
  const effectiveDate = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isAgreement = type === 'agreement';

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-950/80 shrink-0">
        <div className="flex items-center gap-3">
          {isAgreement
            ? <ShieldCheck className="text-emerald-400" size={18} />
            : type === 'phase-dynamics' ? <ShieldCheck className="text-narai-gold" size={18} /> : <ShieldAlert className="text-red-400" size={18} />
          }
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
            {isAgreement ? 'Acuerdo Marco de Participación Digital' : type === 'phase-dynamics' ? 'Anexo Comercial y Operativo' : 'Aviso Integral de Riesgos'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-10 text-white/70 text-sm font-light leading-relaxed">

          {/* Title */}
          <div className="text-center space-y-4 border-b border-white/10 pb-10">
            <h2 className="text-2xl lg:text-4xl font-black italic tracking-tighter leading-tight text-white">
              {isAgreement
                ? `Acuerdo Marco de Participación Digital y Uso del Ecosistema ${displayName}`
                : type === 'phase-dynamics' ? `Anexo Operativo y Comercial: Dinámicas de Fases y Cláusulas de Salida` : 'Aviso Integral de Riesgos y Declaraciones del Participante'
              }
            </h2>
            <div className="flex justify-center gap-8 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {!isAgreement && <span>Ecosistema: {displayName}</span>}
              <span>Versión: 1.0</span>
              <span>Fecha Efectiva: {effectiveDate}</span>
            </div>
          </div>

          {/* ── AGREEMENT CONTENT ── */}
          {isAgreement && (
            <>
              <p>Entre:</p>
              <p className="font-bold text-white">
                AZTECAZ HUB S.A.P.I. DE C.V., sociedad mercantil debidamente constituida conforme a las leyes de los Estados Unidos Mexicanos, así como sus vehículos, fideicomisos, contratos auxiliares y estructuras operativas relacionadas operando bajo la marca registrada S&apos;Narai (en conjunto, &quot;Narai&quot;, la &quot;Estructura&quot; o el &quot;Protocolo&quot;),
              </p>
              <p>y</p>
              <p className="font-bold text-white">el usuario adquirente de Certificados de Participación Digital (el &quot;Participante&quot;).</p>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">1. OBJETO DEL ACUERDO</h3>
                <p>El presente Acuerdo regula los términos, condiciones, derechos, limitaciones y obligaciones aplicables a la adquisición, tenencia, transferencia y uso de Certificados de Participación Digital emitidos dentro del ecosistema {displayName}.</p>
                <p>Los Certificados constituyen instrumentos digitales contractuales vinculados al ecosistema y a determinados beneficios de utilidad, gobernanza y participación económica condicionada conforme a las reglas aquí establecidas.</p>
                <p>La adquisición de Certificados implica aceptación total e irrevocable del presente Acuerdo.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">2. NATURALEZA JURÍDICA</h3>
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
                <h3 className="text-lg font-bold text-emerald-400">3. DERECHOS DEL PARTICIPANTE</h3>
                <p>Sujeto al cumplimiento del presente Acuerdo, el Participante podrá acceder a:</p>
                <p><strong className="text-white">Derechos de utilidad:</strong> Acceso al ecosistema, beneficios exclusivos, noches de estancia o experiencias, según su nivel (Tier) y disponibilidad.</p>
                <p><strong className="text-white">Derechos de gobernanza:</strong> Participación en votaciones operativas permitidas mediante el mecanismo DAO.</p>
                <p><strong className="text-white">Participación económica condicionada:</strong> Derecho a participar proporcionalmente en Distribuciones Operativas eventuales, sujetas al desempeño real, disponibilidad de excedentes y políticas internas.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">4. LIMITACIONES</h3>
                <p>El Participante reconoce que NO adquiere posesión física individual, uso irrestricto, facultad de administración unilateral, control sobre la construcción, ni garantía de liquidez inmediata.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">5. ACEPTACIÓN DIGITAL</h3>
                <p>La adquisición, pago, firma electrónica, aprobación digital, wallet signature, interacción blockchain o minteo correspondiente constituye manifestación expresa, inequívoca e irrevocable de consentimiento y aceptación del presente Acuerdo.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">6. MERCADO SECUNDARIO Y CESIONES</h3>
                <p>Los Certificados podrán ser transferidos únicamente conforme a las reglas autorizadas por la Estructura. Toda cesión podrá estar sujeta a validación técnica, compliance y tarifas. No se garantiza liquidez, comprador ni precio de salida.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-emerald-400">7. LEY APLICABLE Y JURISDICCIÓN</h3>
                <p>El presente Acuerdo se rige por las leyes de los Estados Unidos Mexicanos. Para la interpretación y cumplimiento, las partes se someten a la jurisdicción de los tribunales competentes en México, renunciando a cualquier otra jurisdicción.</p>
              </div>
            </>
          )}

          {/* ── RISK DISCLOSURE CONTENT ── */}
          {!isAgreement && (
            <>
              <p className="font-bold text-red-400">LEA ESTE DOCUMENTO DETENIDAMENTE ANTES DE PARTICIPAR.</p>
              <p>Al adquirir Certificados de Participación Digital en el ecosistema {displayName} operado bajo AZTECAZ HUB S.A.P.I. DE C.V., el Participante declara bajo protesta de decir verdad que comprende, evalúa y asume íntegramente los siguientes riesgos:</p>

              {[
                { num: '01', title: 'RIESGO DE MERCADO E INVERSIÓN', text: 'Las proyecciones, rendimientos y plusvalías mencionadas son estimaciones basadas en estudios y expectativas actuales. NO ESTÁN GARANTIZADAS. Factores económicos, ciclos inmobiliarios, oferta/demanda y turismo pueden afectar negativamente los resultados reales. El Participante reconoce que existe riesgo de pérdida de capital.' },
                { num: '02', title: 'RIESGOS DE DESARROLLO Y CONSTRUCCIÓN', text: 'El proyecto subyacente puede enfrentar retrasos, incrementos de costos presupuestales, suspensiones de obra, disputas sindicales, escasez de materiales, eventos climáticos severos o causas de fuerza mayor. Las fechas de entrega son estimadas.' },
                { num: '03', title: 'RIESGO DE LIQUIDEZ Y TRANSFERENCIA', text: 'No existe garantía de que el Participante pueda revender, ceder o liquidar sus Certificados en el corto o mediano plazo. La liquidez depende enteramente del interés de terceros en un mercado secundario privado o de los mecanismos habilitados, los cuales podrían no existir o sufrir interrupciones.' },
                { num: '04', title: 'RIESGO REGULATORIO Y LEGAL', text: 'El marco legal para ecosistemas de participación digital, tokens y criptoactivos en México y el mundo está en evolución. Cambios regulatorios, nuevas leyes o reclamos de autoridades pueden afectar, limitar o impedir el funcionamiento del ecosistema, los Certificados y sus beneficios.' },
                { num: '05', title: 'RIESGO OPERATIVO Y DE GESTIÓN', text: 'Los rendimientos operativos dependen de terceros (operadores hoteleros, administradores, comercializadores). Una mala gestión operativa, vacantes prolongadas o fallas de comercialización impactarán la utilidad disponible para distribución.' },
                { num: '06', title: 'NATURALEZA DE LA ADQUISICIÓN', text: 'El Participante comprende inequívocamente que los Certificados otorgan participación estructurada y digital, NO título de propiedad física individual (escritura).' },
                { num: '07', title: 'ACEPTACIÓN PLENA', text: 'La adquisición de Certificados constituye la aceptación voluntaria, informada y expresa de todos los riesgos aquí descritos y los establecidos en el Acuerdo Marco, sin derecho a reclamaciones por fluctuaciones, pérdidas o falta de liquidez.' },
              ].map(({ num, title, text }) => (
                <div key={num} className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="text-red-400 font-mono">{num}.</span> {title}
                  </h3>
                  <p>{text}</p>
                </div>
              ))}
            </>
          )}

          {/* ── PHASE DYNAMICS CONTENT ── */}
          {type === 'phase-dynamics' && (
            <>
              <p className="font-bold text-white">
                El presente documento es parte integrante de los acuerdos legales de {displayName}. Establece las reglas operativas para la emisión de participaciones, fijación de precios, y lineamientos para la liquidación o transmisión de derechos en el mercado secundario.
              </p>

              {(projectName.toLowerCase() === 'snarai' || projectName.toLowerCase() === "s'narai") ? (
                <>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-narai-gold">1. ESTRUCTURA DE LEVANTAMIENTO DE CAPITAL Y FASES DE EMISIÓN</h3>
                    <p>El proyecto {displayName} ejecuta un modelo de levantamiento escalonado diseñado para ir en paralelo a la vida de la obra civil y construcción. Esto beneficia directamente a los inversionistas tempranos al reducir los costos de entrada y capitalizar la adquisición anticipada de materiales, mitigando así el riesgo conforme avanza el proyecto.</p>
                    
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
                    <h3 className="text-lg font-bold text-narai-gold">2. CLÁUSULA DE SALIDA Y MERCADO SECUNDARIO (ÁGORA MARKET)</h3>
                    <p>Con el fin de asegurar la viabilidad del proyecto, existen restricciones temporales para la liquidación o transmisión anticipada de los títulos:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Periodo de Bloqueo:</strong> Las transferencias, ventas o cesiones a terceros están <strong>estrictamente bloqueadas</strong> durante toda la Fase 1 y el inicio de la Fase 2.</li>
                      <li><strong>Apertura del Mercado:</strong> La ventana de salida anticipada (transferencia) se habilitará exclusivamente a partir de la <strong>mitad de la Fase 2</strong>.</li>
                      <li><strong>Infraestructura Oficial:</strong> Toda transacción, cuando se habilite, deberá ocurrir <strong>exclusivamente</strong> a través del Ágora Market integrado en el Portal de S'Narai. No se reconocerán ventas realizadas fuera de esta infraestructura.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-narai-gold">3. REGLAS DE FIJACIÓN DE PRECIO Y PROTECCIÓN (OTC)</h3>
                    <p>Para proteger al ecosistema, la comunidad de inversionistas y evitar manipulaciones de mercado (dumping), rigen las siguientes condiciones durante las operaciones en Ágora Market:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li><strong>Límite Superior (Cap):</strong> El Participante no podrá listar sus títulos para venta a un precio que exceda el límite máximo estipulado dinámicamente por la Estructura en ese momento.</li>
                      <li><strong>Límite Inferior y Derecho del Tanto (OTC a Pandoras):</strong> El Participante tiene derecho a ofertar sus títulos a un precio menor al valor de mercado actual. Sin embargo, en cualquier oferta con descuento (menor al precio vigente de la fase actual), el protocolo <strong>Pandoras Growth OS</strong> y/o sus entidades fiduciarias tendrán <strong>Prioridad y Derecho del Tanto</strong> para adquirir dichos títulos a través de una transacción OTC (Over The Counter) automática, antes de que lleguen al mercado público.</li>
                      <li><strong>Penalizaciones de Salida Anticipada:</strong> Salir de forma prematura durante las fases de construcción podría implicar tarifas de re-estructuración o <em>fees</em> operacionales del sistema.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-narai-gold">4. TRANSMISIÓN DE DERECHOS</h3>
                    <p>Al concretarse exitosamente la venta o transmisión de un título en el mercado secundario autorizado (Ágora Market u OTC de Pandoras), el Participante enajenante cede de forma <strong>absoluta, automática e irrevocable</strong> la totalidad de los derechos vinculados a dichos títulos. Esto incluye:</p>
                    <ul className="list-disc pl-6 space-y-2">
                      <li>Derechos de Gobernanza (votos en DAO).</li>
                      <li>Rendimientos pasados no reclamados o acumulados.</li>
                      <li>Utilidades, proyecciones y beneficios de liquidez futuros originados por el activo subyacente.</li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 space-y-6">
                  <h3 className="text-xl font-bold text-white">Dinámicas por Definirse</h3>
                  <p className="text-zinc-500 max-w-md mx-auto">El desarrollador u operador responsable de <strong>{displayName}</strong> aún no ha publicado el anexo de comercialización, fases y mercado secundario para este protocolo.</p>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="border-t border-white/10 pt-8 flex items-center gap-4">
            {isAgreement
              ? <ShieldCheck className="text-emerald-400 shrink-0" size={20} />
              : type === 'phase-dynamics' ? <ShieldCheck className="text-narai-gold shrink-0" size={20} /> : <ShieldAlert className="text-red-400 shrink-0" size={20} />
            }
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Verificable Digitalmente</p>
              <p className="text-[9px] font-mono text-white/20">
                {isAgreement ? 'PANDORAS_LEGAL_INFRASTRUCTURE' : type === 'phase-dynamics' ? 'PANDORAS_COMMERCIAL_DYNAMICS' : 'PANDORAS_RISK_DISCLOSURE'} — AZTECAZ HUB S.A.P.I. DE C.V.
              </p>
            </div>
          </div>

          {/* Bottom close button */}
          <div className="flex justify-center pb-6">
            <button
              onClick={onClose}
              className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest text-white transition-colors flex items-center gap-2"
            >
              <X size={12} /> Cerrar Documento
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
