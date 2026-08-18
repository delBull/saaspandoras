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

/**
 * Notificación de firma/aceptación de un firmante al Deal Room (webhook Discord).
 * Mensaje personalizado según el tipo de documento:
 *  - PROPOSAL   → "X aceptó la propuesta"
 *  - CHARTER    → "X firmó el documento fundacional"
 *  - resto      → "X firmó el documento"
 */
export async function sendSignatureAlert(input: {
  roomLabel: string;
  signerName: string;
  email?: string;
  kind?: string;
  online?: boolean;
  enteredIntoForce?: boolean;
}) {
  const { roomLabel, signerName, email, kind, online, enteredIntoForce } = input;
  const getActionText = (k?: string) => {
    switch (k) {
      case "PROPOSAL": return "aceptó la propuesta";
      case "CHARTER": return "firmó el documento fundacional";
      case "NDA": return "firmó el NDA (Acuerdo de Confidencialidad)";
      case "AGREEMENT": return "firmó el acuerdo";
      case "CONTRACT": return "firmó el contrato";
      case "SAFE": return "firmó el SAFE";
      default: return "firmó el documento";
    }
  };
  const actionText = getActionText(kind);
  const fields = [
    { name: "Room", value: roomLabel, inline: true },
    { name: "Firmante", value: `${signerName}${email ? ` · ${email}` : ""}`, inline: true },
    ...(online ? [{ name: "Modo", value: "Online (openSign)", inline: true }] : []),
    ...(enteredIntoForce
      ? [{ name: "Acuerdo", value: "Todos firmaron · entró en vigor", inline: false }]
      : []),
  ];
  return postDiscord("", [
    {
      title: `✅ ${signerName} ${actionText} — ${roomLabel}`,
      color: enteredIntoForce ? COLORS.GREEN : COLORS.AMBER,
      fields,
      footer: { text: "Pandora's Nexus · Deal Room · Firma on-chain verificada (EIP-191)" },
      timestamp: new Date().toISOString(),
    },
  ]);
}

/**
 * Notificación de que se ha liberado automáticamente un documento encadenado.
 */
export async function sendDealRoomChainedReleaseAlert(input: {
  roomLabel: string;
  previousRoomLabel: string;
}) {
  const { roomLabel, previousRoomLabel } = input;
  return postDiscord("", [
    {
      title: `📬 Documento Encadenado Liberado — ${roomLabel}`,
      description: `El documento fue liberado automáticamente tras la firma completa de: **${previousRoomLabel}**. Se ha notificado por correo a los firmantes.`,
      color: COLORS.GREEN,
      fields: [
        { name: "Documento Previo", value: previousRoomLabel, inline: false },
        { name: "Nuevo Documento (Liberado)", value: roomLabel, inline: false },
      ],
      footer: { text: "Pandora's Nexus · Deal Room Chaining" },
      timestamp: new Date().toISOString(),
    },
  ]);
}

/**
 * Notificación de que un Deal Room entró en vigor pero no hay documento de seguimiento.
 */
export async function sendDealRoomActionRequiredAlert(input: {
  roomLabel: string;
}) {
  const { roomLabel } = input;
  return postDiscord("", [
    {
      title: `⚠️ Acción Requerida — ${roomLabel}`,
      description: `El Deal Room ha sido firmado por todas las partes, pero **no hay documento de seguimiento configurado**.`,
      color: COLORS.RED,
      fields: [
        { name: "Deal Room", value: roomLabel, inline: true },
        { name: "Estado", value: "SIGNED / EXECUTED", inline: true },
        { name: "Acción", value: "Revisar y continuar el proceso", inline: false },
      ],
      footer: { text: "Pandora's Nexus · Workflows" },
      timestamp: new Date().toISOString(),
    },
  ]);
}

/**
 * NDA firmado (o bypass automático) — alerta a Discord.
 */
export async function sendNdaSignedAlert(input: {
  roomLabel: string;
  signerName: string;
  email: string;
  wallet?: string;
  ndaVersion?: string;
  bypassed?: boolean; // true = already signed in another deal
}) {
  const { roomLabel, signerName, email, wallet, ndaVersion = "v1.0", bypassed } = input;
  const title = bypassed
    ? `⚡ NDA Auto-aprobado (Bypass) — ${roomLabel}`
    : `🔐 NDA Firmado — ${roomLabel}`;
  const description = bypassed
    ? `${signerName} ya tenía el NDA ${ndaVersion} firmado en un deal anterior. Se aplicó bypass automático.`
    : `${signerName} firmó el Acuerdo de Confidencialidad Pandora's Ecosystem ${ndaVersion} en el Deal Room.`;

  return postDiscord("", [
    {
      title,
      description,
      color: bypassed ? COLORS.PURPLE : COLORS.GREEN,
      fields: [
        { name: "Room", value: roomLabel, inline: true },
        { name: "Firmante", value: `${signerName} · ${email}`, inline: true },
        ...(wallet ? [{ name: "Wallet", value: wallet, inline: false }] : []),
        { name: "Versión NDA", value: ndaVersion, inline: true },
        { name: "Modo", value: bypassed ? "Bypass Global" : "Firma On-Chain", inline: true },
      ],
      footer: { text: "Pandora's Nexus · NDA Engine · EIP-191" },
      timestamp: new Date().toISOString(),
    },
  ]);
}
