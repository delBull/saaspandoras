/**
 * 🎭 Discord · aprovisionamiento del servidor para S'Narai
 * apps/dashboard/scripts/discord-provision-snarai.ts
 *
 * Crea (idempotente) la capa pública y la capa de miembros, y los roles de nivel.
 * No borra nada: si un canal o rol ya existe por nombre, lo reutiliza.
 *
 * Uso:
 *   bun run scripts/discord-provision-snarai.ts            # plan (no llama a la API)
 *   bun run scripts/discord-provision-snarai.ts --apply    # crea lo que falte
 *
 * Requiere para --apply: DISCORD_BOT_TOKEN y DISCORD_GUILD_ID.
 * Al terminar imprime los IDs para llenar DISCORD_ROLE_* en Vercel.
 */

const API = 'https://discord.com/api/v10';

const ROLES = [
  { key: 'DISCORD_ROLE_MEMBER', name: "S'Narai · Miembro", color: 0x9ca3af },
  { key: 'DISCORD_ROLE_EXPLORER', name: "S'Narai · Explorer", color: 0x34d399 },
  { key: 'DISCORD_ROLE_RESIDENT', name: "S'Narai · Residente", color: 0x60a5fa },
  { key: 'DISCORD_ROLE_INSTITUTIONAL', name: "S'Narai · Institucional", color: 0xfbbf24 },
  { key: 'DISCORD_ROLE_RIVIERA', name: "S'Narai · Riviera", color: 0xccad6e },
  { key: 'DISCORD_ROLE_VERIFIED', name: "S'Narai · Acceso verificado", color: 0x10b981 },
];

const CHANNELS = [
  { name: 's-narai-anuncios', topic: 'Avisos oficiales de S\'Narai. Solo staff publica.', private: false },
  { name: 's-narai-la-oportunidad', topic: 'Qué es S\'Narai, la tesis y por qué Bucerías.', private: false },
  { name: 's-narai-avance', topic: 'Hitos de obra, licencias y operación.', private: false },
  { name: 's-narai-preguntas', topic: 'Dudas públicas sobre el modelo de participación.', private: false },
  { name: 's-narai-amas', topic: 'Sesiones abiertas con el equipo. Fechas y resúmenes.', private: false },
  { name: 'miembros-documentos', topic: 'Índice del data room para miembros verificados.', private: true },
  { name: 'miembros-visitas', topic: 'Agenda de visitas al desarrollo.', private: true },
  { name: 'miembros-due-diligence', topic: 'Preguntas técnicas con el equipo.', private: true },
];

const PUBLIC_CATEGORY = "S'NARAI";
const PRIVATE_CATEGORY = "S'NARAI · MIEMBROS";

const apply = process.argv.includes('--apply');

function token(): string {
  const t = process.env.DISCORD_BOT_TOKEN;
  if (!t) throw new Error('Falta DISCORD_BOT_TOKEN (fail-closed).');
  return t;
}
function guild(): string {
  const g = process.env.DISCORD_GUILD_ID;
  if (!g) throw new Error('Falta DISCORD_GUILD_ID (fail-closed).');
  return g;
}

async function api(path: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bot ${token()}`,
      'Content-Type': 'application/json',
      'X-Audit-Log-Reason': 'S%27Narai%20provision',
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord ${init?.method || 'GET'} ${path} → ${res.status} ${text.slice(0, 160)}`);
  }
  return res.status === 204 ? null : res.json();
}

async function main() {
  console.log(`\nDiscord · aprovisionamiento S'Narai · modo ${apply ? 'APPLY' : 'PLAN'}\n`);
  for (const r of ROLES) console.log(`  rol   ${r.name.padEnd(28)} → ${r.key}`);
  for (const c of CHANNELS) console.log(`  canal ${(c.private ? '🔒 ' : '   ') + c.name}`);

  if (!apply) {
    console.log('\n(plan) Nada se llamó a la API. Ejecuta con --apply para crear.\n');
    return;
  }

  const g = guild();
  const me = await api('/users/@me');
  const botUserId: string = me.id;
  console.log(`bot: ${me.username} (${botUserId})`);

  const existingRoles: any[] = await api(`/guilds/${g}/roles`);
  const roleIds: Record<string, string> = {};

  for (const r of ROLES) {
    const found = existingRoles.find((x) => x.name === r.name);
    if (found) {
      roleIds[r.key] = found.id;
      console.log(`= rol existente: ${r.name} (${found.id})`);
      continue;
    }
    const created = await api(`/guilds/${g}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name: r.name, color: r.color, mentionable: false, hoist: false }),
    });
    roleIds[r.key] = created.id;
    console.log(`+ rol creado: ${r.name} (${created.id})`);
  }

  const existingChannels: any[] = await api(`/guilds/${g}/channels`);
  const byName = new Map(existingChannels.map((c) => [c.name, c]));

  async function ensureCategory(name: string, isPrivate: boolean): Promise<string> {
    const found = byName.get(name);
    if (found) {
      console.log(`= categoría existente: ${name} (${found.id})`);
      return found.id;
    }
    // OJO: si se deniega VIEW_CHANNEL a @everyone sin permitírselo al bot, el
    // bot pierde acceso a la categoría que acaba de crear y ya no puede editarla.
    const overwrites = isPrivate
      ? [
          { id: g, type: 0, deny: String(1 << 10) }, // @everyone sin VIEW_CHANNEL
          { id: roleIds.DISCORD_ROLE_VERIFIED, type: 0, allow: String(1 << 10) },
          { id: botUserId, type: 1, allow: String(1 << 10) }, // el bot debe seguir viendo
        ]
      : [];
    const created = await api(`/guilds/${g}/channels`, {
      method: 'POST',
      body: JSON.stringify({ name, type: 4, permission_overwrites: overwrites }),
    });
    console.log(`+ categoría creada: ${name} (${created.id})`);
    return created.id;
  }

  const publicCat = await ensureCategory(PUBLIC_CATEGORY, false);
  const privateCat = await ensureCategory(PRIVATE_CATEGORY, true);

  for (const c of CHANNELS) {
    if (byName.has(c.name)) {
      console.log(`= canal existente: ${c.name}`);
      continue;
    }
    // Los canales hijos copian los overwrites de la categoría al crearse y NO se
    // sincronizan solos: hay que declararlos también aquí o el bot pierde acceso.
    const overwrites = c.private
      ? [
          { id: g, type: 0, deny: String(1 << 10), allow: '0' },
          { id: roleIds.DISCORD_ROLE_VERIFIED, type: 0, deny: '0', allow: String(1 << 10) },
          { id: botUserId, type: 1, allow: String(1 << 10) },
        ]
      : undefined;

    const created = await api(`/guilds/${g}/channels`, {
      method: 'POST',
      body: JSON.stringify({
        name: c.name,
        type: 0,
        parent_id: c.private ? privateCat : publicCat,
        topic: c.topic,
        ...(overwrites ? { permission_overwrites: overwrites } : {}),
      }),
    });
    console.log(`+ canal creado: ${c.name} (${created.id})`);
  }

  console.log('\nConfigura estas variables en Vercel (production):\n');
  for (const r of ROLES) console.log(`  ${r.key}=${roleIds[r.key]}`);
  console.log('');
}

main().catch((err) => {
  console.error('Error:', err?.message || err);
  process.exit(1);
});
