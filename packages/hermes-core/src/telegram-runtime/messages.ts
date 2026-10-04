import { LivePhaseData } from './live-phases';
import { KnowledgePack } from '../types';

const S_NARAI_TAGLINE =
  "Inversión Fraccionada &amp; Certificados de Participación en la Zona Dorada de Bucerías, Riviera Nayarit.";

// ─────────────────────────────────────────────────────────────────
// Helpers — Telegram HTML formatting
// ─────────────────────────────────────────────────────────────────
const b = (t: string) => `<b>${t}</b>`;
const iv = (t: string) => `<i>${t}</i>`;

// ─────────────────────────────────────────────────────────────────
// Welcome
// ─────────────────────────────────────────────────────────────────
export const welcomeMessage = (firstName?: string): string => {
  const name = firstName ? `, ${firstName}` : '';
  return [
    `🏛️ ${b("Hermes Patrimonial · S'Narai")}`,
    '',
    `Bienvenido${name} a S'Narai.`,
    '',
    S_NARAI_TAGLINE,
    '',
    `Soy ${b('Hermes')}, tu gestor patrimonial digital. Estoy aquí para acompañarte en cada decisión — desde entender la tesis del proyecto hasta asegurar tu posición como Fundador.`,
    '',
    `✨ ${b('¿Qué deseas explorar?')}`
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Thesis
// ─────────────────────────────────────────────────────────────────
export const thesisMessage = (pack: KnowledgePack): string => {
  return [
    `🏛️ ${b("Tesis del Proyecto · S'Narai")}`,
    '',
    pack.publicKnowledge.summary,
    '',
    pack.salesPitch,
    '',
    `La operación corre bajo ${b('Aztecas Hub S.A.P.I. de C.V.')} — más de 15 años de Aztecas Real Estate en Riviera Nayarit.`,
    '',
    iv('Puedes auditar la estructura completa en el Data Room institucional.')
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Phases — fully dynamic from live data
// ─────────────────────────────────────────────────────────────────
export const phasesMessage = (data: LivePhaseData, pack: KnowledgePack): string => {
  if (!data.phases.length) {
    return [
      `📊 ${b("Fases &amp; Precios · S'Narai")}`,
      '',
      'Los datos de fases se están sincronizando. Inténtalo en un momento.'
    ].join('\n');
  }

  const currentPrice = data.activePhase?.tokenPrice ?? pack.publicKnowledge.pricingDetails?.tokenPriceUsd ?? 50;

  const lines: string[] = [
    `📊 ${b("Fases &amp; Precios · S'Narai")}`,
    '',
    `Precio actual: ${b(`$${currentPrice} USD`)} por Título Digital`,
    ''
  ];

  for (const phase of data.phases) {
    const emoji =
      phase.status.status === 'active'   ? '🟢' :
      phase.status.status === 'sold_out' ? '🔴' :
      phase.status.status === 'upcoming' ? '🔵' :
      phase.status.status === 'paused'   ? '🟡' : '⚫️';

    const remaining = phase.remainingTokens != null
      ? `${phase.remainingTokens.toLocaleString()} disponibles`
      : `${phase.tokenAllocation.toLocaleString()} totales`;

    lines.push(
      `${emoji} ${b(phase.name)} — ${phase.status.statusLabel}`,
      `   💵 $${phase.tokenPrice > 0 ? `${phase.tokenPrice} USD / título` : 'Por definir'}`,
      `   📦 ${remaining}`,
      `   🎯 Progreso: ${phase.status.percent.toFixed(1)}%`,
      ''
    );
  }

  lines.push(
    b('¿Por qué entrar en Etapa Fundadores?'),
    '• Precio más bajo posible ($50 USD) — sube a $75 al 50% y a $100 al 100% de la fase.',
    '• La apreciación entre fases es independiente de los rendimientos por operación de rentas.',
    '• Esta etapa equivale a inversión institucional — normalmente no disponible al público general.',
    '• Obra estimada: 14-18 meses una vez recaudado el capital de Fase 1.',
    '',
    iv('Datos en tiempo real desde Pandoras Growth OS.')
  );

  return lines.join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Data Room
// ─────────────────────────────────────────────────────────────────
export const dataroomStep1Message = (): string => {
  return [
    `📑 ${b("Data Room · S'Narai")}`,
    '',
    '¿Qué prefieres revisar primero?',
    '',
    `📄 ${b('Dossier Ejecutivo')} — resumen patrimonial completo.`,
    `🏛️ ${b('Data Room Institucional')} — documentación legal, financiera y operativa auditada.`
  ].join('\n');
};

export const dataroomDossierMessage = (pack: KnowledgePack, liveUnits?: number): string => {
  const pricing = pack.publicKnowledge.pricingDetails || {};
  const faqs = pack.publicKnowledge.faqs || [];
  const unitsAvailable = liveUnits ?? pricing.totalUnits ?? 30000;

  const faqLines = faqs
    .slice(0, 3)
    .map((f) => `${b('P:')} ${f.question}\n${b('R:')} ${f.answer}`);

  return [
    `📄 ${b("Dossier Ejecutivo · S'Narai")}`,
    '',
    pack.publicKnowledge.summary,
    '',
    `💰 ${b('Precio:')} $${pricing.tokenPriceUsd ?? 50} USD por Título`,
    `📦 ${b('Disponibles:')} ${unitsAvailable.toLocaleString()} de ${pricing.totalUnits ?? 30000} totales`,
    `💱 ${b('Métodos:')} ${(pricing.acceptedCurrencies ?? ['USDC', 'MXN SPEI']).join(' · ')}`,
    '',
    ...faqLines,
    '',
    iv('Para documentación completa y auditada, accede al Data Room institucional.')
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Buy
// ─────────────────────────────────────────────────────────────────
export const buySelectorMessage = (pack: KnowledgePack): string => {
  const price = pack.publicKnowledge.pricingDetails?.tokenPriceUsd ?? 50;
  return [
    `💳 ${b("Adquirir Títulos · S'Narai")}`,
    '',
    `Etapa Fundadores: ${b(`$${price} USD`)} por Título Digital de Participación.`,
    '',
    `🌐 ${b('Divisa Digital (USDC)')}`,
    '  · Registro institucional inmediato.',
    '  · Social login (Google/Email) o cuenta digital.',
    '',
    `🇲🇽 ${b('SPEI · Pesos MXN')}`,
    '  · Transferencia bancaria en pesos.',
    '  · Contrato digital + reserva Fast Lane (7 días).',
    '',
    'Ambas opciones otorgan los mismos derechos patrimoniales.'
  ].join('\n');
};

export const buyWeb3Message = (): string => {
  return [
    `🌐 ${b("Checkout Digital · S'Narai")}`,
    '',
    'Estás a un paso de tu Certificado de Participación.',
    '',
    `1. Toca ${b('Ir al Checkout')} — portal de pago seguro.`,
    `2. Entra con ${b('social login (Google/Email)')} o tu cuenta digital.`,
    `3. Confirma el pago en ${b('USDC')}.`,
    '',
    'Tu registro queda confirmado al instante. Tu Certificado aparece en tu portal.'
  ].join('\n');
};

export const buySpeiMessage = (): string => {
  return [
    `🇲🇽 ${b("Checkout SPEI · S'Narai")}`,
    '',
    'Adquiere tus Títulos en pesos mexicanos, sin divisas digitales.',
    '',
    `1. Toca ${b('Ir al Checkout (SPEI)')}.`,
    `2. ${b('Social login (Google/Email)')} para continuar.`,
    '3. Sigue las instrucciones de transferencia y firma tu contrato digital.',
    '',
    'Tu reserva queda protegida (Soft-Lock 7 días) y tu posición asegurada.'
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Reunion / Handoff
// ─────────────────────────────────────────────────────────────────
export const reunionMessage = (): string => {
  return [
    `🤝 ${b('Sesión Patrimonial con Fundadores')}`,
    '',
    `Una sesión privada donde los fundadores de S'Narai resuelven a fondo tus dudas — estructura del proyecto, marco jurídico y tu plan de adquisición personalizado.`,
    '',
    `📅 ${b('Selecciona tu fecha y hora en la agenda oficial.')}`,
    '',
    `O si prefieres, un asesor puede atenderte ${b('ahora mismo')} por este canal.`
  ].join('\n');
};

export const advisorNowMessage = (): string => {
  return [
    `💬 ${b('Conectando con un asesor')}`,
    '',
    `Entendido. Un asesor del equipo S'Narai tomará esta conversación y te contactará ${b('por este mismo canal')} a la brevedad.`,
    '',
    'Mientras tanto, aquí estoy para cualquier duda adicional.'
  ].join('\n');
};

export const reunionAskEmailMessage = (): string => {
  return [
    `📅 ${b('Agenda tu sesión patrimonial')}`,
    '',
    `Para coordinar la sesión privada, escríbeme tu ${b('correo electrónico')} y lo registramos de inmediato.`
  ].join('\n');
};

export const reunionRegisteredMessage = (email?: string): string => {
  return [
    `✅ ${b('Solicitud registrada')}`,
    '',
    email ? `Correo ${b(email)} registrado.` : 'Tu solicitud quedó registrada.',
    'Un asesor te contactará para confirmar la sesión patrimonial.'
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Position
// ─────────────────────────────────────────────────────────────────
export const positionMessage = (): string => {
  return [
    `👤 ${b("Tu Posición · S'Narai")}`,
    '',
    `Consulta tus Títulos Digitales, Certificado de Participación y distribuciones en el portal con la misma cuenta que usaste al adquirir.`,
    '',
    `Si aún no tienes posición, puedes entrar a la Etapa Fundadores desde ${b('$50 USD')}.`
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────
// Export helpers
// ─────────────────────────────────────────────────────────────────
export { b as bold, iv as italic };

