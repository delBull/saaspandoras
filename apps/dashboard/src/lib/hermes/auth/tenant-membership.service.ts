import { db } from '@/db';
import { users, projects, daoMembers, telegramBindings, channelIdentityBindings } from '@/db/schema';
import { eq, inArray, or, and } from 'drizzle-orm';
import crypto from 'crypto';
import { 
  AuthorizedTenant, 
  HermesSession, 
  HermesRole, 
  HermesTenantAccessDeniedError,
  HermesAuthError
} from './hermes-session.types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class HermesTenantMembershipService {
  /**
   * Resolves all organizations / tenants that a Telegram user is authorized to operate.
   * 
   * Precedence & Rules:
   * 1. Global Platform Admin (`users.role === 'admin'`) grants ADMIN access to active organizations.
   * 2. Project Owner (`projects.applicant_wallet_address` or `applicant_email`) grants OWNER access.
   * 3. DAO Member / Operator (`dao_members.wallet`) grants OPERATOR access.
   * 4. Channel Binding (`channel_identity_bindings`) grants OPERATOR access to bound tenant.
   * 
   * Canonical Authority: Every returned tenant exposes its canonical `organizationId` (UUID).
   */
  async getAuthorizedTenants(telegramUserId: string): Promise<AuthorizedTenant[]> {
    if (!telegramUserId || typeof telegramUserId !== 'string') {
      return [];
    }

    const tenantMap = new Map<string, AuthorizedTenant>();

    // 1. Look up primary user record in `users`
    let userRecord: typeof users.$inferSelect | undefined;
    try {
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramUserId))
        .limit(1);
      userRecord = userRows[0];
    } catch (err: any) {
      console.error('[HermesTenantMembershipService] User lookup error in database:', err?.message || err);
      throw new HermesAuthError(
        `Failed to resolve user identity from database: ${err?.message || 'Database error'}`,
        'MEMBERSHIP_DB_UNAVAILABLE',
        503
      );
    }

    // 2. Look up secondary binding in `telegram_bindings`
    let secondaryWallet: string | undefined;
    try {
      const bindingRows = await db
        .select()
        .from(telegramBindings)
        .where(eq(telegramBindings.telegramUserId, telegramUserId))
        .limit(1);
      if (bindingRows[0]?.walletAddress) {
        secondaryWallet = bindingRows[0].walletAddress.toLowerCase();
      }
    } catch (err: any) {
      console.error('[HermesTenantMembershipService] Binding lookup error in database:', err?.message || err);
    }

    // Candidate wallets associated with this Telegram user
    const wallets: string[] = [];
    if (userRecord?.walletAddress) {
      wallets.push(userRecord.walletAddress.toLowerCase());
    }
    if (secondaryWallet && !wallets.includes(secondaryWallet)) {
      wallets.push(secondaryWallet);
    }

    // RULE 1: Global Platform Admin Authority (Bounded to 100 workspaces per query)
    if (userRecord?.role === 'admin') {
      try {
        const allProjects = await db
          .select({
            id: projects.id,
            organizationId: projects.organizationId,
            title: projects.title,
            slug: projects.slug,
          })
          .from(projects)
          .limit(100);

        for (const proj of allProjects) {
          tenantMap.set(proj.organizationId, {
            organizationId: proj.organizationId,
            organizationName: proj.title,
            tenantSlug: proj.slug,
            projectId: proj.id,
            role: 'ADMIN',
            isOwner: true,
          });
        }
        return Array.from(tenantMap.values());
      } catch (err: any) {
        console.error('[HermesTenantMembershipService] Global admin project fetch failed:', err?.message || err);
        throw new HermesAuthError(
          `Failed to fetch admin projects: ${err?.message || 'Database error'}`,
          'MEMBERSHIP_DB_UNAVAILABLE',
          503
        );
      }
    }

    // RULE 2: Owner lookup (by wallet or email)
    if (wallets.length > 0 || userRecord?.email) {
      try {
        const ownerConditions = [];
        if (wallets.length > 0) {
          ownerConditions.push(inArray(projects.applicantWalletAddress, wallets));
        }
        if (userRecord?.email) {
          ownerConditions.push(eq(projects.applicantEmail, userRecord.email));
        }

        const ownedProjects = await db
          .select({
            id: projects.id,
            organizationId: projects.organizationId,
            title: projects.title,
            slug: projects.slug,
          })
          .from(projects)
          .where(or(...ownerConditions))
          .limit(50);

        for (const proj of ownedProjects) {
          tenantMap.set(proj.organizationId, {
            organizationId: proj.organizationId,
            organizationName: proj.title,
            tenantSlug: proj.slug,
            projectId: proj.id,
            role: 'OWNER',
            isOwner: true,
          });
        }
      } catch (err: any) {
        console.error('[HermesTenantMembershipService] Owner projects lookup failed:', err?.message || err);
      }
    }

    // RULE 3: DAO Member / Operator lookup
    if (wallets.length > 0) {
      try {
        const memberRows = await db
          .select({
            projectId: daoMembers.projectId,
            projectOrgId: projects.organizationId,
            projectTitle: projects.title,
            projectSlug: projects.slug,
          })
          .from(daoMembers)
          .innerJoin(projects, eq(daoMembers.projectId, projects.id))
          .where(inArray(daoMembers.wallet, wallets))
          .limit(50);

        for (const row of memberRows) {
          if (!tenantMap.has(row.projectOrgId)) {
            tenantMap.set(row.projectOrgId, {
              organizationId: row.projectOrgId,
              organizationName: row.projectTitle,
              tenantSlug: row.projectSlug,
              projectId: row.projectId,
              role: 'OPERATOR',
              isOwner: false,
            });
          }
        }
      } catch (err: any) {
        console.error('[HermesTenantMembershipService] DAO members lookup failed:', err?.message || err);
      }
    }

    // RULE 4: Channel Identity Binding direct tenant lookup (Batch query, no N+1, safe UUID casting)
    try {
      const cibRows = await db
        .select({
          identityId: channelIdentityBindings.identityId,
        })
        .from(channelIdentityBindings)
        .where(
          and(
            eq(channelIdentityBindings.channel, 'telegram'),
            eq(channelIdentityBindings.externalUserId, telegramUserId),
            eq(channelIdentityBindings.status, 'ACTIVE')
          )
        )
        .limit(50);

      if (cibRows.length > 0) {
        const rawIds = Array.from(new Set(cibRows.map(r => r.identityId)));
        const uuidList = rawIds.filter(id => UUID_REGEX.test(id));
        const slugList = rawIds.filter(id => !UUID_REGEX.test(id));

        const conditions = [];
        if (uuidList.length > 0) {
          conditions.push(inArray(projects.organizationId, uuidList));
        }
        if (slugList.length > 0) {
          conditions.push(inArray(projects.slug, slugList));
        }

        if (conditions.length > 0) {
          const matchingProjs = await db
            .select({
              id: projects.id,
              organizationId: projects.organizationId,
              title: projects.title,
              slug: projects.slug,
            })
            .from(projects)
            .where(or(...conditions))
            .limit(50);

          for (const proj of matchingProjs) {
            if (!tenantMap.has(proj.organizationId)) {
              tenantMap.set(proj.organizationId, {
                organizationId: proj.organizationId,
                organizationName: proj.title,
                tenantSlug: proj.slug,
                projectId: proj.id,
                role: 'OPERATOR',
                isOwner: false,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[HermesTenantMembershipService] Channel Identity Binding lookup failed:', err?.message || err);
    }

    return Array.from(tenantMap.values());
  }

  /**
   * Validates access to a target organization and issues an authenticated HermesSession.
   * 
   * Fail-Closed Security:
   * 1. Resolves all authorized tenants for the telegramUserId.
   * 2. Verifies strictly that targetOrganizationId (UUID) is present in the authorized list.
   * 3. Throws HermesTenantAccessDeniedError (403) if authorization fails.
   */
  async validateTenantAccess(params: {
    telegramUserId: string;
    targetOrganizationId: string;
    username?: string;
    sessionDurationSeconds?: number; // Default: 86400 (24 hours)
  }): Promise<HermesSession> {
    const { telegramUserId, targetOrganizationId, username, sessionDurationSeconds = 86400 } = params;

    if (!telegramUserId || !targetOrganizationId) {
      throw new HermesTenantAccessDeniedError(targetOrganizationId || 'unknown', telegramUserId || 'unknown');
    }

    // 1. Resolve authorized tenants
    const authorizedList = await this.getAuthorizedTenants(telegramUserId);

    // 2. Strict UUID matching
    const matchedTenant = authorizedList.find(
      t => t.organizationId.toLowerCase() === targetOrganizationId.toLowerCase()
    );

    if (!matchedTenant) {
      throw new HermesTenantAccessDeniedError(targetOrganizationId, telegramUserId);
    }

    // 3. Resolve user identity details
    let internalUserId: string | undefined;
    let walletAddress: string | undefined;

    try {
      const userRows = await db
        .select({ id: users.id, walletAddress: users.walletAddress })
        .from(users)
        .where(eq(users.telegramId, telegramUserId))
        .limit(1);
      if (userRows[0]) {
        internalUserId = userRows[0].id;
        walletAddress = userRows[0].walletAddress || undefined;
      }
    } catch (err: any) {
      console.error('[HermesTenantMembershipService] User details lookup failed during session build:', err?.message || err);
    }

    const actorId = internalUserId ? `usr_${internalUserId}` : `tg_${telegramUserId}`;
    const now = Date.now();
    const sessionId = `hses_${crypto.randomBytes(16).toString('hex')}`;

    return {
      subject: {
        telegramUserId,
        username,
        internalUserId,
        walletAddress,
      },
      tenant: {
        organizationId: matchedTenant.organizationId,
        organizationName: matchedTenant.organizationName,
        tenantSlug: matchedTenant.tenantSlug,
        projectId: matchedTenant.projectId,
      },
      actorId,
      role: matchedTenant.role,
      sessionId,
      issuedAt: now,
      expiresAt: now + (sessionDurationSeconds * 1000),
      source: 'TELEGRAM',
    };
  }
}
