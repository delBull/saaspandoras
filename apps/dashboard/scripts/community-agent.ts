/**
 * 🗣️ Community Agent CLI — habla con Hermes por el puente A2A firmado.
 *
 * Lo usa el Orca Bot "S'Narai Manager" desde su propia carpeta. No necesita
 * credenciales de la plataforma: sólo su llave privada y el secreto del puente.
 *
 *   community-agent report
 *   community-agent propose --channel=s-narai-preguntas --text="…"
 *   community-agent propose --file=posts.json --intent="Respuestas a dudas de cesión"
 *
 * Variables:
 *   COMMUNITY_AGENT_PRIVATE_KEY  llave del agente (0x…)
 *   A2A_HMAC_SECRET              secreto compartido del puente
 *   HERMES_A2A_URL               por defecto https://dash.pandoras.finance/api/v1/a2a/messages
 *   COMMUNITY_ORG / COMMUNITY_PROJECT_ID   por defecto snarai / 17
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

if (!SECRET || !PRIVATE_KEY) {
  console.error('Faltan COMMUNITY_AGENT_PRIVATE_KEY o COMMUNITY_A2A_HMAC_SECRET (fail-closed).');
  process.exit(1);
}

const wallet = new ethers.Wallet(PRIVATE_KEY);

async function send(type: 'capability.request', payload: Record<string, unknown>) {
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
    let posts: Array<{ channel: string; text: string }> = [];
    const file = arg('file');
    if (file) {
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
      posts = Array.isArray(parsed) ? parsed : parsed.posts;
    } else {
      const channel = arg('channel');
      const text = arg('text');
      if (!channel || !text) {
        console.error('Uso: propose --channel=<canal> --text="…" | --file=posts.json [--intent="…"]');
        process.exit(1);
      }
      posts = [{ channel, text }];
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

  console.error('Comandos: report | propose');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
