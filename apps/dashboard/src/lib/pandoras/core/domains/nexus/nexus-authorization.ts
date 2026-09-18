import { db } from '@/db';
import { nexusCollaborators } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { resolveEffectivePermissions, NexusPermissions } from '@/lib/nexus/nexus-rbac';

export interface NexusResourceScope {
  canonicalOrgId: string;
  collaboratorId: string;
  telegramUserId?: number;
  permissions: NexusPermissions;
  assignedQueues?: string[];
  assignedProjects?: string[];
  allowedDomains?: string[];
}

export class NexusAuthorizationService {
  /**
   * Resolves the strict server-side ResourceScope for a Nexus Collaborator.
   * Prevents client-side spoofing by resolving collaboratorId from canonical identity
   * and fetching robust server-side RBAC permissions.
   */
  static async resolveCollaboratorScope(
    canonicalOrgId: string,
    actorId: string, // canonical actor id, e.g. from session or telegram payload
    telegramUserId?: number
  ): Promise<NexusResourceScope | null> {
    try {
      // Fetch collaborator safely
      let collaboratorQuery = db.select()
        .from(nexusCollaborators)
        .where(
          telegramUserId 
            ? eq(nexusCollaborators.telegramUserId, telegramUserId.toString())
            : eq(nexusCollaborators.id, parseInt(actorId))
        )
        .limit(1);

      const [collaborator] = await collaboratorQuery;

      if (!collaborator || collaborator.status !== 'ACTIVE') {
        return null;
      }

      // We resolve effective permissions via RBAC mapping
      const permissions = resolveEffectivePermissions(collaborator.role as any);

      return {
        canonicalOrgId,
        collaboratorId: collaborator.id.toString(),
        telegramUserId: collaborator.telegramUserId ? parseInt(collaborator.telegramUserId) : undefined,
        permissions,
        assignedQueues: [], // To be populated by team assignments if applicable
        assignedProjects: [],
        allowedDomains: ['nexus.inbox', 'nexus.activity'],
      };
    } catch (e) {
      console.error('[NexusAuthorizationService] Error resolving collaborator scope:', e);
      return null;
    }
  }
}
