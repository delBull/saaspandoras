import { db } from '@/db';
import { users, projects, daoMembers, telegramBindings, channelIdentityBindings } from '@/db/schema';
import { eq, inArray, or, and } from 'drizzle-orm';
import crypto from 'crypto';
import { 
  AuthorizedTenant, 
  HermesSession, 
  HermesRole, 
  HermesTenantAccessDeniedError 
} from './hermes-session.types';

export class HermesTenantMembershipService {
  /**
   * Resolves all organizations / tenants that a Telegram user is authorized to operate.
   * 
   * Precedence & Rules:
   * 1. Global Platform Admin (`users.role === 'admin'`) grants ADMIN access to all active organizations.
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
    } catch (err) {
      console.warn('[HermesTenantMembershipService] User lookup error:', err);
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
    } catch (err) {
      console.warn('[HermesTenantMembershipService] Binding lookup error:', err);
    }

    // Candidate wallets associated with this Telegram user
    const wallets: string[] = [];
    if (userRecord?.walletAddress) {
      wallets.push(userRecord.walletAddress.toLowerCase());
    }
    if (secondaryWallet && !wallets.includes(secondaryWallet)) {
      wallets.push(secondaryWallet);
    }

    // RULE 1: Global Platform Admin Authority
    if (userRecord?.role === 'admin') {
      try {
        const allProjects = await db
          .select({
            id: projects.id,
            organizationId: projects.organizationId,
            title: projects.title,
            slug: projects.slug,
          })
          .from(projects);

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
      } catch (err) {
        console.error('[HermesTenantMembershipService] Global admin project fetch failed:', err);
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
          .where(or(...ownerConditions));

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
      } catch (err) {
        console.warn('[HermesTenantMembershipService] Owner projects lookup failed:', err);
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
          .where(inArray(daoMembers.wallet, wallets));

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
      } catch (err) {
        console.warn('[HermesTenantMembershipService] DAO members lookup failed:', err);
      }
    }

    // RULE 4: Channel Identity Binding direct tenant lookup
    try {
      const cibRows = await db
        .select()
        .from(channelIdentityBindings)
        .where(
          and(
            eq(channelIdentityBindings.channel, 'telegram'),
            eq(channelIdentityBindings.externalUserId, telegramUserId),
            eq(channelIdentityBindings.status, 'ACTIVE')
          )
        );

      for (const cib of cibRows) {
        const targetIdent = cib.identityId;
        // Check if identityId is a UUID or slug matching projects
        const matchingProjs = await db
          .select({
            id: projects.id,
            organizationId: projects.organizationId,
            title: projects.title,
            slug: projects.slug,
          })
          .from(projects)
          .where(
            or(
              eq(projects.slug, targetIdent),
              eq(projects.organizationId, targetIdent as any)
            )
          )
          .limit(1);

        if (matchingProjs[0] && !tenantMap.has(matchingProjs[0].organizationId)) {
          tenantMap.set(matchingProjs[0].organizationId, {
            organizationId: matchingProjs[0].organizationId,
            organizationName: matchingProjs[0].title,
            tenantSlug: matchingProjs[0].slug,
            projectId: matchingProjs[0].id,
            role: 'OPERATOR',
            isOwner: false,
          });
        }
      }
    } catch (err) {
      console.warn('[HermesTenantMembershipService] CIB lookup failed:', err);
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
    } catch {
      // Non-blocking fallback to telegram identity
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
