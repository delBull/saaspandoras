/**
 * Adaptador Drizzle de pertenencia a equipo (P0.1).
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO VERIFICADO.
 * Depende de `nexus_team_memberships` (migración 0096, no aplicada).
 */

import { and, eq } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { nexusTeamMemberships } from '@saasfly/db/schema';
import type { TeamMembershipRepository } from './team-membership';

export class DrizzleTeamMembershipRepository implements TeamMembershipRepository {
  async teamsOf(organizationId: string, collaboratorId: string): Promise<string[]> {
    if (!organizationId || !collaboratorId) return [];

    const rows = await db
      .select({ teamKey: nexusTeamMemberships.teamKey })
      .from(nexusTeamMemberships)
      .where(
        and(
          eq(nexusTeamMemberships.canonicalOrgId, organizationId),
          eq(nexusTeamMemberships.memberIdentity, collaboratorId),
        ),
      );

    return rows.map((row) => row.teamKey);
  }
}
