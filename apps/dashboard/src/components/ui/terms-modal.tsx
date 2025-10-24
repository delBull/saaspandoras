"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border-t border-zinc-700 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-zinc-900/95 to-zinc-800/95 backdrop-blur-sm border-b border-zinc-700 p-6 flex items-center justify-between">
              <h2 className="text-xl ml-10 font-bold bg-gradient-to-r from-lime-400 to-emerald-400 bg-clip-text text-transparent">
                Términos y Condiciones
              </h2>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-black font-semibold rounded-xl hover:from-lime-400 hover:to-emerald-400 transition-all duration-300 shadow-lg shadow-lime-500/25"
              >
                Cerrar
              </button>
            </div>
            <div className="px-10 md:px-32 py-6 text-zinc-300 leading-relaxed whitespace-pre-line text-sm md:text-base">
              {`TÉRMINOS Y CONDICIONES DE LA PLATAFORMA PANDORA'S FINANCE
Última actualización: 23 de octubre de 2025

Resumen Ejecutivo: Pandora’s Finance es una plataforma de software (SaaS) que provee herramientas para crear activos digitales de utilidad (como membresías, sistemas de lealtad o protocolos de trabajo). No ofrecemos servicios financieros, de inversión, fondeo colectivo, custodia o asesoría legal/fiscal. El Creador (usted) es el único y total responsable de la legalidad, el cumplimiento y la operación de las Creaciones que construya y lance usando nuestras herramientas.

1. ACEPTACIÓN Y OBJETO

Bienvenido(a) a Pandora's Finance (en adelante "Pandoras", la "Plataforma" o "Pandoras app"), una plataforma de software como servicio ("SaaS") operada por Pandoras LLC (en adelante "Pandoras").

Nuestra Plataforma proporciona a los usuarios (en adelante, "Creadores" o "Usuarios") las herramientas de software "no-code" (sin código) para diseñar, construir, desplegar y gestionar sus propias "Creaciones" digitales, "Artefactos" y "Protocolos de Utilidad" (tales como sistemas de Lealtad, Accesos NFT, Gobernanza o Work-to-Earn).

Al registrarse y utilizar la Plataforma Pandoras, usted acepta expresamente los siguientes Términos y Condiciones (los "Términos"). Si no está de acuerdo con estos Términos, debe abandonar la Plataforma y abstenerse de usarla inmediatamente.

2. GLOSARIO

Plataforma Pandora's finance (o "Pandoras app"): La aplicación de software como servicio ("SaaS") y el conjunto de herramientas tecnológicas propiedad de Pandoras LLC, que permiten a los Creadores construir, desplegar y gestionar sus Creaciones.

Creador (o "Usuario"): La persona física o moral que utiliza las herramientas de software de la Plataforma Pandoras para construir, lanzar y gestionar sus Creaciones.

Creación (o "Artefacto"): El smart contract (contrato inteligente), token de utilidad, NFT, o protocolo digital que el Creador diseña, configura y despliega en una red blockchain pública utilizando las herramientas de software proporcionadas por Pandoras.

Protocolo de Utilidad: Un tipo de Creación con un propósito funcional específico, como Accesos (membresías), Lealtad (puntos de recompensa), Gobernanza (votación) o Work-to-Earn (recompensas por trabajo o tareas).

Pandoras Crypto (☆): Es un crédito interno de plataforma o saldo prepagado emitido por Pandoras, simbolizado por la ☆ estrella.

Aclaración Importante: Pandoras Crypto es un crédito interno para uso exclusivo en la Plataforma. No constituye dinero electrónico, ni un medio de pago reconocido fuera de Pandoras, ni un activo financiero, criptomoneda, token o instrumento de inversión. No puede ser retirado, transferido a otros usuarios, ni intercambiado por dinero fiduciario. Un (1) Pandoras Crypto en Pandoras app equivale a un (1) peso mexicano (MXN) únicamente para fines de cálculo de las tarifas de la Plataforma.

Pena convencional: Sanción económica estipulada por incumplimiento de estos Términos.

Cuenta de Usuario: El registro digital y la información proporcionada por el Creador para acceder y utilizar la Plataforma SaaS.

Formulario Digital: El proceso de registro o onboarding donde el Creador proporciona información para crear su Cuenta de Usuario (ej. nombre, correo electrónico, información de facturación).

Tercero Independiente: Personas físicas o morales ajenas a Pandoras, como procesadores de pago, proveedores de infraestructura en la nube, o servicios de auditoría de código.

Términos y Condiciones: El presente documento, que regula la relación vinculante entre Pandoras y el Creador para el uso de la Plataforma.

3. OBJETO Y ALCANCE DE LOS SERVICIOS

3.1. El objeto de Pandoras es proveer herramientas de software que permitan a los Creadores: a) Diseñar Creaciones y Protocolos de Utilidad usando plantillas pre-construidas y herramientas "no-code". b) Desplegar dichas Creaciones en redes blockchain públicas. c) Gestionar sus comunidades y protocolos a través de un dashboard o panel de control.

3.2. Pandoras NO es un broker, asesor financiero, casa de bolsa, custodio de valores, plataforma de fondeo colectivo (crowdfunding), ni una plataforma de inversiones. Pandoras no intermedia capitales, no recauda fondos, ni participa en procesos de compra o venta de tokens o activos financieros. Las Creaciones desarrolladas mediante Pandoras tienen exclusivamente fines funcionales o de utilidad (como acceso, gamificación o prueba de trabajo) y no representan participaciones financieras, derechos sobre activos, o expectativas de rendimiento económico pasivo.

4. USO DE LA PLATAFORMA Y RESPONSABILIDADES DEL CREADOR

4.1. Pandoras es solo una Herramienta. Los Creadores reconocen y aceptan que la Plataforma Pandoras es un conjunto de herramientas de software puestas a su disposición. Pandoras no crea, promueve, ni respalda ninguna Creación específica lanzada por un Creador.

4.2. Responsabilidad Total del Creador. El Creador es el único y absoluto responsable de su Creación. Esta responsabilidad incluye, pero no se limita a: a) Asegurar que su Creación y su modelo de utilidad cumplan con todas las leyes y regulaciones aplicables en su jurisdicción y en la de sus propios usuarios finales (incluyendo, sin limitación, leyes fiscales, de valores, y de protección al consumidor). b) La gestión, operación, promoción, seguridad y gobernanza de su Creación una vez desplegada. c) Proporcionar soporte técnico y de usuario a los usuarios finales de su Creación. d) La redacción y legalidad de sus propios términos de servicio y aviso de privacidad con su comunidad.

4.3. Prohibición de Securities (Valores). El Creador se compromete expresa y terminantemente a no utilizar la Plataforma Pandoras para crear, diseñar, vender, promover, gestionar o de cualquier forma traficar con Creaciones que impliquen promesas de retorno económico, rendimientos, intereses, dividendos, participación en utilidades o cualquier característica propia de valores (securities) o instrumentos financieros. Cualquier "rendimiento" o "beneficio" generado por una Creación debe provenir exclusivamente del uso funcional, gamificado o del trabajo (Work-to-Earn) directo del usuario final dentro del protocolo, y nunca de un esfuerzo de gestión pasivo por parte de un tercero (como el Creador o Pandoras). Pandoras podrá suspender inmediatamente cualquier Creación que contravenga este principio.

4.4. Responsabilidad sobre el Código. Todo código generado, desplegado o modificado por el Creador mediante Pandoras será de su exclusiva responsabilidad. Pandoras no audita (salvo sus plantillas de código base) ni garantiza el funcionamiento, seguridad o cumplimiento regulatorio de dichos códigos una vez desplegados por el Creador.

4.5. Propiedad Intelectual. Los derechos de autor, marcas, y todo el contenido de la Plataforma Pandoras (software, textos, gráficos, etc.) son propiedad exclusiva de Pandoras LLC. El uso de la Plataforma no concede al Creador ningún derecho sobre la misma, más allá de una licencia de uso limitada, no exclusiva y revocable para utilizar las herramientas SaaS conforme a estos Términos.

4.6. Restricciones de Uso. El Creador no podrá copiar, modificar, distribuir, vender o arrendar ninguna parte de nuestro software, ni realizar ingeniería inversa o intentar extraer el código fuente de dicho software, salvo que la ley lo permita o que cuente con nuestro permiso escrito.

4.7. Prohibición de Promoción o Venta Pública. El Creador no podrá usar la Plataforma para ofrecer públicamente, promocionar o comercializar Creaciones que puedan interpretarse como instrumentos financieros, valores, o mecanismos de captación de capital. Pandoras no participa en ningún proceso de oferta, venta o intermediación.

4.8. Uso Ético y Reputacional. El Creador se obliga a no utilizar la Plataforma para lanzar Creaciones con fines difamatorios, fraudulentos, políticos o que promuevan la discriminación, violencia o actividades ilegales. Pandoras podrá eliminar o suspender dichas cuentas sin previo aviso.

4.9. Cumplimiento Internacional. Pandoras opera como un proveedor de software bajo las leyes mexicanas. Pandoras no presta servicios financieros en ninguna jurisdicción. El Creador es el único responsable de asegurar que su uso de la Plataforma y sus Creaciones cumplan con todas las leyes y regulaciones de su jurisdicción local.

4.10. Derecho de Admisión y Suspensión. Pandoras se reserva el derecho de negar, suspender o cancelar de manera discrecional y unilateral el acceso y uso de Pandoras app a cualquier Creador que incumpla estos Términos, o que utilice la plataforma para actividades fraudulentas, ilícitas, o que a juicio de Pandoras, pongan en riesgo la reputación o la operación de la Plataforma, sin que esto genere responsabilidad alguna para Pandoras.

4.11. Enlaces a Terceros. Pandoras app puede contener enlaces a sitios web de terceros. Pandoras no tiene control sobre dichos sitios y no es responsable de su contenido, seguridad o prácticas.

4.12. Exclusión de Garantías. Pandoras no garantiza que la Plataforma esté libre de errores, virus, o interrupciones. El uso de la Plataforma es bajo el propio riesgo del Creador.

5. TARIFAS, PAGOS Y REEMBOLSOS

5.1. Las tarifas por el uso de la Plataforma SaaS (tales como planes de suscripción, tarifas por despliegue de Creaciones, o tarifas de uso de herramientas específicas) se encuentran descritas en la sección de "Precios" dentro de Pandoras app.

5.2. Los Creadores deberán pagar las tarifas aplicables para acceder y utilizar los servicios. Los pagos podrán realizarse mediante tarjeta de crédito, transferencia bancaria, o utilizando el saldo de Pandoras Crypto en la cuenta del Creador.

5.3. Los reembolsos por tarifas de suscripción o servicios pagados a Pandoras, cuando apliquen, se realizarán exclusivamente en créditos internos (Pandoras Crypto ☆). Estos créditos no constituyen dinero electrónico ni un medio de pago reconocido fuera de la Plataforma, y su valor es exclusivamente utilitario dentro de la misma.

5.4. En ningún caso se realizarán reembolsos en efectivo, transferencias interbancarias o devoluciones a tarjetas de crédito.

5.5. Los Pandoras Crypto emitidos como reembolso o adquiridos por el Creador podrán tener una fecha de vencimiento establecida por Pandoras. Es responsabilidad del Creador utilizarlos antes de dicha fecha.

5.6. Impuestos y Obligaciones Fiscales. El Creador reconoce que es el único y exclusivo responsable de determinar, declarar y pagar todos los impuestos (IVA, ISR, etc.) derivados del uso de la Plataforma y de los ingresos o transacciones generados por sus Creaciones, liberando a Pandoras de cualquier obligación o responsabilidad fiscal relacionada.

6. MODIFICACIONES

6.1. Pandoras se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios serán publicados en Pandoras app y/o notificados por correo electrónico.

6.2. El uso continuado de la Plataforma por parte del Creador después de la publicación de los cambios implicará su aceptación expresa de los nuevos Términos.

7. AVISO DE PRIVACIDAD

7.1. Pandora conoce la importancia de sus Datos Personales. En el tratamiento de sus datos se observarán los principios de licitud, consentimiento, información, calidad, finalidad, lealtad, proporcionalidad y responsabilidad, previstos en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.

7.2. La finalidad del tratamiento de sus datos personales es lograr realizar todos los actos tendientes al registro, uso y gestión de su Cuenta de Usuario en Pandoras app y la prestación de los servicios SaaS contratados.

7.3. En caso de que se pretendan tratar sus datos personales para un fin distinto que no resulte compatible o análogo a los fines aquí establecidos, solicitaremos su consentimiento expreso para ello.

7.4. Cualquier duda, o en caso de objeción con el tratamiento de sus datos, favor de comunicarla al correo electrónico soporte@pandoras.finance, con atención al Encargado de Datos Personales.

7.5. Si se puso a disposición el presente aviso de forma indirecta, usted tendrá un plazo de cinco días hábiles para manifestar su negativa al tratamiento de sus datos para finalidades no necesarias.

7.6. Datos Personales materia del Tratamiento: Los datos personales tratados serán aquellos proporcionados durante el registro de la Cuenta de Usuario y el uso de la Plataforma, tales como: nombre, correo electrónico, información de contacto e información de facturación.

7.7. El Creador consiente expresamente en que se transfieran sus datos personales a Terceros Independientes (como procesadores de pago o proveedores de nube) que sean necesarios para la correcta prestación del servicio, liberando a Pandoras de toda responsabilidad derivada de dicha transferencia necesaria.

7.8. Seguridad y Cifrado. Pandoras implementa medidas de seguridad técnicas y administrativas razonables para proteger los datos del Creador. Sin embargo, ninguna transmisión por Internet o almacenamiento digital es 100% seguro. El Creador acepta este riesgo inherente al proporcionar sus datos.

8. JURISDICCIÓN Y COMPETENCIA

8.1. Interpretación y Legislación Aplicable: Los Creadores y Pandoras acuerdan que para la interpretación y supletoriedad, las Partes acuerdan sujetar el presente contrato a las disposiciones del Código de Comercio y en lo no previsto por éste, a las disposiciones del Código Civil Federal de los Estados Unidos Mexicanos, en la medida que dichos ordenamientos no contradigan lo aquí pactado.

8.2. Competencia y Jurisdicción: Para el cumplimiento e interpretación de los presentes Términos y Condiciones, los Creadores y Pandoras se someten expresamente a la jurisdicción y competencia de los tribunales competentes del Primer Partido Judicial del Estado de Jalisco, renunciando a cualquier otro fuero que pudiera corresponderles por razón de sus domicilios presentes o futuros, o por cualquier otra razón.

8.3. Resolución Alternativa de Conflictos. Antes de acudir a la vía judicial, las partes (Pandoras y el Creador) acuerdan expresamente intentar resolver cualquier disputa o controversia derivada de estos Términos mediante un proceso de mediación o arbitraje privado confidencial, que se llevará a cabo en la ciudad de Guadalajara, Jalisco, México.

9. ACEPTACIÓN EXPRESA DEL CREADOR

9.1. El Creador declara que ha leído, comprendido y aceptado voluntariamente la totalidad de los presentes Términos y Condiciones de Pandoras app.

9.2. El Creador declara y reconoce expresamente que entiende que Pandoras es un proveedor de herramientas de software (SaaS) y NO un socio, asesor financiero, legal, fiscal, broker o plataforma de inversiones.

9.3. El Creador acepta y asume la responsabilidad total e indelegable por la legalidad, el cumplimiento normativo (incluyendo leyes de valores), la seguridad y la operación de cualquier Creación o Protocolo de Utilidad que diseñe y despliegue utilizando la Plataforma.

9.4. El Creador acepta expresa y digitalmente estos Términos y Condiciones al marcar la casilla correspondiente de aceptación ("Entiendo que Pandora es una plataforma de software (SaaS) y que soy responsable de mi proyecto") al momento de crear su Cuenta de Usuario y/o al continuar usando Pandoras app.

9.5. Lo anterior genera un acuerdo de voluntades obligatorio y vinculante entre Pandoras y el Creador.

10. LIMITACIÓN DE RESPONSABILIDAD

10.1. Pandoras no será responsable, en ningún caso, por pérdidas directas, indirectas, incidentales, consecuenciales o punitivas (incluyendo, sin limitación, pérdida de datos, de ganancias, o de reputación) derivadas del uso o la imposibilidad de uso de la Plataforma o de cualquier Creación lanzada por los Creadores.

10.2. Pandoras no asume responsabilidad alguna por fallos de red blockchain, errores en smart contracts desplegados por los Creadores, fluctuaciones de tarifas de "gas", ataques informáticos, forks de la red, o cualquier otro evento técnico o de mercado fuera de su control razonable.

10.3. El Creador acepta indemnizar y mantener a Pandoras LLC, sus directores, empleados y afiliados, libres de toda reclamación, demanda, costo o daño (incluyendo honorarios de abogados) derivado de su uso de la Plataforma, de sus Creaciones, o de su incumplimiento de estos Términos.

11. CONTACTO

11.1. Para cualquier duda o consulta sobre estos Términos y Condiciones, por favor, póngase en contacto con nuestro equipo de soporte en: soporte@pandoras.finance`}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
