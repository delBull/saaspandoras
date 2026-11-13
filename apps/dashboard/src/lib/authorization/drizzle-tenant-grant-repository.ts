/**
 * Repositorio Drizzle de grants de tenant (P0.1).
 *
 * ⚠️ ESTADO: IMPLEMENTADO — NO CABLEADO.
 * Depende de la migración `0096_p0_1_tenant_authorization.sql`, que NO está
 * aplicada. El dominio está cubierto por pruebas con repositorio en memoria;
 * este adaptador queda pendiente de verificación contra base de datos real.
 */

import { and, eq, isNull, sql } from '@saasfly/db-core';
import { db } from '@saasfly/db';
import { tenantAuthorizationGrants } from '@saasfly/db/schema';
import type { TenantGrantRepository } from './authorize-tenant-capability';
import type { GrantResourceScope, TenantAuthorizationGrant } from './tenant-grant';
import type { TenantCapability } from '@saasfly/shared';

function epoch(value: Date | null | undefined): number | null {
  return value ? Math.floor(value.getTime() / 1000) : null;
}

export class DrizzleTenantGrantRepository implements TenantGrantRepository {
  async listBySubject(organizationId: string, subjectId: string): Promise<TenantAuthorizationGrant[]> {
    const rows = await db
      .select()
      .from(tenantAuthorizationGrants)
      .where(
        and(
          eq(tenantAuthorizationGrants.canonicalOrgId, organizationId),
          eq(tenantAuthorizationGrants.subjectId, subjectId),
        ),
      );

    return rows.map((row) => this.mapGrant(row));
  }

  async create(grant: TenantAuthorizationGrant): Promise<void> {
    await db.insert(tenantAuthorizationGrants).values({
      id: grant.id,
      canonicalOrgId: grant.organizationId,
      subjectKind: 'human',
      subjectId: grant.subjectId,
      capabilities: grant.capabilities,
      scopeKind: grant.resourceScope.kind,
      scopeProjectId: grant.resourceScope.kind === 'project' ? grant.resourceScope.projectId : null,
      issuedBy: grant.issuedBy,
      issuedAt: new Date(grant.issuedAt * 1000),
      expiresAt: grant.expiresAt === null ? null : new Date(grant.expiresAt * 1000),
      revokedAt: null,
      approvalRequestId: grant.approvalRequestId ?? null,
    });
  }

  async revoke(id: string, revokedAt: number): Promise<boolean> {
    const updated = await db
      .update(tenantAuthorizationGrants)
      .set({ revokedAt: new Date(revokedAt * 1000) })
      .where(and(eq(tenantAuthorizationGrants.id, id), isNull(tenantAuthorizationGrants.revokedAt)))
      .returning({ id: tenantAuthorizationGrants.id });

    return updated.length > 0;
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(tenantAuthorizationGrants)
      .where(eq(tenantAuthorizationGrants.canonicalOrgId, organizationId));

    return row?.total ?? 0;
  }

  private mapGrant(row: typeof tenantAuthorizationGrants.$inferSelect): TenantAuthorizationGrant {
    const resourceScope: GrantResourceScope =
      row.scopeKind === 'project' && typeof row.scopeProjectId === 'number'
        ? { kind: 'project', projectId: row.scopeProjectId }
        : { kind: 'organization' };

    return {
      id: row.id,
      organizationId: row.canonicalOrgId,
      subjectKind: 'human',
      subjectId: row.subjectId,
      capabilities: (row.capabilities ?? []) as TenantCapability[],
      resourceScope,
      issuedBy: row.issuedBy,
      issuedAt: epoch(row.issuedAt) ?? 0,
      expiresAt: epoch(row.expiresAt),
      revokedAt: epoch(row.revokedAt),
      approvalRequestId: row.approvalRequestId ?? null,
    };
  }
}
