'use server';

import { getNexusAuthContext } from '@saasfly/shared';
import { db } from '@saasfly/db-core';
import { nexusAccessRequests, nexusCollaborators } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';

/**
 * Solicitud de acceso al Developer Hub.
 *
 * Antes sólo mandaba un webhook a Discord: no quedaba registro, así que no había
 * nada que aprobar. Ahora **persiste la solicitud** en `nexus_access_requests`
 * (bandeja de `/nexus/ops?tab=approvals`) y además avisa a Discord con el enlace
 * real a esa bandeja.
 *
 * La identidad se resuelve en servidor: los argumentos del cliente se ignoran,
 * así nadie puede pedir acceso a nombre de otra persona.
 */
export async function requestDeveloperAccessAction(_userName?: string, _userRole?: string) {
  const auth = await getNexusAuthContext(null);
  if (!auth.isAuthenticated || !auth.email) {
    return { success: false, error: 'Sesión no válida.' };
  }

  const email = auth.email.toLowerCase().trim();

  try {
    const [collaborator] = await db
      .select({ id: nexusCollaborators.id, name: nexusCollaborators.name, role: nexusCollaborators.role })
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.email, email))
      .limit(1);

    let request: { id: string } | null = null;

    if (collaborator) {
      const [created] = await db
        .insert(nexusAccessRequests)
        .values({
          collaboratorId: collaborator.id,
          email,
          name: collaborator.name || auth.name || email,
          role: String(collaborator.role ?? 'COLLABORATOR'),
          module: 'developer',
          message: 'Solicitud desde el Developer Hub.',
        })
        .onConflictDoNothing()
        .returning({ id: nexusAccessRequests.id });
      request = created ?? null;
    }

    // Aviso a Discord (si está configurado). No bloquea: la solicitud ya quedó.
    const webhookUrl = process.env.DISCORD_WEBHOOK_ALERTS;
    if (webhookUrl) {
      const link = `https://dash.pandoras.finance/nexus/ops?tab=approvals`;
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: '🚨 Solicitud de acceso · Developer Hub',
              color: 0x8b5cf6,
              description: `**${auth.name ?? email}** (${collaborator?.role ?? auth.role ?? 'colaborador'}) pidió acceso al Developer Hub.`,
              fields: [
                { name: 'Correo', value: email, inline: true },
                { name: 'Estado', value: request ? 'Pendiente en la bandeja' : 'Ya existía una solicitud pendiente' },
              ],
              footer: { text: 'Pandora’s Nexus · Aprobaciones' },
            },
          ],
          components: [
            {
              type: 1,
              components: [
                { type: 2, style: 5, label: 'Abrir bandeja de aprobaciones', url: link },
              ],
            },
          ],
        }),
      }).catch((err) => console.warn('[developer-access] Discord webhook falló:', err?.message || err));
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in requestDeveloperAccessAction:', err);
    return { success: false, error: 'No se pudo registrar la solicitud.' };
  }
}
