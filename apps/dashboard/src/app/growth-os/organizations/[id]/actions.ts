'use server';

import { randomUUID } from 'crypto';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '~/db';
import { daoMembers, projects } from '~/db/schema';
import { getAuth, isAdmin } from '~/lib/auth';
import {
  ControlPlaneContext,
  AuthorizationError,
  type ControlPlaneRole,
  type ControlPlanePermission,
} from '~/lib/pandoras/core/domains/control-plane/application/context';
import { 
  getOverviewQuery,
  getMissionsQuery,
  getPendingIntentsQuery,
  getAuditTrailQuery,
  approveIntentCommand,
  rejectIntentCommand
} from '~/lib/pandoras/composition/control-plane-composition';

// ============================================================================
// ZERO TRUST SESSION RESOLVER
// ============================================================================
// Reemplaza el mock de Sprint 22.6: la identidad sale de una sesión JWT
// verificada (getAuth) y la membresía de organización se deriva de:
//   1. Admin (MARCO_ADMIN_WALLET / SUPER_ADMIN_WALLET / tabla administrators)
//      → acceso 'founder' a la organización solicitada.
//   2. dao_members (wallet → projects) → organización `org_${project.slug}`
//      con rol 'member' (solo lectura).
const FULL_PERMISSIONS: ControlPlanePermission[] = [
  'view_overview',
  'view_missions',
  'view_audit',
  'view_governance',
  'approve_intent',
  'reject_intent',
  'change_policy',
];

const VIEW_PERMISSIONS: ControlPlanePermission[] = [
  'view_overview',
  'view_missions',
  'view_audit',
  'view_governance',
];

async function getAuthenticatedSession(requestedOrganizationId: string): Promise<ControlPlaneContext> {
  const auth = await getAuth();

  if (!auth.isVerified || !auth.session?.address) {
    throw new AuthorizationError(
      `FORBIDDEN: No verified session. Connect your wallet and sign in to access organization ${requestedOrganizationId}.`
    );
  }

  const address = auth.session.address;

  // 1. Admin override → founder con acceso total
  if (await isAdmin(address)) {
    return new ControlPlaneContext(
      `session_${address}`,
      address,
      'founder',
      FULL_PERMISSIONS,
      [{ organizationId: requestedOrganizationId, role: 'founder' }]
    );
  }

  // 2. Miembro vía dao_members
  const memberships = await db
    .select({
      projectId: daoMembers.projectId,
      slug: projects.slug,
    })
    .from(daoMembers)
    .leftJoin(projects, eq(daoMembers.projectId, projects.id))
    .where(eq(daoMembers.wallet, address));

  const authorizedOrganizations = memberships
    .filter((m): m is typeof m & { slug: string } => Boolean(m.slug))
    .map(m => ({
      organizationId: `org_${m.slug}`,
      role: 'viewer' as ControlPlaneRole,
    }));

  if (!authorizedOrganizations.some(o => o.organizationId === requestedOrganizationId)) {
    throw new AuthorizationError(
      `FORBIDDEN: Actor ${address} does not have access to organization ${requestedOrganizationId}`
    );
  }

  return new ControlPlaneContext(
    `session_${address}`,
    address,
    'viewer',
    VIEW_PERMISSIONS,
    authorizedOrganizations
  );
}

// ============================================================================
// COMMAND RESULT CONTRACT
// ============================================================================
export type CommandResult =
  | { success: true }
  | {
      success: false;
      code: 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_STATE' | 'ALREADY_PROCESSED' | 'VALIDATION_ERROR' | 'UNKNOWN';
      message: string;
    };

// ============================================================================
// QUERIES
// ============================================================================

export async function getOrganizationOverview(requestedOrganizationId: string) {
  const context = await getAuthenticatedSession(requestedOrganizationId);
  return getOverviewQuery.execute(context, requestedOrganizationId);
}

export async function getActiveMissions(requestedOrganizationId: string) {
  const context = await getAuthenticatedSession(requestedOrganizationId);
  return getMissionsQuery.execute(context, requestedOrganizationId);
}

export async function getPendingIntents(requestedOrganizationId: string) {
  const context = await getAuthenticatedSession(requestedOrganizationId);
  return getPendingIntentsQuery.execute(context, requestedOrganizationId);
}

export async function getMissionAuditTrail(requestedOrganizationId: string, missionId?: string) {
  const context = await getAuthenticatedSession(requestedOrganizationId);
  return getAuditTrailQuery.execute(context, requestedOrganizationId, missionId);
}

// ============================================================================
// COMMANDS
// ============================================================================

export async function approveIntent(requestedOrganizationId: string, intentId: string, reason: string): Promise<CommandResult> {
  try {
    const context = await getAuthenticatedSession(requestedOrganizationId);
    const idempotencyKey = randomUUID();
    await approveIntentCommand.execute(context, requestedOrganizationId, intentId, reason, idempotencyKey);
    
    // Revalidamos la vista de Governance para que refleje el cambio
    try {
      revalidatePath(`/growth-os/organizations/${requestedOrganizationId}/governance`);
    } catch (e) {
      console.warn("revalidatePath skipped (likely running in CLI test)");
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`[ServerAction] approveIntent error:`, error);
    return mapErrorToCommandResult(error);
  }
}

export async function rejectIntent(requestedOrganizationId: string, intentId: string, reason: string): Promise<CommandResult> {
  try {
    const context = await getAuthenticatedSession(requestedOrganizationId);
    const idempotencyKey = randomUUID();
    await rejectIntentCommand.execute(context, requestedOrganizationId, intentId, reason, idempotencyKey);
    
    try {
      revalidatePath(`/growth-os/organizations/${requestedOrganizationId}/governance`);
    } catch (e) {
      console.warn("revalidatePath skipped (likely running in CLI test)");
    }
    
    return { success: true };
  } catch (error: any) {
    console.error(`[ServerAction] rejectIntent error:`, error);
    return mapErrorToCommandResult(error);
  }
}

// ============================================================================
// ERROR MAPPING
// ============================================================================
function mapErrorToCommandResult(error: any): CommandResult {
  if (error instanceof AuthorizationError) {
    return { success: false, code: 'FORBIDDEN', message: error.message };
  }
  
  const errorMessage = String(error.message || '');
  
  if (errorMessage.includes('NOT_FOUND')) {
    return { success: false, code: 'NOT_FOUND', message: 'Operational Intent not found' };
  }
  if (errorMessage.includes('ALREADY_PROCESSED')) {
    return { success: false, code: 'ALREADY_PROCESSED', message: 'This intent was already processed' };
  }
  if (errorMessage.includes('INVALID_STATE')) {
    return { success: false, code: 'INVALID_STATE', message: 'Invalid state transition' };
  }
  if (errorMessage.includes('TENANT_MISMATCH')) {
    return { success: false, code: 'FORBIDDEN', message: 'Tenant mismatch' };
  }
  
  return { success: false, code: 'UNKNOWN', message: 'An unexpected error occurred' };
}
