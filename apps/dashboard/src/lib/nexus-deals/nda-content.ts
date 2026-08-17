/**
 * nda-content.ts — Pandoras Ecosystem Confidentiality & Non-Use Agreement v1.0
 * Single source of truth for NDA text, sign message builders, and UI bullets.
 */

export const NDA_VERSION = "v1.0";

export const NDA_TITLE =
  "Pandora's Ecosystem — Acuerdo de Confidencialidad, No Uso y Protección de Información Confidencial";

export const NDA_SUBTITLE =
  "Pandora's Ecosystem Confidentiality & Non-Use Agreement";

/** Key commitments shown in the UI before the full text */
export const NDA_SUMMARY_BULLETS = [
  "Mantener estricta confidencialidad de toda información del ecosistema Pandora's",
  "No usar la información para desarrollar productos competidores o derivados",
  "No realizar ingeniería inversa de software, contratos o arquitecturas propietarias",
  "Proteger credenciales y accesos con máximas medidas de seguridad",
  "No introducir información confidencial en modelos de IA o servicios externos",
  "No circunvenir a Pandora's respecto de clientes, partners u oportunidades (24 meses)",
  "Obligaciones vigentes durante 5 años; secretos industriales: indefinidamente",
];

/** Deterministic on-chain sign message for the NDA alone */
export function buildNdaSignMessage(params: {
  email: string;
  wallet: string;
  ndaVersion?: string;
  timestamp: string;
}): string {
  const version = params.ndaVersion ?? NDA_VERSION;
  return [
    `Pandora's Ecosystem — Acuerdo de Confidencialidad (${version})`,
    ``,
    `Al firmar este mensaje reconozco que:`,
    `1. He leído y entiendo el Acuerdo de Confidencialidad, No Uso y Protección de Información Confidencial de Pandora's Ecosystem versión ${version}.`,
    `2. Acepto voluntariamente todas sus obligaciones y restricciones.`,
    `3. Esta firma electrónica constituye mi consentimiento legalmente vinculante conforme al Código de Comercio mexicano.`,
    ``,
    `Identidad: ${params.email}`,
    `Wallet: ${params.wallet}`,
    `Timestamp: ${params.timestamp}`,
    `Versión: ${version}`,
  ].join("\n");
}

/** Combined sign message: NDA + Deal in one on-chain transaction */
export function buildCombinedSignMessage(params: {
  email: string;
  wallet: string;
  publicId: string;
  dealKind: string;
  dealCounterparty: string;
  ndaVersion?: string;
  timestamp: string;
}): string {
  const version = params.ndaVersion ?? NDA_VERSION;
  return [
    `Pandora's Nexus — Firma Combinada`,
    ``,
    `Documento 1 — Acuerdo de Confidencialidad (NDA ${version})`,
    `Pandora's Ecosystem Confidentiality & Non-Use Agreement`,
    ``,
    `Documento 2 — ${params.dealKind}: ${params.publicId}`,
    `Contraparte: ${params.dealCounterparty}`,
    ``,
    `Al firmar este mensaje acepto on-chain ambos documentos de forma simultánea.`,
    `El NDA Pandora's Ecosystem ${version} queda registrado como aceptado globalmente.`,
    `El ${params.dealKind} ${params.publicId} queda firmado por la presente.`,
    ``,
    `Identidad: ${params.email}`,
    `Wallet: ${params.wallet}`,
    `Timestamp: ${params.timestamp}`,
    `NDA Version: ${version}`,
  ].join("\n");
}

export const NDA_FULL_TEXT = `ACUERDO DE CONFIDENCIALIDAD, NO USO Y PROTECCIÓN DE INFORMACIÓN CONFIDENCIAL
PANDORA'S ECOSYSTEM — CONFIDENTIALITY & NON-USE AGREEMENT
Versión: 1.0
Fecha de vigencia: La fecha de aceptación electrónica registrada en el Deal Room de Nexus.

1. PARTES

El presente Acuerdo (el "Acuerdo") se celebra entre PANDORA'S, incluyendo a la entidad jurídica que en cada momento sea titular, operadora, desarrolladora o administradora de los activos, productos, tecnologías, propiedad intelectual, infraestructura o negocios del ecosistema Pandora's (la "Parte Reveladora"); y la persona física o moral que acceda al presente Acuerdo mediante el Deal Room de Nexus, acepte electrónicamente sus términos o reciba acceso autorizado a Información Confidencial (el "Receptor").

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

14. NO CIRCUNVENCIÓN

Durante la vigencia y por 24 meses posteriores a la última revelación, el Receptor no podrá utilizar Información Confidencial para eludir o excluir deliberadamente a Pandora's respecto de clientes, partners, inversionistas, proyectos u oportunidades que conoció exclusivamente por su relación con Pandora's.

15. NO SOLICITACIÓN

Durante la vigencia y por 12 meses posteriores, el Receptor no utilizará Información Confidencial para inducir deliberadamente a empleados o colaboradores clave de Pandora's a abandonar su relación con la empresa.

17. ACEPTACIÓN ELECTRÓNICA Y REGISTRO ON-CHAIN

Las Partes acuerdan que este Acuerdo podrá ser aceptado mediante medios electrónicos dentro del Deal Room de Nexus, incluyendo wallet signature, timestamp, hash del documento y registro de auditoría. El Registro de Aceptación tendrá plena validez conforme al Código de Comercio mexicano.

22. PROHIBICIÓN DE USO EN MODELOS DE IA

Salvo autorización expresa de Pandora's, el Receptor no podrá introducir Información Confidencial en modelos de inteligencia artificial, asistentes de IA, servicios de generación de código, plataformas de análisis automático, sistemas RAG, datasets, servicios de entrenamiento o fine-tuning.

28. DURACIÓN

Las obligaciones de confidencialidad permanecerán vigentes durante cinco (5) años después de la última revelación de Información Confidencial. Respecto de información que constituya un secreto industrial, las obligaciones permanecerán vigentes mientras dicha información conserve legalmente tal carácter conforme a la Ley Federal de Protección a la Propiedad Industrial.

30. LEGISLACIÓN APLICABLE

Este Acuerdo se regirá conforme a las leyes de los Estados Unidos Mexicanos.

40. ACEPTACIÓN

EL RECEPTOR DECLARA QUE HA LEÍDO, ENTENDIDO Y ACEPTADO ESTE ACUERDO DE CONFIDENCIALIDAD, NO USO Y PROTECCIÓN DE INFORMACIÓN CONFIDENCIAL. La aceptación electrónica realizada dentro del Deal Room de Nexus constituirá la manifestación de consentimiento del Receptor. No será necesaria una firma manuscrita cuando la aceptación electrónica sea jurídicamente atribuible al Receptor conforme a la legislación aplicable.

FIN DEL ACUERDO — PANDORA'S ECOSYSTEM · Versión 1.0`;
