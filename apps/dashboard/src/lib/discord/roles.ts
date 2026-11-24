/**
 * 🎭 Discord · asignación de roles vía REST (sin dependencias nuevas)
 *
 * Usa la API de Discord con el token del bot. Nunca asigna un rol fuera de la
 * lista gestionada y nunca falla en silencio: devuelve el detalle por rol.
 */
import { getDiscordConfig } from './config';

const API = 'https://discord.com/api/v10';

export interface RoleSyncResult {
  userId: string;
  added: string[];
  removed: string[];
  skipped: string[];
  errors: Array<{ roleId: string; action: 'add' | 'remove' | 'list'; error: string }>;
}

async function discordFetch(path: string, init: RequestInit & { botToken: string }): Promise<Response> {
  const { botToken, ...rest } = init;
  return fetch(`${API}${path}`, {
    ...rest,
    headers: {
      ...(rest.headers || {}),
      Authorization: `Bot ${botToken}`,
      'X-Audit-Log-Reason': 'S%27Narai%20membership%20sync',
    },
    cache: 'no-store',
  });
}

export async function getMemberRoles(discordUserId: string): Promise<{ ok: boolean; roles: string[]; error?: string }> {
  const cfg = getDiscordConfig();
  const res = await discordFetch(`/guilds/${cfg.guildId}/members/${discordUserId}`, {
    method: 'GET',
    botToken: cfg.botToken,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { ok: false, roles: [], error: `HTTP ${res.status} ${text.slice(0, 160)}` };
  }
  const json = (await res.json()) as { roles?: string[] };
  return { ok: true, roles: json.roles ?? [] };
}

/**
 * Deja al miembro EXACTAMENTE con los roles gestionados deseados
 * (`desired` ⊆ `managed`). Los roles no gestionados no se tocan.
 */
export async function syncMemberRoles(params: {
  discordUserId: string;
  desiredRoles: string[];
  managedRoles: string[];
}): Promise<RoleSyncResult> {
  const cfg = getDiscordConfig();
  const { discordUserId, desiredRoles, managedRoles } = params;
  const result: RoleSyncResult = { userId: discordUserId, added: [], removed: [], skipped: [], errors: [] };

  const current = await getMemberRoles(discordUserId);
  if (!current.ok) {
    result.errors.push({ roleId: '*', action: 'list', error: current.error || 'no se pudieron leer los roles' });
    return result;
  }

  const desired = new Set(desiredRoles.filter(Boolean));
  const managed = new Set(managedRoles.filter(Boolean));

  for (const roleId of desired) {
    if (current.roles.includes(roleId)) {
      result.skipped.push(roleId);
      continue;
    }
    const res = await discordFetch(`/guilds/${cfg.guildId}/members/${discordUserId}/roles/${roleId}`, {
      method: 'PUT',
      botToken: cfg.botToken,
    });
    if (res.ok) result.added.push(roleId);
    else result.errors.push({ roleId, action: 'add', error: `HTTP ${res.status}` });
  }

  for (const roleId of managed) {
    if (desired.has(roleId)) continue;
    if (!current.roles.includes(roleId)) continue;
    const res = await discordFetch(`/guilds/${cfg.guildId}/members/${discordUserId}/roles/${roleId}`, {
      method: 'DELETE',
      botToken: cfg.botToken,
    });
    if (res.ok) result.removed.push(roleId);
    else result.errors.push({ roleId, action: 'remove', error: `HTTP ${res.status}` });
  }

  return result;
}
