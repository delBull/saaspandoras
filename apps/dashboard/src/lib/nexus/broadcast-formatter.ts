/**
 * 📢 Nexus Broadcast Formatters
 * apps/dashboard/src/lib/nexus/broadcast-formatter.ts
 */

export function formatBroadcastWhatsAppMessage(
  broadcast: {
    title: string;
    content: string;
    type: string;
    targetType: string;
    authorName: string;
    authorRole?: string | null;
  },
  recipientName: string
): string {
  const typeLabels: Record<string, string> = {
    ANNOUNCEMENT: '📢 ANUNCIO OFICIAL',
    ALERT: '⚠️ AVISO IMPORTANTE',
    UPDATE: '💡 ACTUALIZACIÓN',
    URGENT: '🚨 ALERTA URGENTE',
  };

  const badge = typeLabels[broadcast.type] || '📢 COMUNICADO';
  const authorBadge = broadcast.authorRole
    ? `${broadcast.authorName} (${broadcast.authorRole})`
    : broadcast.authorName;

  // Length guard for WhatsApp Cloud API (4096 char limit)
  let safeContent = broadcast.content;
  if (safeContent.length > 3000) {
    safeContent = safeContent.slice(0, 3000) + '\n\n...[Ver mensaje completo en Nexus]';
  }

  return `*🔔 NEXUS OPERATIONS HUB · ${badge}*

Hola *${recipientName}*,

*${broadcast.title}*

${safeContent}

━━━━━━━━━━━━━━━━━━━━
👤 *De parte de:* ${authorBadge}
🌐 *Acceso Nexus:* https://nexus.pandoras.finance
_Notificación oficial emitida desde Nexus Operations Hub_`;
}
