/**
 * nda-content.ts — Pandoras Ecosystem Confidentiality & Non-Use Agreements
 * Single source of truth for:
 * 1. Master NDA (v2.2) — Unilateral institutional protection for all ecosystem participants.
 * 2. ELD × Pandora's Hybrid NDA (v0.2-hybrid-eld) — Bilateral strategic protection with 2 active signers exclusively for Oscar / ELD deal flow.
 */

// ─── 1. MASTER NDA (GLOBAL STANDARD v2.2) ────────────────────────────────────

export const NDA_VERSION = "v2.2";

export const NDA_TITLE =
  "Pandora's Ecosystem — Acuerdo de Confidencialidad, No Uso y Protección de Información Confidencial";

export const NDA_SUBTITLE =
  "Pandora's Ecosystem Confidentiality & Non-Use Agreement";

/** Key commitments shown in the UI before the full text for Master NDA */
export const NDA_SUMMARY_BULLETS = [
  "Mantener estricta confidencialidad de toda información del ecosistema Pandora's",
  "No usar la información para desarrollar productos competidores o derivados",
  "No realizar ingeniería inversa de software, contratos o arquitecturas propietarias",
  "Proteger credenciales y accesos con máximas medidas de seguridad",
  "No introducir información confidencial en modelos de IA o servicios externos",
  "No circunvenir a Pandora's respecto de clientes, partners u oportunidades (24 meses)",
  "Obligaciones vigentes durante 5 años; secretos industriales: indefinidamente",
];

export const NDA_FULL_TEXT = `ACUERDO DE CONFIDENCIALIDAD, NO USO Y PROTECCIÓN DE INFORMACIÓN CONFIDENCIAL
PANDORA'S ECOSYSTEM — CONFIDENTIALITY & NON-USE AGREEMENT
Versión: 2.2
Fecha de vigencia: La fecha de aceptación electrónica registrada en el Deal Room de Nexus.

1. PARTES

El presente Acuerdo (el "Acuerdo") constituye un instrumento legalmente vinculante emitido unilateralmente por MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. (titular y operadora de la marca Pandora's Finance y su ecosistema tecnológico), en lo sucesivo "Pandora's" o la "Parte Reveladora"; y la persona física o moral que acceda al presente Acuerdo mediante el Deal Room de Nexus, acepte electrónicamente sus términos o reciba acceso autorizado a Información Confidencial (el "Receptor").

2. OBJETO

Proteger toda información confidencial, propietaria, técnica, comercial, estratégica, financiera, operativa, legal y tecnológica que Pandora's revele al Receptor con motivo de cualquier relación presente o futura entre las Partes.

3. DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL

Toda información que Pandora's revele al Receptor, independientemente de su formato, medio, soporte, o si está marcada como "Confidential". Incluye sin limitación: arquitectura del ecosistema, código fuente, APIs, SDKs, smart contracts, Hermes OS, Growth OS, Media Co, modelos de IA, información de clientes, estrategias, roadmaps y planes de negocio.

4. INFORMACIÓN QUE NO ES CONFIDENCIAL

Aquella que era públicamente conocida antes de ser revelada; se volvió pública sin incumplimiento de este Acuerdo; fue recibida de un tercero sin obligación de confidencialidad; fue desarrollada independientemente; o Pandora's haya autorizado expresamente su divulgación.

5. OBLIGACIÓN DE CONFIDENCIALIDAD

El Receptor deberá: mantener estrictamente confidencial la Información Confidencial; utilizarla exclusivamente para el Propósito Autorizado; protegerla con el mismo nivel de cuidado que su propia información confidencial de máxima importancia; impedir el acceso de personas no autorizadas.

6. PROPÓSITO AUTORIZADO

La Información Confidencial únicamente podrá utilizarse para evaluar, desarrollar, ejecutar o administrar la relación expresamente autorizada por Pandora's. Queda prohibido utilizarla para desarrollar productos competidores, replicar arquitecturas, entrenar modelos de IA o alimentar datasets.

7. PROHIBICIÓN DE INGENIERÍA INVERSA

El Receptor no podrá descompilar, desmontar, realizar reverse engineering, reproducir, clonar, forkear, replicar ni reconstruir ningún software, arquitectura, sistema, agente, modelo, smart contract, API o componente propietario de Pandora's, salvo autorización expresa y documentada.

8. PROHIBICIÓN DE REVELACIÓN DE ARQUITECTURA

El Receptor no podrá divulgar diagramas, arquitectura, screenshots, documentación, código, endpoints, contratos, configuraciones o información de infraestructura. Tampoco publicar artículos, posts, videos o presentaciones que revelen información no pública de Pandora's sin autorización previa.

9. PROTECCIÓN DE SMART CONTRACTS Y BLOCKCHAIN

La existencia de información pública on-chain no elimina el carácter confidencial de la información adicional revelada por Pandora's sobre arquitectura, lógica de negocio, permisos, roles, wallets o procedimientos operativos.

10. CREDENCIALES Y ACCESOS

API keys, private keys, seed phrases, passwords, access tokens, OAuth credentials, webhook secrets, database credentials, cloud credentials, wallet credentials, encryption keys y signing keys son Información Confidencial de máxima sensibilidad. El Receptor deberá notificar inmediatamente cualquier pérdida o compromiso.

11. DATOS DE CLIENTES Y TERCEROS

Cuando Pandora's revele información de clientes, partners o terceros, el Receptor deberá tratarla con el mismo nivel de protección establecido en este Acuerdo.

12. PROPIEDAD INTELECTUAL

Toda Información Confidencial continuará siendo propiedad exclusiva de Pandora's. Nada en este Acuerdo constituye cesión, licencia o transferencia. El acceso únicamente concede un derecho limitado de uso para el Propósito Autorizado.

13. NO CIRCUNVENCIÓN

Durante la vigencia y por 24 meses posteriores a la última revelación, el Receptor no podrá utilizar Información Confidencial para eludir o excluir deliberadamente a Pandora's respecto de clientes, partners, inversionistas, proyectos u oportunidades que conoció exclusivamente por su relación con Pandora's.

14. NO SOLICITACIÓN

Durante la vigencia y por 12 meses posteriores, el Receptor no utilizará Información Confidencial para inducir deliberadamente a empleados o colaboradores clave de Pandora's a abandonar su relación con la empresa.

15. ACEPTACIÓN ELECTRÓNICA Y REGISTRO ON-CHAIN

Las Partes acuerdan que este Acuerdo podrá ser aceptado mediante medios electrónicos dentro del Deal Room de Nexus, incluyendo wallet signature, timestamp, hash del documento y registro de auditoría. El Registro de Aceptación tendrá plena validez conforme al Código de Comercio mexicano.

16. PROHIBICIÓN DE USO EN MODELOS DE IA

Salvo autorización expresa de Pandora's, el Receptor no podrá introducir Información Confidencial en modelos de inteligencia artificial, asistentes de IA, servicios de generación de código, plataformas de análisis automático, sistemas RAG, datasets, servicios de entrenamiento o fine-tuning.

17. DURACIÓN

Las obligaciones de confidencialidad permanecerán vigentes durante cinco (5) años después de la última revelación de Información Confidencial. Respecto de información que constituya un secreto industrial, las obligaciones permanecerán vigentes mientras dicha información conserve legalmente tal carácter conforme a la Ley Federal de Protección a la Propiedad Industrial.

18. LEGISLACIÓN APLICABLE

Este Acuerdo se regirá conforme a las leyes de los Estados Unidos Mexicanos.

19. ACEPTACIÓN

EL RECEPTOR DECLARA QUE HA LEÍDO, ENTENDIDO Y ACEPTADO ESTE ACUERDO DE CONFIDENCIALIDAD, NO USO Y PROTECCIÓN DE INFORMACIÓN CONFIDENCIAL. La puesta a disposición de este documento a través de la plataforma constituye la voluntad formal de MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. de obligarse en los términos aquí descritos. La firma o aceptación electrónica realizada dentro del Deal Room de Nexus constituirá la manifestación del consentimiento vinculante del Receptor para perfeccionar este Acuerdo, sin requerir firma adicional por parte de Pandora's.

FIN DEL ACUERDO — PANDORA'S ECOSYSTEM · Versión 2.2`;


// ─── 2. ELD × PANDORA'S HYBRID NDA (BILATERAL v0.2 — EXCLUSIVO OSCAR / ELD) ──

export const ELD_HYBRID_NDA_VERSION = "v0.2-hybrid-eld";

export const ELD_HYBRID_NDA_TITLE =
  "ELD × Pandora's — Acuerdo Bilateral de Confidencialidad, No Uso y Protección de Activos Estratégicos";

export const ELD_HYBRID_NDA_SUBTITLE =
  "ELD × Pandora's Bilateral Strategic Confidentiality & Asset Protection Agreement";

export const ELD_HYBRID_NDA_SUMMARY_BULLETS = [
  "Protección mutua y bilateral de información confidencial compartida entre ELD y Pandora's",
  "Reconocimiento expreso de titularidad: cada parte mantiene la propiedad absoluta sobre sus activos, know-how y propiedad intelectual previa (Disclosure ≠ Transferencia de propiedad)",
  "No restricción de experiencia profesional previa, conocimiento general ni desarrollo autónomo independiente",
  "Prohibición de ingeniería inversa, clonación y extracción de código o modelos de IA",
  "No circunvención delimitada exclusivamente a oportunidades o contactos conocidos mediante acceso directo a información confidencial de la otra parte (24 meses)",
  "Separación documental estricta: compensación, revenue share o partnership económico se regulan exclusivamente en acuerdos específicos posteriores",
  "Firma dual requerida: ambas partes (ELD y Pandora's) son firmantes activos del presente acuerdo",
];

export const ELD_HYBRID_NDA_FULL_TEXT = `ACUERDO BILATERAL DE CONFIDENCIALIDAD, NO USO Y PROTECCIÓN DE ACTIVOS ESTRATÉGICOS
ELD × PANDORA'S ECOSYSTEM — BILATERAL STRATEGIC CONFIDENTIALITY AGREEMENT
Versión: v0.2-hybrid-eld
Fecha de vigencia: La fecha en que ambas Partes perfeccionen su firma electrónica dentro del Deal Room de Nexus.

1. PARTES Y FIRMANTES ACTIVOS

El presente Acuerdo Bilateral (el "Acuerdo") es celebrado por y entre:
(A) MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. (titular y operadora de Pandora's Finance, Hermes OS y su ecosistema tecnológico), representada legalmente en este acto, en lo sucesivo "Pandora's"; y
(B) ELD (Entidad de Liderazgo y Desarrollo / Representación de Oscar), en lo sucesivo "ELD";
Ambas en conjunto denominadas las "Partes" e individualmente una "Parte", actuando recíprocamente como Parte Reveladora y Parte Receptora según corresponda.

2. OBJETO Y ALINEACIÓN ESTRATÉGICA

Establecer un marco bilateral y recíproco de confidencialidad, trazabilidad y protección de activos estratégicos, información confidencial, tecnología y procesos de colaboración, asegurando claridad absoluta respecto a los derechos y titularidades de ambas Partes.

3. CLARIFICACIÓN DE ACTIVOS PREEXISTENTES Y PROPIEDAD INTELECTUAL (DISCLOSURE ≠ TRANSFERENCIA)

Cada una de las Partes mantiene la titularidad y propiedad exclusiva sobre sus activos, metodologías, frameworks, investigación, documentación, know-how, materiales educativos y propiedad intelectual desarrollados previamente a esta relación.
La revelación de información dentro del marco de este Acuerdo no constituye ni implicará cesión, transferencia de propiedad, licencia automática ni autorización de uso comercial fuera del propósito acordado.

4. CONOCIMIENTO INDEPENDIENTE Y DESARROLLO AUTÓNOMO

Las obligaciones de confidencialidad protegen la información confidencial legítimamente recibida de la otra Parte. Dichas obligaciones no limitan ni restringirán la experiencia profesional previa, el conocimiento general, las capacidades independientes, la investigación propia ni el desarrollo autónomo legítimo efectuado sin utilizar información confidencial de la contraparte.

5. RELACIONES, CONTACTOS Y NO CIRCUNVENCIÓN

(A) Las relaciones, clientes y contactos desarrollados previamente por cada Parte permanecen bajo el control exclusivo de la Parte que los originó.
(B) Las oportunidades creadas conjuntamente se gestionarán conforme a acuerdos específicos posteriores.
(C) La obligación de No Circunvención (24 meses) aplicará respecto de información, clientes o relaciones conocidos exclusivamente mediante acceso autorizado a Información Confidencial de la otra Parte.

6. PROHIBICIÓN DE INGENIERÍA INVERSA Y EXTRACCIÓN DE MODELOS DE IA

Ninguna de las Partes podrá descompilar, desmontar, realizar reverse engineering, reproducir, clonar, forkear, replicar ni reconstruir software, arquitecturas, agentes, modelos de IA, smart contracts o componentes propietarios de la otra Parte. Queda prohibido introducir Información Confidencial en modelos de IA públicos, datasets externos o sistemas RAG sin autorización documentada.

7. SEPARACIÓN DOCUMENTAL ESTRICTA RESPECTO DE ACUERDOS COMERCIALES

El presente Acuerdo regula exclusivamente la protección de información confidencial y activos. Este Acuerdo no establece ni prejuzga esquemas de compensación, revenue share, success fees, licensing, equity, territorios o partnership económico, los cuales deberán documentarse formalmente en acuerdos específicos posteriores dentro del Deal Room.

8. CREDENCIALES, ACCESOS Y SECRETOS INDUSTRIALES

Las credenciales criptográficas, API keys, private keys, wallets y accesos de infraestructura constituyen Información Confidencial de máxima sensibilidad. Las obligaciones de confidencialidad permanecerán vigentes durante cinco (5) años; tratándose de secretos industriales, subsistirán indefinidamente mientras conserven tal carácter conforme a la ley.

9. JURISDICCIÓN Y VALIDEZ ELECTRÓNICA ON-CHAIN

Este Acuerdo se regirá conforme a las leyes de los Estados Unidos Mexicanos. Las Partes convienen que el perfeccionamiento de este Acuerdo requerirá la firma electrónica EIP-191 o aceptación verificada de ambos firmantes activos (Pandora's y ELD) dentro del Deal Room de Nexus, teniendo plena validez jurídica conforme al Código de Comercio mexicano.

FIN DEL ACUERDO — ELD × PANDORA'S · Versión Bilateral v0.2-hybrid-eld`;


// ─── 3. CONFIGURATION RESOLVER ────────────────────────────────────────────────

export interface NdaConfig {
  version: string;
  title: string;
  subtitle: string;
  summaryBullets: string[];
  fullText: string;
  requiredSigners: number;
  isBilateral: boolean;
}

// ─── 2. VILLAGE NDA (OPORTUNIDAD OFF-MARKET) ────────────────────────────────

export const VILLAGE_NDA_VERSION = "v1.0-village";

export const VILLAGE_NDA_TITLE =
  "Acuerdo de Confidencialidad, No Uso y No Circunvención — Proyecto Village";

export const VILLAGE_NDA_SUBTITLE =
  "Project Village — Confidentiality, Non-Use and Non-Circumvention Agreement";

export const VILLAGE_NDA_SUMMARY_BULLETS = [
  "Mantener en estricta confidencialidad la identidad, ubicación, operación y finanzas del Activo",
  "Usar la información únicamente para evaluar una posible adquisición",
  "No contactar al vendedor, operador, acreedores o intermediarios por fuera de AZTECAZ (24 meses)",
  "No divulgar el memorándum, estados financieros ni documentos de la oportunidad",
  "No usar la información para competir, replicar la operación o adquirir por cuenta de terceros",
  "Confidencialidad por 3 años; secretos industriales de forma indefinida",
  "La circunvención se sanciona con la comisión pactada (3% del precio de cierre)",
];

export const VILLAGE_NDA_FULL_TEXT = `ACUERDO DE CONFIDENCIALIDAD, NO USO Y NO CIRCUNVENCIÓN
PROYECTO VILLAGE — CONFIDENTIALITY, NON-USE AND NON-CIRCUMVENTION AGREEMENT
Versión: 1.0-village
Fecha de vigencia: la fecha de aceptación electrónica registrada en el Deal Room de Nexus.

1. PARTES

El presente Acuerdo (el "Acuerdo") se celebra entre AZTECAZ HUB S.A.P.I. DE C.V., en lo sucesivo "AZTECAZ" o la "Parte Reveladora", y la persona física o moral que acceda a este documento, lo acepte electrónicamente o reciba Información Confidencial (el "Receptor").

2. ANTECEDENTES

AZTECAZ tiene acceso a información relativa a una oportunidad de adquisición de un activo hotelero en operación identificado bajo el nombre clave "Proyecto Village" (el "Activo"). El Receptor manifiesta interés en evaluar una posible adquisición total o parcial del Activo y reconoce que para ello requiere acceso a información reservada.

3. INFORMACIÓN CONFIDENCIAL

Es Información Confidencial toda información revelada por AZTECAZ, por el vendedor o por sus asesores, en cualquier formato, incluyendo sin limitación: identidad y ubicación del Activo; nombre comercial y marcas; memorándum de inversión (OM) y anexos; estados financieros históricos y proyectados; estructura de propiedad, fideicomisos y gravámenes; contratos de operación, administración y franquicia; plantilla y contratos laborales; licencias, permisos y situación fiscal; pasivos, deuda y litigios; estrategia de venta, precio de referencia y cualquier término comercial; y la simple existencia de la oportunidad.

4. INFORMACIÓN EXCLUIDA

No es Información Confidencial la que: (a) fuera pública antes de su revelación; (b) se volviera pública sin incumplimiento del Receptor; (c) el Receptor ya tuviera documentalmente antes de la revelación; (d) reciba de un tercero sin deber de confidencialidad; o (e) AZTECAZ autorice por escrito su divulgación.

5. OBLIGACIONES DEL RECEPTOR

El Receptor se obliga a: (a) mantener la Información Confidencial en estricta reserva; (b) usarla exclusivamente para el Propósito Autorizado; (c) limitar el acceso a sus directivos, empleados y asesores que lo necesiten, bajo obligaciones equivalentes; (d) no reproducir, fotografiar ni reenviar documentos sin autorización escrita; (e) custodiar el OM y los anexos con medidas razonables de seguridad; y (f) notificar de inmediato cualquier acceso o divulgación no autorizada.

6. PROPÓSITO AUTORIZADO

La Información Confidencial solo podrá utilizarse para evaluar, negociar y, en su caso, ejecutar una adquisición del Activo por el propio Receptor o por una entidad de su grupo, siempre por conducto de AZTECAZ.

7. NO CIRCUNVENCIÓN

Durante 24 meses contados desde la aceptación de este Acuerdo, el Receptor y sus afiliados, socios, fondos, vehículos de inversión y asesores no podrán, directa o indirectamente: (a) contactar al vendedor, operador, acreedores, fiduciario o cualquier contraparte del Activo sin autorización escrita de AZTECAZ; (b) adquirir, financiar, coinvertir o participar en la adquisición del Activo por fuera de AZTECAZ; ni (c) introducir a un tercero en la operación evadiendo a AZTECAZ.

En caso de incumplimiento, el Receptor pagará a AZTECAZ, como pena convencional, el monto equivalente a la comisión pactada del 3% (tres por ciento) sobre el precio de cierre de la operación, sin perjuicio de los daños y perjuicios adicionales que procedan. Las Partes reconocen que la cuantificación anticipada es razonable por la dificultad de valorar el daño.

8. PLAZO

Las obligaciones de confidencialidad subsistirán por 3 (tres) años desde la aceptación. Respecto de secretos industriales y de información que constituya secreto comercial, la obligación será indefinida conforme a la ley aplicable.

9. DEVOLUCIÓN O DESTRUCCIÓN

A solicitud de AZTECAZ, o al concluir las conversaciones, el Receptor devolverá o destruirá la Información Confidencial y confirmará por escrito dicha destrucción, conservando únicamente una copia en sus archivos legales cuando la ley lo exija, sujeta a este Acuerdo.

10. SIN GARANTÍAS Y SIN OBLIGACIÓN DE TRANSAR

La información se entrega "tal cual". AZTECAZ no garantiza su exactitud ni integridad y no asume obligación alguna de negociar, aceptar ofertas o concluir la operación. Ninguna conducta previa crea exclusividad ni mandato.

11. DATOS PERSONALES

Los datos de contacto se tratarán conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, únicamente para gestionar esta oportunidad.

12. LEY APLICABLE Y JURISDICCIÓN

Este Acuerdo se rige por las leyes de los Estados Unidos Mexicanos. Para cualquier controversia, las Partes se someten a los tribunales competentes de Guadalajara, Jalisco, renunciando a cualquier otro fuero.

13. FIRMA ELECTRÓNICA

Las Partes reconocen la validez de la firma electrónica conforme al Código de Comercio y a la NOM-151-SCFI-2016 en lo conducente. La aceptación registrada en el Deal Room de Nexus (correo, wallet, fecha y hash) constituye prueba de consentimiento.

14. ACEPTACIÓN

Al firmar, el Receptor declara haber leído y comprendido este Acuerdo, contar con facultades suficientes para obligarse y aceptar íntegramente sus términos.

POR AZTECAZ HUB S.A.P.I. DE C.V.
Nombre: ______________________________
Cargo: _______________________________
Firma: _______________________________  Fecha: ____________

POR EL RECEPTOR
Nombre: ______________________________
Empresa: _____________________________
Cargo: _______________________________
Correo: ______________________________
Firma: _______________________________  Fecha: ____________`;

export function getNdaConfig(version?: string): NdaConfig {
  if (version === VILLAGE_NDA_VERSION || version === "village") {
    return {
      version: VILLAGE_NDA_VERSION,
      title: VILLAGE_NDA_TITLE,
      subtitle: VILLAGE_NDA_SUBTITLE,
      summaryBullets: VILLAGE_NDA_SUMMARY_BULLETS,
      fullText: VILLAGE_NDA_FULL_TEXT,
      requiredSigners: 1,
      isBilateral: false,
    };
  }

  if (version === ELD_HYBRID_NDA_VERSION || version === "v0.2-hybrid-eld" || version === "ELD-HYBRID-v0.2") {
    return {
      version: ELD_HYBRID_NDA_VERSION,
      title: ELD_HYBRID_NDA_TITLE,
      subtitle: ELD_HYBRID_NDA_SUBTITLE,
      summaryBullets: ELD_HYBRID_NDA_SUMMARY_BULLETS,
      fullText: ELD_HYBRID_NDA_FULL_TEXT,
      requiredSigners: 2,
      isBilateral: true,
    };
  }

  // Default: Master NDA v2.2
  return {
    version: version || NDA_VERSION,
    title: NDA_TITLE,
    subtitle: NDA_SUBTITLE,
    summaryBullets: NDA_SUMMARY_BULLETS,
    fullText: NDA_FULL_TEXT,
    requiredSigners: 1,
    isBilateral: false,
  };
}

// ─── 4. DETERMINISTIC ON-CHAIN SIGN MESSAGE BUILDERS ─────────────────────────

export function buildNdaSignMessage(params: {
  email: string;
  wallet: string;
  ndaVersion?: string;
  timestamp: string;
}): string {
  const cfg = getNdaConfig(params.ndaVersion);
  return [
    `${cfg.title} (${cfg.version})`,
    ``,
    `Al firmar este mensaje reconozco que:`,
    `1. He leído y entiendo el ${cfg.title} versión ${cfg.version}.`,
    `2. Acepto voluntariamente todas sus obligaciones y restricciones.`,
    `3. Esta firma electrónica constituye mi consentimiento legalmente vinculante conforme al Código de Comercio mexicano.`,
    ``,
    `Identidad: ${params.email}`,
    `Wallet: ${params.wallet}`,
    `Timestamp: ${params.timestamp}`,
    `Versión: ${cfg.version}`,
  ].join("\n");
}

export function buildCombinedSignMessage(params: {
  email: string;
  name: string;
  company?: string;
  role?: string;
  wallet: string;
  publicId: string;
  dealKind: string;
  dealCounterparty: string;
  ndaVersion?: string;
  timestamp: string;
}): string {
  const cfg = getNdaConfig(params.ndaVersion);
  return [
    `Pandora's Nexus — Firma Combinada`,
    ``,
    `Documento 1 — ${cfg.title} (${cfg.version})`,
    `${cfg.subtitle}`,
    ``,
    `Documento 2 — ${params.dealKind}: ${params.publicId}`,
    `Contraparte: ${params.dealCounterparty}`,
    ``,
    `Al firmar este mensaje acepto on-chain ambos documentos de forma simultánea.`,
    `El ${cfg.title} (${cfg.version}) queda registrado como aceptado.`,
    `El ${params.dealKind} ${params.publicId} queda firmado por la presente.`,
    ``,
    `Identidad: ${params.email}`,
    params.company ? `Nombre: ${params.name}, en representación de ${params.company} (${params.role ?? 'Representante Legal'})` : `Nombre: ${params.name}`,
    `Wallet: ${params.wallet}`,
    `Timestamp: ${params.timestamp}`,
    `NDA Version: ${cfg.version}`,
  ].join("\n");
}
