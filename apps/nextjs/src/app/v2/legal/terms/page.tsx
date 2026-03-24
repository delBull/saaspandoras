import Link from 'next/link';

export const metadata = {
  title: "Términos y Condiciones — Pandora's Protocol",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/v2" className="text-[8px] tracking-[0.5em] text-zinc-700 hover:text-zinc-400 uppercase transition-colors">
          ← Volver
        </Link>

        <div className="mt-12 mb-16">
          <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-4">Legal</p>
          <h1 className="text-4xl font-thin tracking-wide">Términos y Condiciones</h1>
          <p className="text-zinc-700 text-xs mt-3 tracking-wider">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-12 text-zinc-400 text-sm leading-loose font-light">
          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">1. Aceptación de los Términos</h2>
            <p>Al acceder a este sitio web y sus servicios asociados, usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no deberá usar nuestros servicios.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">2. Descripción del Servicio</h2>
            <p>Pandora&apos;s Protocol proporciona una plataforma de acceso restringido que permite a los usuarios participar en protocolos financieros experimentales. El sistema opera mediante criterios de selección internos que no son públicamente divulgados.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">3. Riesgos Financieros</h2>
            <p>La participación en cualquier protocolo, pool de capital, o mecanismo de rendimiento conlleva riesgos significativos, incluyendo la pérdida parcial o total del capital invertido. Pandora&apos;s Finance no garantiza rendimientos, retornos ni resultados específicos. Las rentabilidades pasadas no garantizan resultados futuros.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">4. No Asesoramiento Financiero</h2>
            <p>Ningún contenido de este sitio constituye asesoramiento financiero, legal, fiscal o de inversión. Usted declara que consulta a sus propios asesores antes de tomar decisiones de inversión. El acceso a la plataforma es únicamente con fines informativos y de participación voluntaria.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">5. Elegibilidad y Jurisdicción</h2>
            <p>Usted declara ser mayor de 18 años y tener capacidad legal plena para contratar en su jurisdicción. El acceso puede estar restringido o prohibido en determinados países. Es responsabilidad del usuario verificar la legalidad de su participación en su jurisdicción local.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">6. Propiedad Intelectual</h2>
            <p>Todo el contenido, diseño, código y arquitectura del sistema son propiedad exclusiva de Pandora&apos;s Finance. Queda prohibida su reproducción, distribución o uso comercial sin autorización expresa por escrito.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">7. Limitación de Responsabilidad</h2>
            <p>En la máxima medida permitida por la ley aplicable, Pandora&apos;s Finance no será responsable por daños directos, indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de los servicios, incluyendo pérdidas económicas o de datos.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">8. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos Términos en cualquier momento. Los cambios serán efectivos desde su publicación en este sitio. El uso continuado del servicio implica la aceptación de los nuevos términos.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">9. Contacto</h2>
            <p>Para consultas legales: <a href="mailto:legal@pandoras.finance" className="text-zinc-300 hover:text-white transition-colors underline">legal@pandoras.finance</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-900">
          <Link href="/v2/legal/privacy" className="text-[8px] tracking-[0.4em] text-zinc-600 hover:text-zinc-400 uppercase transition-colors">
            Política de Privacidad →
          </Link>
        </div>
      </div>
    </main>
  );
}
