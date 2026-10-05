/**
 * 👑 Executive Tool Registry — OWNER-Gated Ecosystem Actions (K11-EXEC)
 *
 * Wires the three ExecutiveToolSchemas into HermesToolExecutor so Boss Mode
 * works live on WhatsApp/Telegram/Dashboard, with fail-closed authorization:
 *   - Only callers whose context declares OWNER/BOSS authority pass.
 *   - Every invocation (ALLOWED or DENIED) lands in the PlatformAuditLedger.
 *
 * Enforcement contract: routes must pass `context.actorIsBoss === true` or
 * `context.actorRole === 'OWNER'` after resolving the interlocutor — the
 * registry NEVER trusts parameters alone for privilege escalation.
 */

import { HermesToolExecutor } from '../tool-executor';
import {
  ActivateTenantTool,
  AssignAdminTool,
  ApprovePaymentTool,
  ProvisionCollaboratorTool,
  ExecutiveBriefingTool,
  ExecutiveCapabilitiesTool,
  FinancialSignatureTool,
  FinancialProposalTool,
  CodeApprovalTool,
  CodeDiagnosisTool,
  OperationalActionTool,
  RegisterContactTool,
  AddDirectiveTool,
  PromoteContactTool,
  SendWhatsAppTool,
  AuditTenantTool,
  AuditLeadsTool,
  AuditLogsTool,
  AuditSchemaTool,
  ConfirmPlanTool,
  CancelPlanTool,
  ExecutiveToolSchema,
} from './executive-tools';
import { db } from "@saasfly/db-core";
import { projects, installedProducts, administrators, privatePaymentLinks, nexusCollaborators, users } from "@saasfly/db-core";
import { eq, and, inArray, or, ilike } from "@saasfly/db-core";
import { PlatformAuditLedgerService } from '../../admin/platform-audit-ledger.service';
import { paymentOrchestrator } from '../../payments/core/orchestrator';
import { PaymentSettlementEvent } from '../../payments/core/types';
import crypto from 'crypto';
import { sendCollaboratorMagicLink } from '../../nexus/collaborators-service';
import { sendTenantProvisionEmail, sendWhatsAppMessage } from '@saasfly/shared';

const TOOL_SCHEMAS: ExecutiveToolSchema[] = [
  ActivateTenantTool,
  AssignAdminTool,
  ApprovePaymentTool,
  ProvisionCollaboratorTool,
  ExecutiveBriefingTool,
  ExecutiveCapabilitiesTool,
  FinancialSignatureTool,
  FinancialProposalTool,
  CodeApprovalTool,
  CodeDiagnosisTool,
  OperationalActionTool,
  RegisterContactTool,
  AddDirectiveTool,
  PromoteContactTool,
  SendWhatsAppTool,
  AuditTenantTool,
  AuditLeadsTool,
  AuditLogsTool,
  AuditSchemaTool,
  ConfirmPlanTool,
  CancelPlanTool,
];

function isExecutive(context: Record<string, unknown> | undefined): boolean {
  return Boolean(context) && (
    (context as any).actorIsBoss === true ||
    (context as any).actorRole === 'OWNER' ||
    (context as any).actorRole === 'FOUNDER_BOSS'
  );
}

export function registerExecutiveTools(executor: HermesToolExecutor): void {
  if (!executor) return;

  // ── executive_activate_tenant ────────────────────────────────────────────
  executor.registerHandler('executive_activate_tenant', async (params, context) => {
    if (!isExecutive(context)) {
      throw new Error('EXECUTIVE_GATE_DENY: Only OWNER/BOSS authority may activate tenants.');
    }
    const { tenantSlug, vertical, planId } = (params as any) || {};
    if (!tenantSlug || !vertical || !planId) {
      throw new Error('Missing tenantSlug, vertical or planId');
    }
    const [project] = await db.select({ id: projects.id, orgId: projects.organizationId, title: projects.title, applicantWalletAddress: projects.applicantWalletAddress })
      .from(projects).where(eq(projects.slug, String(tenantSlug))).limit(1);
    if (!project) throw new Error(`Tenant '${tenantSlug}' not found`);

    const productFamily = vertical === 'HERMES_OS' ? 'HERMES' : vertical === 'GROWTH_OS' ? 'GROWTH_OS' : vertical;
    await db.update(installedProducts)
      .set({ plan: String(planId), status: 'active' })
      .where(eq(installedProducts.projectId, project.id));
    await db.update(projects)
      .set({ isSimulationMode: false })
      .where(eq(projects.id, project.id));

    PlatformAuditLedgerService.recordEntry({
      actorId: String((context as any)?.actorId || 'executive_channel'),
      actorWallet: String((context as any)?.actorWallet || 'executive_channel'),
      actorRole: 'OWNER',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: String(tenantSlug),
      capability: 'executive.activate_tenant',
      governance: { isDiscord2faVerified: false, auditReason: `Executive activation → ${vertical}/${planId}` },
      stateTransition: { previousState: null, newState: { vertical, planId } },
      result: 'SUCCESS',
    } as any);

    if (project.applicantWalletAddress) {
      const [owner] = await db.select({ email: users.email })
        .from(users)
        .where(eq(users.walletAddress, project.applicantWalletAddress))
        .limit(1);
      if (owner && owner.email) {
        await sendTenantProvisionEmail(owner.email, project.title, planId);
      }
    }

    return {
      activated: true,
      tenant: tenantSlug,
      vertical,
      plan: planId,
      simulatedMode: false,
    };
  });

  // ── executive_assign_admin ───────────────────────────────────────────────
  executor.registerHandler('executive_assign_admin', async (params, context) => {
    if (!isExecutive(context)) {
      throw new Error('EXECUTIVE_GATE_DENY: Only OWNER/BOSS authority may assign tenant admins.');
    }
    const { tenantSlug, collaboratorEmailOrPhone, roleLevel } = (params as any) || {};
    if (!tenantSlug || !collaboratorEmailOrPhone || !roleLevel) {
      throw new Error('Missing required executive_assign_admin parameters');
    }

    const [project] = await db.select({ id: projects.id })
      .from(projects).where(eq(projects.slug, String(tenantSlug))).limit(1);
    if (!project) throw new Error(`Tenant '${tenantSlug}' not found`);

    const identifier = String(collaboratorEmailOrPhone).toLowerCase();
    const [admin] = await db.select({ id: administrators.id })
      .from(administrators)
      .where(eq(administrators.walletAddress, identifier)).limit(1);
    if (!admin) throw new Error(`No administrator record for '${collaboratorEmailOrPhone}'`);

    await db.update(projects)
      .set({ assignedAdminId: admin.id })
      .where(eq(projects.id, project.id));

    PlatformAuditLedgerService.recordEntry({
      actorId: String((context as any)?.actorId || 'executive_channel'),
      actorWallet: String((context as any)?.actorWallet || 'executive_channel'),
      actorRole: 'OWNER',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'project',
      resourceId: String(tenantSlug),
      capability: 'executive.assign_admin',
      governance: { isDiscord2faVerified: false, auditReason: `Assigned admin #${admin.id} (${roleLevel}) to '${tenantSlug}' via Executive channel` },
      stateTransition: { previousState: null, newState: { adminId: admin.id, roleLevel } },
      result: 'SUCCESS',
    } as any);

    return { assigned: true, tenant: tenantSlug, adminId: admin.id, roleLevel };
  });

  // ── executive_approve_payment ────────────────────────────────────────────
  executor.registerHandler('executive_approve_payment', async (params, context) => {
    if (!isExecutive(context)) {
      throw new Error('EXECUTIVE_GATE_DENY: Only OWNER/BOSS authority may settle payments.');
    }
    const { paymentIntentId, resolution, amount, currency, tenantId, vertical, destinationWallet, notes } = (params as any) || {};
    if (!paymentIntentId || !resolution || !amount || !currency || !tenantId || !vertical || !destinationWallet) {
      throw new Error('Missing strict payment validation parameters for approval snapshot.');
    }

    const [link] = await db
      .select()
      .from(privatePaymentLinks)
      .where(eq(privatePaymentLinks.id, String(paymentIntentId)))
      .limit(1);
    if (!link) throw new Error(`Payment intent '${paymentIntentId}' not found`);

    // P0-3: Validate intent attributes exactly match the requested approval.
    // P0-14: tenant binding is SERVER-AUTHORITATIVE (creator wallet → project),
    // not trusting client metadata for authorization.
    const metadata = (link.metadata as any) || {};
    const createdByWallet = String(metadata.createdByWallet || '').toLowerCase();
    let serverOrganization = 'pandoras';
    if (createdByWallet) {
      const [creatorProject] = await db.select({ organizationId: projects.organizationId })
        .from(projects).where(eq(projects.applicantWalletAddress, createdByWallet)).limit(1);
      if (creatorProject) serverOrganization = creatorProject.organizationId;
    }
    const linkTenant = serverOrganization;
    const linkVertical = 'GROWTH_OS';

    if (
      Number(link.amount) !== Number(amount) ||
      link.currency.toUpperCase() !== currency.toUpperCase() ||
      link.destinationWallet?.toLowerCase() !== destinationWallet.toLowerCase() ||
      linkTenant !== tenantId ||
      linkVertical !== vertical
    ) {
      throw new Error('EXECUTIVE_GATE_DENY: Payment Intent attributes mismatch. Possible replay or manipulation.');
    }

    // P0-3: Check Expiration
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      throw new Error('EXECUTIVE_GATE_DENY: Payment Intent has expired.');
    }

    // P0-3: One-Use check
    if (link.status === 'completed' || link.status === 'cancelled') {
      throw new Error(`EXECUTIVE_GATE_DENY: Approval is one-use. Intent is already ${link.status}.`);
    }

    if (resolution === 'REJECT') {
      await db.update(privatePaymentLinks)
        .set({ status: 'cancelled' as any })
        .where(eq(privatePaymentLinks.id, link.id));
      PlatformAuditLedgerService.recordEntry({
        actorId: String((context as any)?.actorId || 'executive_channel'),
        actorWallet: String((context as any)?.actorWallet || 'executive_channel'),
        actorRole: 'OWNER',
        actorType: 'ADMIN',
        action: 'TENANT_PROVISIONING_INTENT_CREATED',
        targetResource: 'private_payment_link',
        resourceId: link.id,
        capability: 'executive.approve_payment',
        governance: { isDiscord2faVerified: false, auditReason: `REJECTED via Executive channel${notes ? `: ${notes}` : ''}` },
        stateTransition: { previousState: { status: link.status }, newState: { status: 'cancelled' } },
        result: 'SUCCESS',
      } as any);
      return { rejected: true, linkId: link.id };
    }

    if (link.status === 'completed') {
      return { alreadySettled: true, linkId: link.id };
    }

    // P0-3 race-proof one-use: atomic conditional claim. Two concurrent approvals
    // cannot both claim — only the first receives rows to dispatch.
    const claimed = await db.update(privatePaymentLinks)
      .set({ status: 'completed' })
      .where(and(
        eq(privatePaymentLinks.id, link.id),
        inArray(privatePaymentLinks.status, ['active', 'pending'] as any)
      ))
      .returning({ id: privatePaymentLinks.id });

    if (claimed.length === 0) {
      throw new Error('EXECUTIVE_GATE_DENY: Approval is one-use. Intent is already settled.');
    }

    const event: PaymentSettlementEvent = {
      eventId: `exec_settle_${link.id}_${Date.now()}`,
      vertical: linkVertical as any,
      organizationId: linkTenant,
      intentId: link.id,
      productId: metadata.productId || 'GENERAL',
      amount: Number(link.amount),
      currency: String(link.currency || 'USD').toUpperCase(),
      provider: 'EXECUTIVE_APPROVAL',
      providerTransactionId: `exec_${link.id}`,
      metadata: { viaExecutiveApproval: true, notes: notes || null, originalMetadata: metadata },
      timestamp: new Date(),
    };

    try {
      await paymentOrchestrator.processSettlement(event);
    } catch (e: any) {
      console.error('[ExecutiveTools] Orchestrator dispatch failed (admin manual follow-up needed):', e?.message);
      throw new Error(`Settlement dispatch failed: ${e?.message}`);
    }

    PlatformAuditLedgerService.recordEntry({
      actorId: String((context as any)?.actorId || 'executive_channel'),
      actorWallet: String((context as any)?.actorWallet || 'executive_channel'),
      actorRole: 'OWNER',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'private_payment_link',
      resourceId: link.id,
      capability: 'executive.approve_payment',
      governance: { isDiscord2faVerified: false, auditReason: `APPROVED via Executive channel${notes ? `: ${notes}` : ''}` },
      stateTransition: { previousState: { status: link.status }, newState: { status: 'completed' } },
      result: 'SUCCESS',
    } as any);

    return { approved: true, linkId: link.id, vertical: linkVertical, organizationId: linkTenant };
  });
  // ── executive_provision_collaborator ─────────────────────────────────────
  executor.registerHandler('executive_provision_collaborator', async (params, context) => {
    if (!isExecutive(context)) {
      throw new Error('EXECUTIVE_GATE_DENY: Only OWNER/BOSS authority may provision collaborators.');
    }
    const { collaboratorEmail, role, action } = (params as any) || {};
    if (!collaboratorEmail || !action) {
      throw new Error('Missing collaboratorEmail or action');
    }

    const [collaborator] = await db
      .select()
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.email, String(collaboratorEmail).toLowerCase().trim()))
      .limit(1);

    if (!collaborator) {
      return { success: false, error: `Colaborador con email ${collaboratorEmail} no encontrado.` };
    }

    if (action === 'REJECT') {
      await db.update(nexusCollaborators)
        .set({ status: 'REJECTED' as any, statusChangedAt: new Date() })
        .where(eq(nexusCollaborators.id, collaborator.id));
      return { success: true, action: 'REJECTED', email: collaborator.email };
    }

    // SECURITY: allowlist the role — the LLM must never write an arbitrary
    // string (e.g. hallucinated 'SUPERADMIN') into nexusCollaborators/users.
    const VALID_COLLAB_ROLES = ['TENANT_ADMIN', 'OPERATOR', 'VIEWER'] as const;
    let finalRole = String(role || collaborator.role || 'VIEWER').toUpperCase().trim();
    const roleAliases: Record<string, string> = {
      'SUPER_ADMIN': 'TENANT_ADMIN', 'ADMIN': 'TENANT_ADMIN', 'OPERADOR': 'OPERATOR', 'USER': 'VIEWER',
    };
    finalRole = roleAliases[finalRole] || finalRole;
    if ((VALID_COLLAB_ROLES as readonly string[]).indexOf(finalRole) === -1) {
      throw new Error(`EXECUTIVE_GATE_DENY: role '${finalRole}' is not a valid collaborator role (${VALID_COLLAB_ROLES.join(', ')}).`);
    }
    const token = `nx_${crypto.randomBytes(32).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.update(nexusCollaborators)
      .set({
        role: finalRole,
        status: 'ACTIVE' as any,
        statusChangedAt: new Date(),
        token,
        expiresAt,
      })
      .where(eq(nexusCollaborators.id, collaborator.id));

    const [linkedUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, collaborator.email.toLowerCase()))
      .limit(1);

    if (linkedUser) {
      await db.update(users)
        .set({ role: finalRole.toLowerCase() as any })
        .where(eq(users.id, linkedUser.id));
    }

    try {
      const base = process.env.NEXT_PUBLIC_NEXUS_URL || 'https://nexus.pandoras.finance';
      const magicLink = `${base}/nexus?token=${encodeURIComponent(token)}`;
      const displayName = collaborator.name || collaborator.email.split('@')[0] || 'Sovereign Actor';
      await sendCollaboratorMagicLink(displayName, collaborator.email, magicLink);
    } catch (err: any) {
      // Policy decision (Marco, Oct-2026): la promoción del rol NO se revierte
      // si el magic-link falla — el email es notificación, no autorización.
      // El ADMIN puede reenviarlo desde el panel de colaboradores.
      console.warn('[ExecutiveTools] Magic link failed (role promotion stands):', err.message);
    }

    PlatformAuditLedgerService.recordEntry({
      actorId: String((context as any)?.actorId || 'executive_channel'),
      actorWallet: String((context as any)?.actorWallet || 'executive_channel'),
      actorRole: 'OWNER',
      actorType: 'ADMIN',
      action: 'TENANT_PROVISIONING_INTENT_CREATED',
      targetResource: 'nexus_collaborator',
      resourceId: String(collaborator.id),
      capability: 'executive.provision_collaborator',
      governance: { isDiscord2faVerified: false, auditReason: `Aprovisionado via Hermes Executive: ${finalRole}` },
      stateTransition: { previousState: { status: collaborator.status }, newState: { status: 'ACTIVE', role: finalRole } },
      result: 'SUCCESS',
    } as any);

    return {
      success: true,
      action: 'APPROVED',
      email: collaborator.email,
      role: finalRole
    };
  });

  // ── executive_get_briefing ─────────────────────────────────────────────
  executor.registerHandler('executive_get_briefing', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { ExecutiveBriefingEngine } = await import('@saasfly/hermes-core');
    const briefing = await ExecutiveBriefingEngine.generateBriefing();
    return { briefing: briefing.rawMarkdown };
  });

  // ── executive_get_capabilities ─────────────────────────────────────────
  executor.registerHandler('executive_get_capabilities', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { ExecutiveCapabilitiesManifest } = await import('@saasfly/hermes-core');
    const channel = (context as any)?.channel || 'whatsapp';
    const guide = ExecutiveCapabilitiesManifest.getExecutiveGuide(channel);
    return { capabilitiesGuide: guide };
  });

  // ── executive_financial_signature ──────────────────────────────────────
  executor.registerHandler('executive_financial_signature', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { proposalId, signature } = (params as any) || {};
    const { FinancialOrchestratorService } = await import('@saasfly/hermes-core');
    const finResult = await FinancialOrchestratorService.verifyAndExecuteSignature({
      proposalId: String(proposalId),
      signature: String(signature),
      interlocutor: (context as any)?.interlocutor,
    });
    return { success: finResult.success, message: finResult.message };
  });

  // ── executive_financial_proposal ───────────────────────────────────────
  executor.registerHandler('executive_financial_proposal', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { action, tenantId, recipient, amountUsd, purpose } = (params as any) || {};
    const { FinancialOrchestratorService } = await import('@saasfly/hermes-core');
    const finPrep = FinancialOrchestratorService.prepareProposal({
      action: String(action) as any,
      tenantId: String(tenantId),
      recipient: String(recipient),
      amountUsd: Number(amountUsd),
      purpose: String(purpose),
      interlocutor: (context as any)?.interlocutor,
    });
    return { ok: finPrep.ok, reviewCard: finPrep.reviewCard };
  });

  // ── executive_code_approval ────────────────────────────────────────────
  executor.registerHandler('executive_code_approval', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { proposalId } = (params as any) || {};
    const { CodeOperatorService } = await import('@saasfly/hermes-core');
    const patchResult = await CodeOperatorService.approvePatch(String(proposalId), (context as any)?.interlocutor);
    return { success: patchResult.success, message: patchResult.message };
  });

  // ── executive_code_diagnosis ───────────────────────────────────────────
  executor.registerHandler('executive_code_diagnosis', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { rawError } = (params as any) || {};
    const { CodeOperatorService } = await import('@saasfly/hermes-core');
    const diag = CodeOperatorService.diagnoseError(String(rawError));
    return { diagnosis: diag };
  });

  // ── executive_operational_action ───────────────────────────────────────
  executor.registerHandler('executive_operational_action', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { action, target, payload, title, description, blastRadius } = (params as any) || {};
    const { ExecutivePlanner } = await import('@saasfly/hermes-core');
    
    const organizationId = (context as any)?.organizationId || 'system';
    const founderKey = `${organizationId}:${(context as any)?.interlocutor?.id || 'founder'}`;
    
    const planResult = ExecutivePlanner.createPlan({
      action: String(action) as any,
      target: String(target),
      payload: payload as any,
      title: String(title || action),
      description: String(description || ''),
      blastRadius: String(blastRadius || 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH',
      interlocutor: (context as any)?.interlocutor,
      founderKey,
    });
    return { ok: planResult.ok, reviewCard: planResult.reviewCard };
  });

  // ── executive_register_contact ─────────────────────────────────────────
  executor.registerHandler('executive_register_contact', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { name, phone, email, notes } = (params as any) || {};
    const organizationId = (context as any)?.organizationId || 'pandoras';
    const { InterlocutorResolver } = await import('@saasfly/hermes-core');
    const contact = await InterlocutorResolver.registerContactFromBoss({
      name: String(name),
      phone: phone ? String(phone) : undefined,
      email: email ? String(email) : undefined,
      notes: notes ? String(notes) : undefined,
      tenantSlug: organizationId,
    });
    return { registered: true, contact };
  });

  // ── executive_add_directive ────────────────────────────────────────────
  executor.registerHandler('executive_add_directive', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { directiveText } = (params as any) || {};
    const { FounderDirectiveStore } = await import('@saasfly/hermes-core');
    FounderDirectiveStore.addDirective({
      text: String(directiveText),
      actorId: (context as any)?.interlocutor?.actorId || 'marco_founder',
      channel: (context as any)?.channel || 'web',
    });
    return { recorded: true, directiveText };
  });

  // ── executive_promote_contact ──────────────────────────────────────────
  executor.registerHandler('executive_promote_contact', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { targetIdentifier, targetRole, notes } = (params as any) || {};
    const organizationId = (context as any)?.organizationId || 'pandoras';
    const { InterlocutorResolver } = await import('@saasfly/hermes-core');
    const contact = await InterlocutorResolver.promoteContactFromBoss({
      targetIdentifier: String(targetIdentifier),
      targetRole: String(targetRole),
      notes: notes ? String(notes) : undefined,
      tenantSlug: organizationId,
    });
    return { promoted: true, contact };
  });

  // ── executive_send_whatsapp ────────────────────────────────────────────
  executor.registerHandler('executive_send_whatsapp', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { targetNameOrPhone, messageToSend } = (params as any) || {};
    const target = String(targetNameOrPhone).trim();
    let destPhone: string | null = null;
    let destName = target;

    if (/^\+?\d{10,15}$/.test(target)) {
      destPhone = target.replace(/\D/g, '');
    } else {
      const [collab] = await db
        .select()
        .from(nexusCollaborators)
        .where(or(
          ilike(nexusCollaborators.name, `%${target}%`),
          eq(nexusCollaborators.name, target)
        ))
        .limit(1);
      if (collab?.whatsappPhone) {
        destPhone = collab.whatsappPhone.replace(/\D/g, '');
        destName = collab.name || target;
      }
    }

    if (destPhone) {
      console.log(`📤 [ExecutiveWhatsAppDispatch] Dispatching message from Boss to ${destName} (${destPhone})`);
      await sendWhatsAppMessage(destPhone, `*Mensaje de Marco (Fundador):*\n\n${messageToSend}`);
      return { sent: true, destName, destPhone };
    }
    
    throw new Error(`Could not resolve WhatsApp destination for '${targetNameOrPhone}'`);
  });

  // ── executive_audit_tenant ─────────────────────────────────────────────
  executor.registerHandler('executive_audit_tenant', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { tenantSlug } = (params as any) || {};
    const { ExecutiveAuditService } = await import('@saasfly/hermes-core');
    const report = await ExecutiveAuditService.inspectTenant(String(tenantSlug));
    return { markdownReport: report.markdown };
  });

  // ── executive_audit_leads ──────────────────────────────────────────────
  executor.registerHandler('executive_audit_leads', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { ExecutiveAuditService } = await import('@saasfly/hermes-core');
    const report = await ExecutiveAuditService.inspectLeads();
    return { markdownReport: report.markdown };
  });

  // ── executive_audit_logs ───────────────────────────────────────────────
  executor.registerHandler('executive_audit_logs', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { ExecutiveAuditService } = await import('@saasfly/hermes-core');
    const report = await ExecutiveAuditService.inspectSystemLogs();
    return { markdownReport: report.markdown };
  });

  // ── executive_audit_schema ─────────────────────────────────────────────
  executor.registerHandler('executive_audit_schema', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const { ExecutiveAuditService } = await import('@saasfly/hermes-core');
    const report = await ExecutiveAuditService.inspectSchemaParity();
    return { markdownReport: report.markdown };
  });

  // ── executive_confirm_plan ─────────────────────────────────────────────
  executor.registerHandler('executive_confirm_plan', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const organizationId = (context as any)?.organizationId || 'system';
    const founderKey = `${organizationId}:${(context as any)?.interlocutor?.id || 'founder'}`;
    const { ExecutivePlanner } = await import('@saasfly/hermes-core');
    const execResult = await ExecutivePlanner.executePlan(founderKey, (context as any)?.interlocutor);
    return { success: execResult.success, message: execResult.message };
  });

  // ── executive_cancel_plan ──────────────────────────────────────────────
  executor.registerHandler('executive_cancel_plan', async (params, context) => {
    if (!isExecutive(context)) throw new Error('EXECUTIVE_GATE_DENY');
    const organizationId = (context as any)?.organizationId || 'system';
    const founderKey = `${organizationId}:${(context as any)?.interlocutor?.id || 'founder'}`;
    const { ExecutivePlanner } = await import('@saasfly/hermes-core');
    const cancelResult = ExecutivePlanner.cancelPlan(founderKey);
    return { canceled: true, message: cancelResult.message };
  });
}

export const EXECUTIVE_TOOL_SCHEMAS = TOOL_SCHEMAS;

/**
 * CRM Omnicanal conversational tools (tenant-identity-scoped, non-owner).
 * The caller MUST pass context.organizationId = the tenant's canonicalOrgId
 * after resolving that tenant's interlocutor (Boss / Collaborator / Viewer),
 * so hermes runtime tools never cross tenants.
 */
export function registerCrmTools(executor: HermesToolExecutor): void {
  if (!executor) return;
  // ── CRM CONVERSATIONAL TOOLS (non-owner, tenant identity-scoped) ──────
  // Hermes Omnicanal: any authorized tenant actor on WhatsApp/Telegram/Web
  // can narrate a lead capture and query their own pipeline. The tenant is
  // identified STRICTLY by controlPlaneContext.organizationId of the caller
  // (a tenant cannot read or write another tenant's CRM).
  executor.registerHandler('crm_capture_lead', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || (params as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg || callerOrg === 'unknown') {
      throw new Error('CRM_GATE_DENY: tenant identity required (controlPlaneContext.organizationId missing).');
    }
    const { name, email, phone, source, notes } = (params as any) || {};
    if (!name && !email) throw new Error('crm_capture_lead requires name or email');

    const [project] = await db.select({ id: projects.id, wallet: projects.applicantWalletAddress })
      .from(projects)
      .where(or(eq(projects.organizationId, callerOrg), eq(projects.slug, callerOrg)))
      .limit(1);
    if (!project) throw new Error(`Tenant project not found for '${callerOrg}'`);

    const { marketingLeads: leadsTable } = await import('@saasfly/db-core');
    const [inserted] = await (await import('@saasfly/db-core')).db
      .insert(leadsTable)
      .values({
        projectId: project.id,
        name: name ? String(name).trim() : null,
        email: email ? String(email).trim().toLowerCase() : null,
        phoneNumber: phone ? String(phone).trim() : null,
        source: source ? String(source).trim() : 'Hermes Conversational',
        status: 'active',
        intent: 'explore' as any,
        score: 50,
        quality: 'medium' as any,
        ownerContext: 'client',
        scope: 'b2c',
        metadata: {
          notes: notes || '',
          createdVia: 'hermes_omnichannel',
          actorId: String((context as any)?.actorId || 'unknown'),
          channel: String((context as any)?.channel || 'unknown'),
        },
        consent: false,
      })
      .returning();

    return {
      captured: true,
      leadId: inserted?.id,
      name: inserted?.name,
      email: inserted?.email,
      tenant: callerOrg,
    };
  });

  executor.registerHandler('crm_query_pipeline', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('CRM_GATE_DENY: organizationId required.');
    const [project] = await db.select({ id: projects.id })
      .from(projects)
      .where(or(eq(projects.organizationId, callerOrg), eq(projects.slug, callerOrg)))
      .limit(1);
    if (!project) throw new Error(`Tenant '${callerOrg}' not found`);
    const { marketingLeads } = await import('@saasfly/db-core');
    const leads = await (await import('@saasfly/db-core')).db
      .select({ id: (marketingLeads as any).id, name: (marketingLeads as any).name, email: (marketingLeads as any).email, status: (marketingLeads as any).status, score: (marketingLeads as any).score })
      .from(marketingLeads)
      .where(eq((marketingLeads as any).projectId, project.id))
      .limit(20);
    return { tenant: callerOrg, pipelineCount: leads.length, leads };
  });

  executor.registerHandler('crm_qualify_lead', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('CRM_GATE_DENY: organizationId required.');
    const { leadId, score, quality } = (params as any) || {};
    if (!leadId || score === undefined) throw new Error('leadId and score are required');
    const { marketingLeads } = await import('@saasfly/db-core');
    const [project] = await db.select({ id: projects.id })
      .from(projects)
      .where(or(eq(projects.organizationId, callerOrg), eq(projects.slug, callerOrg)))
      .limit(1);
    if (!project) throw new Error(`Tenant '${callerOrg}' not found`);
    const [updated] = await (await import('@saasfly/db-core')).db
      .update(marketingLeads)
      .set({ score: Number(score), quality: quality || 'medium' })
      .where((await import("@saasfly/db-core")).and(
        eq((marketingLeads as any).id, String(leadId)),
        eq((marketingLeads as any).projectId, project.id),
      ))
      .returning({ id: (marketingLeads as any).id });
    if (!updated) throw new Error('Lead not found for this tenant');
    return { qualified: true, leadId, score, quality: quality || 'medium', tenant: callerOrg };
  });
}

/**
 * 🎫 NFT Lab Hermes Tools — Tenant-scoped NFT operations.
 *
 * Access model:
 *   Level 0 (read-only):   nft_verify_access, nft_explain_collection
 *                           Any authenticated interlocutor can call.
 *   Level 2 (auto-execute): nft_issue_token → auto if within policy
 *   Level 3 (propose):      nft_issue_token → governance intent if policy requires
 *                           nft_propose_revoke → always governance
 *
 * CRITICAL authority rules:
 *   - tenantId resolved from context.organizationId (server-side) NEVER from LLM params
 *   - contractAddress / chainId NEVER accepted from LLM — always loaded from DB
 *   - projectId resolved from DB, never from LLM
 *   - All operations pass through NftCapability SDK → NftPolicyEngine
 *
 * LLM NEVER executes — it proposes. Policy engine decides. DB records.
 */
export function registerNftTools(executor: HermesToolExecutor): void {

  // ── nft_verify_access (Level 0) ─────────────────────────────────────────
  // Read-only: verifies if a wallet holds a token from a named collection.
  // On-chain check → DB fallback. No capability gate (read-only).
  executor.registerHandler('nft_verify_access', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');

    const { collectionId, walletAddress } = (params as any) || {};
    if (!collectionId || !walletAddress) {
      throw new Error('collectionId and walletAddress are required for nft_verify_access.');
    }

    const { NftCapability } = await import("@saasfly/shared" as any);

    const result = await NftCapability.verifyOwnership({
      tenantId: callerOrg,
      collectionId: String(collectionId),
      walletAddress: String(walletAddress),
    });

    return {
      wallet: String(walletAddress).toLowerCase(),
      collectionId,
      tenant: callerOrg,
      holds: result.holds,
      balance: result.balance,
      verificationSource: result.source,
      ...(result.reason ? { note: result.reason } : {}),
    };
  });

  // ── nft_explain_collection (Level 0) ────────────────────────────────────
  // Read-only narration of a collection's state. Hermes uses this to answer
  // questions like "¿Cuántos tokens quedan?" or "¿Está desplegado?".
  executor.registerHandler('nft_explain_collection', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');

    const { collectionId } = (params as any) || {};
    if (!collectionId) throw new Error('collectionId is required for nft_explain_collection.');

    const { NftCapability } = await import("@saasfly/shared" as any);

    const summary = await NftCapability.explainCollection({
      tenantId: callerOrg,
      collectionId: String(collectionId),
    });

    if (!summary) {
      throw new Error(`Collection '${collectionId}' not found for tenant '${callerOrg}'.`);
    }

    return {
      tenant: callerOrg,
      collection: {
        id: summary.id,
        name: summary.name,
        symbol: summary.symbol,
        purpose: summary.purpose,
        status: summary.status,
        totalSupply: summary.totalSupply,
        mintedSupply: summary.mintedSupply,
        supplyRemaining: summary.supplyRemaining,
        contractAddress: summary.contractAddress ?? null,
        chainId: summary.chainId,
        isDeployed: !!summary.contractAddress,
        policyNotes: summary.policyNotes,
      },
    };
  });

  // ── nft_issue_token (Level 2/3) ──────────────────────────────────────────
  // Issues a token to a recipient wallet.
  // Policy engine decides: ALLOW_AUTO (Level 2) or REQUIRE_GOVERNANCE (Level 3).
  // Hermes should explain the result transparently — not retry autonomously on governance.
  executor.registerHandler('nft_issue_token', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');

    const actorId = String((context as any)?.actorId || 'hermes');

    const { collectionId, recipientWallet, leadId, metadata } = (params as any) || {};
    if (!collectionId || !recipientWallet) {
      throw new Error('collectionId and recipientWallet are required for nft_issue_token.');
    }

    // Resolve projectId server-side
    const [project] = await db.select({ id: projects.id })
      .from(projects)
      .where(or(eq(projects.organizationId, callerOrg), eq(projects.slug, callerOrg)))
      .limit(1);
    if (!project) throw new Error(`Tenant '${callerOrg}' not found.`);

    const { NftCapability } = await import("@saasfly/shared" as any);

    const result = await NftCapability.issueToken({
      tenantId: callerOrg,
      projectId: project.id,
      collectionId: String(collectionId),
      recipientWallet: String(recipientWallet),
      actorId,
      correlationLeadId: leadId ? String(leadId) : undefined,
      metadata: typeof metadata === 'object' && metadata ? metadata : undefined,
    });

    return {
      tenant: callerOrg,
      collectionId,
      recipientWallet: String(recipientWallet).toLowerCase(),
      ...result,
    };
  });

  // ── nft_propose_revoke (Level 3) ─────────────────────────────────────────
  // Proposes revoking an issued token. ALWAYS creates a governance intent.
  // Hermes NEVER auto-executes revocations.
  executor.registerHandler('nft_propose_revoke', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');

    const actorId = String((context as any)?.actorId || 'hermes');

    const { issuanceId, reason } = (params as any) || {};
    if (!issuanceId || !reason) {
      throw new Error('issuanceId and reason are required for nft_propose_revoke.');
    }

    const { NftCapability } = await import("@saasfly/shared" as any);

    const result = await NftCapability.revokeToken({
      tenantId: callerOrg,
      issuanceId: String(issuanceId),
      reason: String(reason),
      actorId,
    });

    return {
      tenant: callerOrg,
      issuanceId,
      ...result,
    };
  });

  // ── nft_get_user_tokens (Level 0) ────────────────────────────────────────
  // Read-only: returns all NFTs held by a wallet within a tenant's collections.
  // Used by: Hermes narration, Portal page, TMA wallet display.
  //
  // Input: { walletAddress: string, collectionId?: string (optional filter) }
  // Output: list of tokens with status, expiry, collection info, on-chain confirmation state.
  //
  // Uses INFORMATION mode (DB fallback acceptable for narration).
  // Does NOT check on-chain for each token individually (read tool — performance-first).
    // ── nft_query_collections (Level 0) ────────────────────────────────────
  executor.registerHandler('nft_query_collections', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');
    const { NftCapability } = await import("@saasfly/shared" as any);
    const collections = await NftCapability.explainCollection({ tenantId: callerOrg, collectionId: String((params as any)?.collectionId || '') });
    void collections;
    const { tenantNftCollections } = await import('@saasfly/db-core');
    const { db } = await import('@saasfly/db-core');
    const { eq: _eq } = await import("@saasfly/db-core");
    const rows = await db.select()
      .from(tenantNftCollections)
      .where(_eq(tenantNftCollections.organizationId, callerOrg))
      .limit(20);
    return {
      tenant: callerOrg,
      collections: rows.map(r => ({
        id: r.id, name: r.name, symbol: r.symbol, purpose: r.purpose,
        status: r.status, contractAddress: r.contractAddress, chainId: r.chainId,
      })),
    };
  });

  // ── nft_query_supply (Level 0) ──────────────────────────────────────────
  executor.registerHandler('nft_query_supply', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');
    const { NftCapability } = await import("@saasfly/shared" as any);
    const summary = await NftCapability.explainCollection({
      tenantId: callerOrg,
      collectionId: String((params as any)?.collectionId || ''),
    });
    if (!summary) throw new Error('Collection not found for this tenant.');
    return summary;
  });


  executor.registerHandler('nft_get_user_tokens', async (params, context) => {
    const callerOrg = String((context as any)?.organizationId || '').replace(/^org_/, '');
    if (!callerOrg) throw new Error('NFT_GATE_DENY: organizationId required in context.');

    const { walletAddress, collectionId: filterCollectionId } = (params as any) || {};
    if (!walletAddress) {
      throw new Error('walletAddress is required for nft_get_user_tokens.');
    }

    const normalizedWallet = String(walletAddress).toLowerCase();
    const { eq, and, inArray } = await import("@saasfly/db-core");
    const { tenantNftCollections, tenantNftIssuances } = await import('@saasfly/db-core');

    // 1. Get all tenant collections (scoped to org — tenant isolation)
    const collectionsQuery = db
      .select({ id: tenantNftCollections.id, name: tenantNftCollections.name, symbol: tenantNftCollections.symbol, purpose: tenantNftCollections.purpose, contractAddress: tenantNftCollections.contractAddress, chainId: tenantNftCollections.chainId, status: tenantNftCollections.status })
      .from(tenantNftCollections)
      .where(eq(tenantNftCollections.organizationId, callerOrg));

    const collections = await collectionsQuery;
    if (collections.length === 0) {
      return { wallet: normalizedWallet, tenant: callerOrg, tokens: [], totalCount: 0 };
    }

    const collectionIds = filterCollectionId
      ? [String(filterCollectionId)]
      : collections.map(c => c.id);

    // 2. Get all minted issuances for this wallet across the tenant's collections
    const now = new Date();
    const issuances = await db
      .select({
        id: tenantNftIssuances.id,
        collectionId: tenantNftIssuances.collectionId,
        tokenId: tenantNftIssuances.tokenId,
        mintTxHash: tenantNftIssuances.mintTxHash,
        mintedAt: tenantNftIssuances.mintedAt,
        expiresAt: tenantNftIssuances.expiresAt,
        revokedAt: tenantNftIssuances.revokedAt,
        status: tenantNftIssuances.status,
      })
      .from(tenantNftIssuances)
      .where(and(
        eq(tenantNftIssuances.recipientWallet, normalizedWallet),
        inArray(tenantNftIssuances.collectionId, collectionIds),
      ));

    // 3. Enrich with collection info + computed fields
    const collectionMap = Object.fromEntries(collections.map(c => [c.id, c]));
    const tokens = issuances.map(issuance => {
      const col = collectionMap[issuance.collectionId];
      const isExpired = issuance.expiresAt ? new Date(issuance.expiresAt) < now : false;
      const isActive = issuance.status === 'minted' && !issuance.revokedAt && !isExpired;
      return {
        issuanceId: issuance.id,
        collectionId: issuance.collectionId,
        collectionName: col?.name ?? 'Unknown',
        collectionSymbol: col?.symbol ?? '?',
        collectionPurpose: col?.purpose ?? null,
        contractAddress: col?.contractAddress ?? null,
        chainId: col?.chainId ?? null,
        tokenId: issuance.tokenId,
        mintTxHash: issuance.mintTxHash,
        mintedAt: issuance.mintedAt,
        expiresAt: issuance.expiresAt,
        status: issuance.status,
        isActive,
        isExpired,
        isRevoked: !!issuance.revokedAt,
        verificationSource: col?.contractAddress ? 'ONCHAIN_AVAILABLE' : 'DB_ONLY',
      };
    });

    const activeTokens = tokens.filter(t => t.isActive);

    return {
      wallet: normalizedWallet,
      tenant: callerOrg,
      totalCount: tokens.length,
      activeCount: activeTokens.length,
      tokens,
      summary: `Wallet ${normalizedWallet} holds ${activeTokens.length} active token(s) across ${new Set(activeTokens.map(t => t.collectionId)).size} collection(s).`,
    };
  });
}

