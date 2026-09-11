/**
 * 🏛️ Hermes Executive Sovereign Plane — Manifest of Founder Capabilities
 * apps/dashboard/src/lib/hermes/executive/capabilities-manifest.ts
 *
 * Canonic catalog of all abilities Hermes executes exclusively for Marco.
 * Accessible from WhatsApp, Telegram, Nexus and Web.
 */

export class ExecutiveCapabilitiesManifest {
  /**
   * Generates the executive guide formatted in Markdown.
   */
  public static getExecutiveGuide(channel: 'whatsapp' | 'telegram' | 'web' | 'nexus' = 'whatsapp'): string {
    const isWhatsApp = channel === 'whatsapp';
    const bold = (t: string) => isWhatsApp ? `*${t}*` : `**${t}**`;
    const mono = (t: string) => isWhatsApp ? `${t}` : `\`${t}\``;

    return [
      `🏛️ ${bold("HERMES EXECUTIVE SOVEREIGN PLANE — CAPACIDADES PARA EL JEFE")}`,
      `Marco, este es tu catálogo de comando exclusivo como Fundador y Super Admin de Pandora's Growth OS:`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🧠 ${bold("TIER 0: EXECUTIVE INTELLIGENCE & MEMORIA SOBERANA")}`,
      `• ${bold("Daily Briefing:")} Pregúntame ${mono("¿Qué hay hoy?")}, ${mono("pulso de pandoras")} o ${mono("/briefing")} para un resumen de leads, reuniones agendadas, consumo de cómputo y salud de la plataforma.`,
      `• ${bold("Memoria de Directivas:")} Dicta ${mono("Anota esta directiva: [tu instrucción]")}. Se grabará en mi memoria permanente y regirá mis decisiones por encima de cualquier otro prompt.`,
      `• ${bold("Registro Rápido de Contactos:")} Pásame un número, Telegram o email (ej. ${mono("Registra a Carlos 5512345678 como Inversionista")}) y le daré bienvenida VIP personalizada en cuanto escriba.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `🔍 ${bold("TIER 1: READ EVERYTHING (AUDITORÍA CANÓNICA EN TIEMPO REAL)")}`,
      `• ${bold("Inspección de Tenants:")} ${mono("Inspecciona el tenant snarai")} o ${mono("/tenant snarai")}. Revisa licencias, balance de cómputo, W2E y contratos.`,
      `• ${bold("Auditoría de Leads & CRM:")} ${mono("/leads")} o ${mono("Revisa los prospectos")}. Lista los prospectos recientes con sus canales, puntajes y canales de origen.`,
      `• ${bold("Logs de Seguridad e Inmutabilidad:")} ${mono("/logs")} o ${mono("Ver eventos de seguridad")}. Audita la columna vertebral criptográfica de eventos.`,
      `• ${bold("Paridad de Base de Datos:")} ${mono("/schema")} o ${mono("Paridad de base de datos")}. Verifica en vivo que las columnas críticas de NeonDB coincidan al 100%.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `⚙️ ${bold("TIER 2: OPERATIONAL ACTIONS (PLANIFICADOR MULTI-PASO)")}`,
      `Protocolo de seguridad: Formulo el plan, evalúo el riesgo y espero tu confirmación explícita (${mono("confirmo")} / ${mono("cancela")}):`,
      `• ${bold("Recarga de Cómputo:")} ${mono("Recarga 100 créditos a snarai")} o ${mono("/topup snarai 100")}.`,
      `• ${bold("Promoción RBAC:")} ${mono("Promueve a dev@pandoras.finance a ADMIN_OPERATIONS")}.`,
      `• ${bold("Invitaciones Nexus:")} ${mono("Invita a ana@pandoras.finance como ADMIN")}.`,
      `• ${bold("Control de Tenants:")} ${mono("Pausa el tenant snarai")} o ${mono("Activa el tenant snarai")}.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💻 ${bold("TIER 3: CODE OPERATOR & SANDBOX (PATCHES SEGUROS)")}`,
      `• ${bold("Diagnóstico de Errores:")} ${mono("Diagnostica este error: [stack trace]")}. Identifico el archivo, causa raíz y blast radius.`,
      `• ${bold("Generación de Parche:")} Formulo el diff de código, ejecuto verificación en sandbox (${mono("bun x tsc")} y tests).`,
      `• ${bold("Aprobación Humana:")} Te presento el diff validado para tu firma antes de incorporarlo al pipeline de despliegue.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💎 ${bold("TIER 4: FINANCIAL & ON-CHAIN PRE-FLIGHT (ZERO PRIVATE KEYS)")}`,
      `Principio rector: ${bold("Hermes prepara, Marco firma desde su Wallet (0x00c9f7ee...)")}.`,
      `• ${bold("Distribución de Fondos:")} ${mono("Prepara distribución de 5000 USDC para snarai")}. Formulo el payload EIP-712 con nonces y expiración.`,
      `• ${bold("Firma Criptográfica:")} Te entrego el link de firma o QR para tu wallet. Ninguna clave privada vive en Hermes.`,
      `• ${bold("Notarización en IPFS K25:")} Tras tu firma, se ejecuta en la red y se ancla un recibo soberano inmutable con CID en IPFS.`,
      ``,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `💡 ${bold("Para ejecutar cualquier acción:")} Escríbemela en lenguaje natural en este chat. Yo te preparo el plan de inmediato.`
    ].join('\n');
  }

  /**
   * Helper to detect if a message is asking for executive capabilities or help.
   */
  public static isCapabilitiesQuery(text: string): boolean {
    const clean = (text || '').trim().toLowerCase();
    return /(?:qu[eé]\s+(?:puedes\s+hacer|haces|sabes\s+hacer)|cu[aá]les\s+son\s+tus\s+capacidades|qu[eé]\s+puedes\s+hacer\s+por\s+m[ií]|dame\s+(?:tus\s+)?capacidades|ayuda\s+ejecutiva|comandos\s+ejecutivos|men[uú]\s+ejecutivo|qu[eé]\s+puedo\s+hacer\s+(?:con\s+hermes|contigo)|^\/capacidades|^\/ayuda_ejecutiva|^\/help_boss)/i.test(clean);
  }
}
