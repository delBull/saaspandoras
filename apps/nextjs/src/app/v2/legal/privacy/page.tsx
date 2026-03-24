import Link from 'next/link';

export const metadata = {
  title: "Política de Privacidad — Pandora's Protocol",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-6 py-24">
      <div className="max-w-3xl mx-auto">
        <Link href="/v2" className="text-[8px] tracking-[0.5em] text-zinc-700 hover:text-zinc-400 uppercase transition-colors">
          ← Volver
        </Link>

        <div className="mt-12 mb-16">
          <p className="text-[9px] tracking-[0.7em] text-zinc-600 uppercase mb-4">Legal</p>
          <h1 className="text-4xl font-thin tracking-wide">Política de Privacidad</h1>
          <p className="text-zinc-700 text-xs mt-3 tracking-wider">Última actualización: marzo 2026</p>
        </div>

        <div className="space-y-12 text-zinc-400 text-sm leading-loose font-light">
          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">1. Datos que Recopilamos</h2>
            <p>Al usar nuestros servicios, podemos recopilar los siguientes datos:&nbsp;
              dirección de correo electrónico, dirección de wallet (opcional), intención declarada de uso, 
              datos técnicos de navegación (IP, dispositivo, referrer), e interacciones con el sistema.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">2. Uso de los Datos</h2>
            <p>Utilizamos sus datos para:</p>
            <ul className="mt-3 space-y-2 list-none pl-4">
              <li>— Evaluar solicitudes de acceso al sistema.</li>
              <li>— Personalizar su experiencia dentro del protocolo.</li>
              <li>— Enviar comunicaciones relacionadas con el servicio.</li>
              <li>— Mejorar la seguridad y el funcionamiento del sistema.</li>
              <li>— Cumplir con obligaciones legales aplicables.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">3. Base Legal del Tratamiento</h2>
            <p>El tratamiento de sus datos se basa en su consentimiento expreso al enviar una solicitud de acceso, así como en el interés legítimo de operar el sistema de forma segura y conforme a la ley.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">4. Compartir Datos con Terceros</h2>
            <p>No vendemos ni cedemos sus datos personales a terceros con fines comerciales. Podemos compartir datos con proveedores de infraestructura (hosting, análisis) bajo acuerdos de confidencialidad, y con autoridades competentes cuando lo exija la ley.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">5. Datos On-Chain</h2>
            <p>Ciertas interacciones pueden registrarse en una blockchain pública. Dichos datos son inherentemente públicos e inmutables por naturaleza del protocolo. Al proporcionar una dirección de wallet, acepta este comportamiento.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">6. Retención de Datos</h2>
            <p>Conservamos sus datos durante el tiempo necesario para cumplir con los fines descritos y las obligaciones legales. Puede solicitar la eliminación de sus datos en cualquier momento, salvo que existan obligaciones legales que impidan dicha eliminación.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">7. Sus Derechos</h2>
            <p>Usted tiene derecho a:&nbsp;
              acceder a sus datos personales, rectificarlos, solicitar su eliminación, oponerse al tratamiento, 
              y portabilidad de datos. Para ejercer estos derechos, contáctenos en: 
              <a href="mailto:privacy@pandoras.finance" className="text-zinc-300 hover:text-white transition-colors underline ml-1">privacy@pandoras.finance</a>
            </p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">8. Cookies y Rastreo</h2>
            <p>Utilizamos cookies técnicas necesarias para el funcionamiento del sistema. Podemos utilizar herramientas analíticas de rendimiento. No utilizamos cookies de publicidad comportamental de terceros.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">9. Seguridad</h2>
            <p>Implementamos medidas técnicas y organizativas para proteger sus datos contra acceso no autorizado, pérdida o divulgación. Sin embargo, ningún sistema es completamente seguro y no podemos garantizar la seguridad absoluta.</p>
          </section>

          <section>
            <h2 className="text-white text-base font-light tracking-[0.2em] uppercase mb-4">10. Contacto</h2>
            <p>Para consultas sobre privacidad: <a href="mailto:privacy@pandoras.finance" className="text-zinc-300 hover:text-white transition-colors underline">privacy@pandoras.finance</a></p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-zinc-900">
          <Link href="/v2/legal/terms" className="text-[8px] tracking-[0.4em] text-zinc-600 hover:text-zinc-400 uppercase transition-colors">
            ← Términos y Condiciones
          </Link>
        </div>
      </div>
    </main>
  );
}
