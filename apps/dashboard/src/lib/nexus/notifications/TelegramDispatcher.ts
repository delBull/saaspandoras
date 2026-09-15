import { db } from '@/db';
import { nexusDeepLinks } from '@/db/schema';
import crypto from 'crypto';

/**
 * Generates an opaque reference ID, stores its hash in the DB, and returns the plaintext reference.
 */
export async function createDeepLinkReference(params: {
  canonicalOrgId: string;
  targetType: string;
  targetId: string;
  createdBy?: string;
  ttlHours?: number;
}): Promise<string> {
  const plaintextReference = crypto.randomBytes(32).toString('hex');
  const referenceHash = crypto.createHash('sha256').update(plaintextReference).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (params.ttlHours || 24));

  await db.insert(nexusDeepLinks).values({
    referenceHash,
    canonicalOrgId: params.canonicalOrgId,
    targetType: params.targetType,
    targetId: params.targetId,
    createdBy: params.createdBy || 'system',
    expiresAt,
  });

  return plaintextReference;
}

/**
 * Dispatch a notification to a specific Telegram Chat ID with a deep-link button.
 */
export async function dispatchTelegramNotification(
  chatId: string,
  message: string,
  deepLinkRef?: string
) {
  const token = process.env.TELEGRAM_TEAM_BOT_TOKEN;
  if (!token) {
    console.warn('[TelegramDispatcher] No TELEGRAM_TEAM_BOT_TOKEN available');
    return;
  }

  let finalMessage = message;
  if (deepLinkRef) {
    const tmaUrl = `https://t.me/nexusPandoras_bot/NexusApp?startapp=${deepLinkRef}`;
    finalMessage += `\n\n[Open in Nexus TMA](${tmaUrl})`;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const payload: any = {
    chat_id: chatId,
    text: finalMessage,
    parse_mode: 'HTML',
  };

  // If there's a deep link, we already appended it to the text. We can also add an inline button.
  if (deepLinkRef) {
    const tmaUrl = `https://t.me/nexusPandoras_bot/NexusApp?startapp=${deepLinkRef}`;
    payload.reply_markup = {
      inline_keyboard: [
        [
          {
            text: 'Open in Nexus TMA',
            url: tmaUrl
          }
        ]
      ]
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[TelegramDispatcher] Failed to send notification:', errorText);
    }
  } catch (error: any) {
    console.error('[TelegramDispatcher] Exception sending notification:', error.message);
  }
}
