import { LivePhaseData } from './live-phases';
import { KnowledgePack } from '../types';

const S_NARAI_TAGLINE =
  'Boutique residencial de lujo tokenizado en la Zona Dorada de Bucerías, Riviera Nayarit.';

export const welcomeMessage = (firstName?: string): string => {
  const name = firstName ? `, ${firstName}` : '';
  return [
    `🏛️ *Hermes Patrimonial · S'Narai*`,
    '',
    `Bienvenido${name} a S'Narai.`,
    '',
    S_NARAI_TAGLINE,
    '',
    'Soy *Hermes*, tu gestor patrimonial digital. Te acompaño en cada paso: desde conocer la tesis del proyecto hasta adquirir tus Títulos Digitales.',
    '',
    '✨ *¿Qué deseas explorar?*'
  ].join('\n');
};

export const thesisMessage = (pack: KnowledgePack): string => {
  return [
    `🏛️ *Tesis del Proyecto · S'Narai*`,
    '',
    pack.publicKnowledge.summary,
    '',
    pack.salesPitch,
    '',
    'La operación corre bajo la titularidad registral inalienable de *MXHUB Ecosistema Blockchain S.A. de C.V.* (Titular registral de PANDORAS™ en IMPI Clases 36 y 42).',
    '',
    'Puedes auditar la estructura completa en nuestro Data Room.'
  ].join('\n');
};

export const phasesMessage = (data: LivePhaseData, pack: KnowledgePack): string => {
  if (!data.phases.length) {
    return [
      `📊 *Fases & Precios · S'Narai*`,
      '',
      'Las fases se están sincronizando desde la cadena. Inténtalo en un momento.'
    ].join('\n');
  }

  const lines: string[] = [
    `📊 *Fases & Precios · S'Narai*`,
    '',
    `Precio por Título Digital: *$${pack.publicKnowledge.pricingDetails?.tokenPriceUsd ?? data.activePhase?.tokenPrice ?? '—'} USD*`,
    `Unidades totales: ${pack.publicKnowledge.pricingDetails?.totalUnits ?? 30000}`,
    ''
  ];

  for (const phase of data.phases) {
    const emoji =
      phase.status.status === 'active' ? '🟢' :
      phase.status.status === 'sold_out' ? '🔴' :
      phase.status.status === 'upcoming' ? '🔵' :
      phase.status.status === 'paused' ? '🟡' : '⚫️';

    const line = [
      `${emoji} *${phase.name}* — ${phase.status.statusLabel}`,
      `   💵 ${phase.tokenPrice > 0 ? `$${phase.tokenPrice} USD / título` : 'Precio por definir'}`,
      `   📈 ${phase.tokenAllocation.toLocaleString()} títulos`,
      `   🎯 Progreso: ${phase.status.percent.toFixed(1)}%`
    ].join('\n');

    lines.push(line, '');
  }

  lines.push(
    'Las fases posteriores a la activa se liberan de forma secuencial conforme la oferta avanza.',
    '',
    '_Datos en vivo desde la cadena (on-chain)._'
  );

  return lines.join('\n');
};

export const dataroomStep1Message = (): string => {
  return [
    `📑 *Data Room · S'Narai*`,
    '',
    'Te mostraré la documentación que respalda el proyecto. ¿Qué prefieres revisar primero?',
    '',
    '• *Dossier Ejecutivo* — resumen patrimonial en un mensaje.',
    '• *Data Room Institucional* — documentación completa y auditada.'
  ].join('\n');
};

export const dataroomDossierMessage = (pack: KnowledgePack): string => {
  const pricing = pack.publicKnowledge.pricingDetails || {};
  const faqs = pack.publicKnowledge.faqs || [];
  const faqLines = faqs
    .slice(0, 3)
    .map((f) => `*Q:* ${f.question}\n*A:* ${f.answer}`);

  return [
    `📄 *Dossier Ejecutivo · S'Narai*`,
    '',
    pack.publicKnowledge.summary,
    '',
    `💰 *Precio:* $${pricing.tokenPriceUsd ?? 50} USD / Título`,
    `📈 *Mínimo:* ${pricing.minPurchaseTokens ?? 1} título(s)`,
    `🏗️ *Unidades:* ${pricing.totalUnits ?? 30000}`,
    `💱 *Pagos:* ${(pricing.acceptedCurrencies ?? ['USDC']).join(', ')}`,
    '',
    ...faqLines,
    '',
    'Para la documentación completa y auditada:'
  ].join('\n');
};

export const buySelectorMessage = (pack: KnowledgePack): string => {
  const price = pack.publicKnowledge.pricingDetails?.tokenPriceUsd ?? 50;
  return [
    `💳 *Adquirir Títulos · S'Narai*`,
    '',
    `La Fase Fundadores está en *$${price} USD por Título Digital*.`,
    '',
    'Elige tu método de pago:',
    '',
    `🌐 *Web3 (USDC/USDT)*`,
    '· Registro on-chain inmediato y transparente.',
    '· Entras con social login (Google/Email) o tu wallet.',
    '· Ideal si ya manejas criptomonedas.',
    '',
    `🇲🇽 *SPEI (Pesos MXN)*`,
    '· Pagas por transferencia bancaria en pesos.',
    '· Contrato digital firmado y reserva Fast Lane.',
    '· Ideal si no manejas criptomonedas.',
    '',
    'Ambos métodos reciben tu Título Digital con los mismos derechos.'
  ].join('\n');
};

export const buyWeb3Message = (): string => {
  return [
    `🌐 *Checkout Web3 · S'Narai*`,
    '',
    'Estás a un paso de tu Título Digital.',
    '',
    '1. Toca *Ir al Checkout* (se abre el portal de pago seguro).',
    '2. Entra con *social login (Google/Email)* o conecta tu wallet.',
    '3. Confirma el pago en *USDC/USDT*.',
    '',
    'Tu registro quedará on-chain al instante y tu Título Digital aparecerá en tu posición.'
  ].join('\n');
};

export const buySpeiMessage = (): string => {
  return [
    `🇲🇽 *Checkout SPEI · S'Narai*`,
    '',
    'Paga tus Títulos Digitales en pesos mexicanos, sin criptomonedas.',
    '',
    '1. Toca *Ir al Checkout (SPEI)*.',
    '2. En la pasarela elige *"Métodos tradicionales"*.',
    '3. Completa tu *social login (Google/Email)* para continuar.',
    '4. Sigue las instrucciones de transferencia SPEI y firma tu contrato digital.',
    '',
    'Tu reserva queda protegida y tu posición asegurada.'
  ].join('\n');
};

export const reunionMessage = (): string => {
  return [
    `🤝 *Reunión con Fundadores*`,
    '',
    'Te ofrecemos una sesión privada de patrimonio con los fundadores de S\'Narai para resolver a fondo cualquier duda sobre la tokenización, la estructura legal y tu plan de inversión.',
    '',
    '¿Quieres agendarla?'
  ].join('\n');
};

export const reunionAskEmailMessage = (): string => {
  return [
    `📅 *Agenda tu reunión*`,
    '',
    'Perfecto. Para coordinar la sesión privada necesito tu *correo electrónico*.',
    '',
    'Escríbelo aquí y lo registramos de inmediato.'
  ].join('\n');
};

export const reunionRegisteredMessage = (email?: string): string => {
  return [
    '✅ *Solicitud registrada*',
    '',
    email ? `Tu correo *${email}* quedó registrado.` : 'Tu solicitud quedó registrada.',
    'Un asesor de los fundadores te contactará para coordinar la sesión privada de patrimonio.',
    '',
    'Mientras tanto, puedes revisar el *Data Room* o adelantar tu *Posición*.'
  ].join('\n');
};

export const positionMessage = (): string => {
  return [
    `👤 *Tu Posición · S'Narai*`,
    '',
    'Para consultar tus Títulos Digitales y distribuciones, entra al portal con la misma cuenta (email/wallet) que usaste al adquirir.',
    '',
    'Si aún no tienes posición, puedes adquirir en la Fase Fundadores.'
  ].join('\n');
};
