/**
 * 🆘 Pandora's Platform OS — Human Handoff Protocol
 * lib/hermes/human-handoff.ts
 */

import { Redis } from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export class HumanHandoffProtocol {
  static async triggerHandoff(opts: {
    projectId: number;
    chatId: string;
    reason: string;
    lastUserMessage: string;
  }): Promise<{ paused: boolean; alertSent: boolean }> {
    const { projectId, chatId, reason, lastUserMessage } = opts;
    const handoffKey = `hermes:handoff:${projectId}:${chatId}`;

    if (redis) {
      await redis.set(handoffKey, JSON.stringify({
        pausedAt: Date.now(),
        reason,
        lastUserMessage
      }), 'EX', 86400); // 24 hours pause
    }

    // Send alert to Discord if configured
    const discordWebhook = process.env.DISCORD_WEBHOOK_PANDORAS_ALERTS;
    let alertSent = false;

    if (discordWebhook) {
      try {
        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🚨 Intervención Humana Requerida en Hermes',
              color: 0xef4444,
              fields: [
                { name: 'Project ID', value: String(projectId), inline: true },
                { name: 'Chat ID', value: chatId, inline: true },
                { name: 'Razón', value: reason, inline: false },
                { name: 'Último Mensaje', value: lastUserMessage, inline: false }
              ],
              timestamp: new Date().toISOString()
            }]
          })
        });
        alertSent = true;
      } catch (err) {
        console.error('[HumanHandoff] Discord alert error:', err);
      }
    }

    return { paused: true, alertSent };
  }

  static async isPaused(projectId: number, chatId: string): Promise<boolean> {
    if (!redis) return false;
    const key = `hermes:handoff:${projectId}:${chatId}`;
    const exists = await redis.exists(key);
    return exists === 1;
  }
}
