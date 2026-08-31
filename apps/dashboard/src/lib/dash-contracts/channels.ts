/**
 * 📦 Dash Contracts — Hermes Channels DTOs
 * src/lib/dash-contracts/channels.ts
 */

export interface MaskedChannelsConfigDTO {
  telegramConfigured: boolean;
  telegramBotTokenMasked?: string;
  whatsappConfigured: boolean;
  whatsappTokenMasked?: string;
  whatsappPhoneId?: string;
  discordConfigured?: boolean;
  discordWebhookUrlMasked?: string;
  slackConfigured?: boolean;
  slackWebhookUrlMasked?: string;
}

export interface SaveChannelConfigRequestDTO {
  channel: 'telegram' | 'whatsapp' | 'discord' | 'slack';
  config: {
    botToken?: string;
    token?: string;
    phoneNumberId?: string;
    webhookUrl?: string;
  };
}
