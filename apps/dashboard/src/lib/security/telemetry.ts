export type RiskLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export class TelemetryService {
  private static getBotConfig() {
    const token = process.env.TELEGRAM_SECURITY_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_SECURITY_CHAT_ID;
    return { token, chatId };
  }

  private static getRiskEmoji(level: RiskLevel): string {
    switch (level) {
      case 'INFO': return 'ℹ️';
      case 'LOW': return '🟡';
      case 'MEDIUM': return '🟠';
      case 'HIGH': return '🔴';
      case 'CRITICAL': return '🚨';
      default: return '🔔';
    }
  }

  /**
   * Fires a non-blocking asynchronous alert to the Telegram Security Bot.
   */
  static sendAlert(
    title: string,
    message: string,
    riskLevel: RiskLevel = 'INFO',
    metadata?: Record<string, any>
  ): void {
    // 1. Fire-and-forget: we do not await this promise so we don't block the caller.
    this.executePush(title, message, riskLevel, metadata).catch(err => {
      // 2. Silently fail in production, or log to console. We do not want telemetry to crash the app.
      console.error("[TelemetryService] Failed to send alert:", err);
    });
  }

  private static async executePush(
    title: string,
    message: string,
    riskLevel: RiskLevel,
    metadata?: Record<string, any>
  ): Promise<void> {
    const { token, chatId } = this.getBotConfig();
    
    // If not configured, just log to console
    if (!token || !chatId) {
      console.log(`[Telemetry Mock - ${riskLevel}] ${title}: ${message}`);
      return;
    }

    const emoji = this.getRiskEmoji(riskLevel);

    const env = process.env.NODE_ENV || 'production';
    const sourceApp = process.env.NEXT_PUBLIC_APP_NAME || 'Pandoras Growth OS';

    let formattedText = `${emoji} <b>[${riskLevel}] Security & Ops Alert</b>\n`;
    formattedText += `<b>Source:</b> ${sourceApp} (${env})\n`;
    formattedText += `<b>Event:</b> ${title}\n`;
    formattedText += `<b>Details:</b> ${message}\n`;

    if (metadata && Object.keys(metadata).length > 0) {
      formattedText += `\n<b>Context:</b>\n<code>${JSON.stringify(metadata, null, 2)}</code>`;
    }

    // Add timestamp
    const time = new Date().toISOString();
    formattedText += `\n\n_🕒 ${time}_`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Telegram API responded with ${response.status}: ${errorText}`);
    }
  }
}
