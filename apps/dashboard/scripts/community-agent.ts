/**
 * 🗣️ Community Agent CLI — habla con Hermes por el puente A2A firmado.
 *
 * Lo usa el Orca Bot "S'Narai Manager" desde su propia carpeta. No necesita
 * credenciales de la plataforma: sólo su llave privada y el secreto del puente.
 *
 *   community-agent report
 *   community-agent propose --channel=s-narai-preguntas --text="…" [--image=https://…]
 *   community-agent propose --file=posts.json --intent="Respuestas a dudas de cesión"
 *   community-agent read [--channel=s-narai-preguntas] [--limit=50] [--analyze=both]
 *
 * Variables:
 *   COMMUNITY_AGENT_PRIVATE_KEY  llave del agente (0x…)
 *   COMMUNITY_A2A_HMAC_SECRET    secreto dedicado del agente de comunidad
 *   HERMES_A2A_URL               por defecto https://dash.pandoras.finance/api/v1/a2a/messages
 *   COMMUNITY_ORG / COMMUNITY_PROJECT_ID   por defecto snarai / 17
 *
 * Lectura (opcional, sólo si existe el bot lector):
 *   DISCORD_READER_TOKEN   token del bot de SÓLO LECTURA (nunca el de publicación)
 *   DISCORD_GUILD_ID       servidor a leer
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { ethers } from 'ethers';
import {
  computePayloadCanonicalHash,
  computeHmac,
  buildTransportSignature,
} from '../src/lib/a2a/client-signing';
import {
  analyzeModeration,
  buildCommunityHealth,
  type CommunityMessage,
} from '../../../packages/hermes-core/src/community/community-insights';
import { resolveChannelPrefix } from '../../../packages/hermes-core/src/community/channel-prefixes';

/**
 * Carga el `.env` de la carpeta del bot.
 *
 * El binario es independiente: no hereda el entorno del repo (donde vive la base
 * de datos y la KEK). Lee solo su propio archivo, junto al ejecutable.
 */
function loadBotEnv(): void {
  const candidates = [
    process.env.COMMUNITY_ENV_FILE,
    path.join(process.cwd(), '.env'),
    path.join(path.dirname(process.execPath), '.env'),
  ].filter(Boolean) as string[];

  for (const file of candidates) {
    try {
      if (!fs.existsSync(file)) continue;
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
        if (!match) continue;
        const key = match[1]!;
        if (process.env[key]) continue;
        process.env[key] = (match[2] || '').replace(/^["']|["']$/g, '').trim();
      }
      return;
    } catch {
      // sigue con el siguiente candidato
    }
  }
}

loadBotEnv();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

const SECRET = process.env.COMMUNITY_A2A_HMAC_SECRET;
const PRIVATE_KEY = process.env.COMMUNITY_AGENT_PRIVATE_KEY;
const ENDPOINT = process.env.HERMES_A2A_URL || 'https://dash.pandoras.finance/api/v1/a2a/messages';
const ORG = process.env.COMMUNITY_ORG || 'snarai';
const PROJECT_ID = Number(process.env.COMMUNITY_PROJECT_ID || 17);

const DISCORD_API = 'https://discord.com/api/v10';

async function send(type: 'capability.request', payload: Record<string, unknown>) {
  if (!SECRET || !PRIVATE_KEY) {
    console.error('Faltan COMMUNITY_AGENT_PRIVATE_KEY o COMMUNITY_A2A_HMAC_SECRET (fail-closed).');
    process.exit(1);
  }

  const wallet = new ethers.Wallet(PRIVATE_KEY);
  const now = Date.now();
  const message: any = {
    protocol: 'pandoras-a2a',
    version: '1.1',
    messageId: `msg_community_${now}_${crypto.randomBytes(3).toString('hex')}`,
    correlationId: `corr_community_${now}`,
    from: 'community',
    to: 'hermes',
    tenantId: ORG,
    type,
    createdAt: new Date(now).toISOString(),
    nonce: `nonce_${now}_${crypto.randomBytes(8).toString('hex')}`,
    payload,
  };

  const canonicalHash = computePayloadCanonicalHash(message);
  const hmac = computeHmac(canonicalHash, SECRET as string);
  const signature = await wallet.signMessage(canonicalHash);

  message.security = { signature, signatureScheme: 'EIP191', hmac };

  const body = JSON.stringify(message);
  const timestamp = Math.floor(now / 1000);
  const transport = buildTransportSignature(timestamp, body, SECRET as string);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hermes-timestamp': String(timestamp),
      'x-hermes-signature': transport,
    },
    body,
  });

  const json = await res.json().catch(() => ({}));
  console.log(JSON.stringify({ httpStatus: res.status, ...json }, null, 2));
  if (!res.ok) process.exit(2);
}

// ─── Lectura (bot de sólo lectura) ──────────────────────────────────────────

async function discordGet(pathname: string, token: string): Promise<any> {
  const res = await fetch(`${DISCORD_API}${pathname}`, {
    headers: { Authorization: `Bot ${token}` },
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Discord GET ${pathname} → ${res.status} ${detail.slice(0, 120)}`);
  }
  return res.json();
}

/**
 * Lista blanca de canales del tenant: `<prefijo>-*` públicos (nunca la categoría
 * privada de miembros). El prefijo se puede forzar con `COMMUNITY_CHANNEL_PREFIX`
 * o `--prefix=`, y por defecto sale del tenant (ADR-020 §2.5).
 */
async function resolveReadableChannels(token: string, guildId: string, prefix: string): Promise<Map<string, string>> {
  const channels: any[] = await discordGet(`/guilds/${guildId}/channels`, token);
  const privateCategory = channels.find((c) => c.type === 4 && /MIEMBROS/i.test(String(c.name)))?.id;

  const readable = new Map<string, string>();
  for (const channel of channels) {
    if (channel.type !== 0) continue;
    if (privateCategory && channel.parent_id === privateCategory) continue;
    const name = String(channel.name || '');
    if (!new RegExp(`^${prefix}-[a-z0-9-]+$`).test(name)) continue;
    readable.set(name, channel.id);
  }
  return readable;
}

async function readCommand() {
  const token = process.env.DISCORD_READER_TOKEN;

  if (!token) {
    console.error('Falta DISCORD_READER_TOKEN (token del bot de SÓLO LECTURA). No se usa el token de publicación.');
    process.exit(1);
  }

  // Servidor: `--guild` / `DISCORD_GUILD_ID`; si no, el único servidor visible.
  // Nunca se inventa un id.
  let guildId = arg('guild') || process.env.DISCORD_GUILD_ID || '';
  if (!guildId) {
    const guilds: Array<{ id: string; name: string }> = await discordGet('/users/@me/guilds', token);
    if (guilds.length === 1) {
      guildId = guilds[0]!.id;
    } else {
      console.error(
        `El bot lector ve ${guilds.length} servidores; indica cuál con --guild=<id>: ` +
          guilds.map((g) => `${g.name}=${g.id}`).join(', '),
      );
      process.exit(1);
    }
  }

  const limit = Math.min(Math.max(Number(arg('limit') || 50), 1), 100);
  const days = Number(arg('days') || 0);
  const analyze = (arg('analyze') || 'both') as 'health' | 'moderation' | 'both';

  const prefix = (arg('prefix') || process.env.COMMUNITY_CHANNEL_PREFIX || resolveChannelPrefix(ORG) || '').toLowerCase();
  if (!prefix) {
    console.error('No se pudo derivar el prefijo de canales del tenant. Usa --prefix=<prefijo>.');
    process.exit(1);
  }

  const readable = await resolveReadableChannels(token, guildId, prefix);
  if (readable.size === 0) {
    console.error(`El bot lector no ve ningún canal ${prefix}-*. Revisa permisos (Ver canales + Leer historial).`);
    process.exit(1);
  }

  const requested = (arg('channel') || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const channels = requested.length > 0 ? new Map<string, string>() : readable;
  if (requested.length > 0) {
    for (const name of requested) {
      if (/\*/i.test(name)) {
        console.error('El comodín no está permitido: indica canales concretos de la lista blanca.');
        process.exit(1);
      }
      const id = readable.get(name);
      if (!id) {
        console.error(`Canal no permitido o inexistente: ${name}. Permitidos: ${[...readable.keys()].join(', ')}`);
        process.exit(1);
      }
      channels.set(name, id);
    }
  }

  const since = days > 0 ? Date.now() - days * 24 * 60 * 60 * 1000 : null;
  const messages: CommunityMessage[] = [];
  const readErrors: string[] = [];

  for (const [name, id] of channels) {
    try {
      const rows: any[] = await discordGet(`/channels/${id}/messages?limit=${limit}`, token);
      for (const row of rows) {
        if (since && Date.parse(row.timestamp) < since) continue;
        messages.push({
          id: String(row.id),
          channel: name,
          authorId: String(row.author?.id ?? ''),
          authorName: String(row.author?.global_name || row.author?.username || ''),
          content: String(row.content ?? ''),
          createdAt: String(row.timestamp),
          isBot: Boolean(row.author?.bot),
        });
      }
    } catch (err: any) {
      readErrors.push(`${name}: ${err?.message || 'error de lectura'}`);
    }
  }

  const report: Record<string, unknown> = {
    guildId,
    generatedAt: new Date().toISOString(),
    channelsRead: [...channels.keys()],
    messagesRead: messages.length,
    readErrors,
  };

  // Sin el intent privilegiado de contenido, Discord devuelve autor y fecha pero
  // el texto llega vacío: analizar eso produciría ceros que parecen "silencio".
  const humanMessages = messages.filter((m) => !m.isBot);
  if (humanMessages.length > 0 && humanMessages.every((m) => m.content.trim() === '')) {
    console.error(
      'El bot ve mensajes pero no su contenido. Activa "Message Content Intent" en el Developer Portal ' +
        '(tu aplicación → Bot → Privileged Gateway Intents). Sin eso, la lectura no sirve y no se reporta.',
    );
    process.exit(3);
  }

  if (analyze === 'health' || analyze === 'both') {
    report.health = buildCommunityHealth(messages);
  }
  if (analyze === 'moderation' || analyze === 'both') {
    report.moderation = analyzeModeration(messages);
  }

  const serialized = JSON.stringify(report, null, 2);
  const out = arg('out');
  if (out) fs.writeFileSync(out, serialized, 'utf8');
  console.log(serialized);
}

// ─── Comandos ──────────────────────────────────────────────────────────────

async function main() {
  const command = process.argv[2];

  if (command === 'report') {
    await send('capability.request', {
      capability: 'community.report',
      canonicalOrgId: ORG,
      projectId: PROJECT_ID,
      windowDays: Number(arg('days') || 30),
    });
    return;
  }

  if (command === 'propose') {
    let posts: Array<{ channel: string; text: string; imageUrl?: string }> = [];
    const file = arg('file');
    if (file) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      posts = Array.isArray(parsed) ? parsed : parsed.posts;
    } else {
      const channel = arg('channel');
      const text = arg('text');
      const imageUrl = arg('image');
      if (!channel || !text) {
        console.error('Uso: propose --channel=<canal> --text="…" [--image=https://…] | --file=posts.json [--intent="…"]');
        process.exit(1);
      }
      posts = [{ channel, text, ...(imageUrl ? { imageUrl } : {}) }];
    }

    // Clave de idempotencia: si el bot reintenta la misma propuesta, no se
    // duplica la aprobación. Se puede forzar con --key=.
    const proposalKey =
      arg('key') ||
      crypto.createHash('sha256').update(JSON.stringify({ posts, intent: arg('intent') ?? null })).digest('hex').slice(0, 32);

    await send('capability.request', {
      capability: 'community.publish_post',
      canonicalOrgId: ORG,
      projectId: PROJECT_ID,
      intent: arg('intent'),
      proposalKey,
      posts,
    });
    return;
  }

  if (command === 'read') {
    await readCommand();
    return;
  }

  console.error('Comandos: report | propose | read');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
