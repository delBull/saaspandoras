export const DATA_ROOM_URL = 'https://snarai.aztecaz.xyz/institutional';
export const CHECKOUT_BASE_URL = 'https://dash.pandoras.finance/pay/snarai/fundador';
export const CHECKOUT_ORIGIN = encodeURIComponent('https://snarai.aztecaz.xyz');

export function buildCheckoutUrl(opts?: { quantity?: number; ref?: string }): string {
  const params = new URLSearchParams({ origin: CHECKOUT_ORIGIN });
  if (opts?.quantity && opts.quantity > 1) params.set('quantity', String(opts.quantity));
  if (opts?.ref) params.set('ref', opts.ref);
  return `${CHECKOUT_BASE_URL}?${params.toString()}`;
}

export interface TelegramKeyboard {
  inline_keyboard: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
}

const MAIN_MENU_KB: TelegramKeyboard = {
  inline_keyboard: [
    [{ text: '🏛️ Tesis del Proyecto', callback_data: 'action_thesis' }],
    [{ text: '📊 Fases & Precios', callback_data: 'action_phases' }],
    [{ text: '📑 Data Room', callback_data: 'action_dataroom' }],
    [{ text: '💳 Adquirir Certificado', callback_data: 'action_buy' }],
    [{ text: '🤝 Reunión con Fundadores', callback_data: 'action_reunion' }],
    [{ text: '👤 Mi Posición', callback_data: 'action_position' }]
  ]
};

const BACK_ROW: Array<{ text: string; callback_data?: string; url?: string }> = [
  { text: '◀️ Menú Principal', callback_data: 'action_menu' }
];

export const mainMenuKeyboard = (): TelegramKeyboard => MAIN_MENU_KB;

export const thesisKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '📊 Ver Fases & Precios', callback_data: 'action_phases' }],
    BACK_ROW
  ]
});

export const phasesKeyboard = (opts?: { checkoutUrl?: string }): TelegramKeyboard => ({
  inline_keyboard: [
    [
      ...(opts?.checkoutUrl
        ? [{ text: '💳 Adquirir Títulos', url: opts.checkoutUrl }]
        : [{ text: '💳 Adquirir Títulos', callback_data: 'action_buy' }])
    ],
    [{ text: '📑 Data Room', callback_data: 'action_dataroom' }],
    BACK_ROW
  ]
});

export const dataroomStep1Keyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '📄 Dossier Ejecutivo', callback_data: 'action_dataroom_dossier' }],
    [{ text: '🏛️ Data Room Institucional', callback_data: 'action_dataroom_full' }],
    BACK_ROW
  ]
});

export const dataroomFullKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '🔓 Abrir Data Room Institucional', url: DATA_ROOM_URL }],
    [{ text: '📄 Ver Dossier Ejecutivo', callback_data: 'action_dataroom_dossier' }],
    BACK_ROW
  ]
});

export const buySelectorKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '🇲🇽 SPEI · Pesos MXN', callback_data: 'action_buy_spei' }],
    [{ text: '🌐 Divisa Digital (USDC)', callback_data: 'action_buy_web3' }],
    BACK_ROW
  ]
});

export const buyWeb3Keyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '💳 Ir al Checkout (USDC)', url: buildCheckoutUrl() }],
    [{ text: '🇲🇽 Prefiero SPEI', callback_data: 'action_buy_spei' }],
    BACK_ROW
  ]
});

export const buySpeiKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '💳 Ir al Checkout (SPEI)', url: buildCheckoutUrl() }],
    [{ text: '🌐 Prefiero Web3', callback_data: 'action_buy_web3' }],
    BACK_ROW
  ]
});

export const reunionKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '📅 Sí, quiero agendar', callback_data: 'action_reunion_start' }],
    BACK_ROW
  ]
});

export const reunionConfirmKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '✅ Confirmar mi correo', callback_data: 'action_reunion_email' }],
    BACK_ROW
  ]
});

export const positionKeyboard = (): TelegramKeyboard => ({
  inline_keyboard: [
    [{ text: '💳 Adquirir Certificado', callback_data: 'action_buy' }],
    [{ text: '🤝 Reunión con Fundadores', callback_data: 'action_reunion' }],
    BACK_ROW
  ]
});
