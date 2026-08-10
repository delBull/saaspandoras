const WEBHOOK =
  process.env.DISCORD_WEBHOOK_URL ||
  process.env.DISCORD_WEBHOOK_ALERTS ||
  process.env.PANDORAS_ALERTS_WEBHOOK ||
  "";

const COLORS = {
  AMBER: 16761344,
  GREEN: 5763719,
  PURPLE: 10181046,
  RED: 15548997,
};

async function postDiscord(content: string, embeds: any[]) {
  if (!WEBHOOK) {
    console.warn("⚠️ [Nexus Deals] Discord webhook (DISCORD_WEBHOOK_URL/ALERTS) missing");
    return false;
  }
  try {
    const res = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Pandoras Nexus · Deal Room",
        avatar_url: "https://pandoras.finance/favicon.ico",
        content,
        embeds,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("❌ [Nexus Deals] Discord webhook error:", errText);
      return false;
    }
    return true;
  } catch (e) {
    console.error("❌ [Nexus Deals] Discord fetch error:", e);
    return false;
  }
}

/**
 * Desbloqueo del Deal Room admin (patrón BooksAccessGate):
 * genera embed con el link único de acceso al canal privado de Discord.
 */
export async function sendDealRoomUnlockEmbed(input: {
  email: string;
  link: string;
  requestedAt: string;
}) {
  const { email, link, requestedAt } = input;
  return postDiscord("", [
    {
      title: "🔓 Acceso al Deal Room — Token de Desbloqueo Firmado",
      description: "Se solicitó acceso de edición al Deal Room institucional (Transaction Rooms · Nivel 2).",
      color: COLORS.AMBER,
      fields: [
        { name: "👤 Solicitante", value: email, inline: true },
        { name: "⏱️ Validez", value: "2 Horas (HMAC SHA-256)", inline: true },
        { name: "🔗 Enlace Único de Acceso", value: `[👉 Abrir Deal Room](${link})` },
      ],
      footer: { text: "Pandoras Group Holdings · Protocolo de Seguridad Corporativa" },
      timestamp: requestedAt,
    },
  ]);
}

/**
 * Alertas de auditoría del Deal Room a Discord.
 */
export async function sendDealRoomAlert(input: {
  roomLabel: string;
  action: string;
  actor: string;
  detail?: string;
}) {
  const { roomLabel, action, actor, detail } = input;
  return postDiscord("", [
    {
      title: `📄 ${action} — ${roomLabel}`,
      color: COLORS.PURPLE,
      fields: [
        { name: "Room", value: roomLabel, inline: true },
        { name: "Actor", value: actor, inline: true },
        ...(detail ? [{ name: "Detalle", value: detail, inline: false }] : []),
      ],
      footer: { text: "Pandora's Nexus · Deal Room Audit" },
      timestamp: new Date().toISOString(),
    },
  ]);
}
