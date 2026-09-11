/**
 * 🛠️ Hermes Executive Sovereign Plane — Multi-Step Planner & Operational Execution (Tier 2)
 * apps/dashboard/src/lib/hermes/executive/executive-planner.ts
 *
 * Implements two-phase execution:
 * 1. Plan preparation & pre-flight risk evaluation (blast radius, required capability).
 * 2. Explicit confirmation check ("confirmo" / "ejecuta") -> canonical dispatch & immutable audit logging.
 */

import { db } from '@/db';
import { hermesTenantCredits, projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { ExecutiveActionType, ExecutivePlan } from './types';
import { InterlocutorResolver } from '@/lib/hermes/identity/interlocutor-resolver';
import { SecurityAuditLogger } from '@/lib/pandoras/core/domains/hermes/runtime/security-audit-logger';
import { TenantCreditLedgerService } from '@/lib/hermes/compute/tenant-credit-ledger.service';
import {
  createOrUpdateCollaborator,
  updateCollaboratorPermissions,
} from '@/lib/nexus/collaborators-service';

export interface CreatePlanParams {
  action: ExecutiveActionType;
  target: string;
  payload: Record<string, any>;
  title: string;
  description: string;
  blastRadius?: 'LOW' | 'MEDIUM' | 'HIGH';
  interlocutor: any;
  founderKey?: string;
}

export class ExecutivePlanner {
  private static readonly PLAN_TTL_MS = 15 * 60 * 1000; // 15 minutos
  private static pendingPlans: Map<string, ExecutivePlan> = new Map();

  /**
   * Generates a pending execution plan after validating capability.
   */
  public static createPlan(params: CreatePlanParams): { ok: boolean; plan?: ExecutivePlan; reviewCard: string; error?: string } {
    const founderKey = params.founderKey || 'marco_founder';

    // 1. Verify capability FOUNDER_OPERATOR
    if (!InterlocutorResolver.hasFounderCapability(params.interlocutor, 'FOUNDER_OPERATOR')) {
      return {
        ok: false,
        reviewCard: '⛔ **Acceso Denegado:** No posees la capability `FOUNDER_OPERATOR` para formular planes operativos.',
        error: 'MISSING_CAPABILITY_FOUNDER_OPERATOR',
      };
    }

    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    const plan: ExecutivePlan = {
      id: planId,
      action: params.action,
      title: params.title,
      description: params.description,
      target: params.target,
      payload: params.payload,
      blastRadius: params.blastRadius || 'MEDIUM',
      requiredCapability: 'FOUNDER_OPERATOR',
      status: 'PENDING_CONFIRMATION',
      createdAt: now,
      expiresAt: now + this.PLAN_TTL_MS,
    };

    this.pendingPlans.set(founderKey, plan);

    const reviewCard = [
      `📋 **Plan Operativo Preparado (Tier 2)**`,
      ``,
      `• **Acción:** ${plan.title}`,
      `• **Objetivo:** \`${plan.target}\``,
      `• **Detalles:** ${plan.description}`,
      `• **Blast Radius:** \`${plan.blastRadius}\``,
      `• **Expiración:** En 15 minutos`,
      ``,
      `⚠️ *Esta acción mutará el estado del sistema mediante APIs canónicas.*`,
      `Para ejecutar este plan, responde **"confirmo"** o presiona **/confirm**.`,
      `Para descartarlo, responde **"cancela"** o presiona **/cancel**.`,
    ].join('\n');

    return {
      ok: true,
      plan,
      reviewCard,
    };
  }

  /**
   * Retrieves any active pending plan for the founder session.
   */
  public static getPendingPlan(founderKey: string = 'marco_founder'): ExecutivePlan | null {
    const plan = this.pendingPlans.get(founderKey);
    if (!plan) return null;

    if (Date.now() > plan.expiresAt) {
      this.pendingPlans.delete(founderKey);
      return null;
    }

    return plan;
  }

  /**
   * Explicitly cancels and purges the pending plan.
   */
  public static cancelPlan(founderKey: string = 'marco_founder'): { cancelled: boolean; message: string } {
    const plan = this.getPendingPlan(founderKey);
    if (!plan) {
      return {
        cancelled: false,
        message: 'No hay ningún plan operativo pendiente para cancelar.',
      };
    }

    this.pendingPlans.delete(founderKey);
    return {
      cancelled: true,
      message: `🚫 **Plan Cancelado:** La acción \`${plan.title}\` sobre \`${plan.target}\` ha sido descartada sin mutar el sistema.`,
    };
  }

  /**
   * Executes the pending plan via canonical services and records immutable audit log.
   */
  public static async executePlan(
    founderKey: string = 'marco_founder',
    interlocutor: any
  ): Promise<{ success: boolean; message: string; plan?: ExecutivePlan; auditRecordId?: string }> {
    const plan = this.getPendingPlan(founderKey);
    if (!plan) {
      return {
        success: false,
        message: '⚠️ No hay ningún plan operativo pendiente de confirmación o ha expirado.',
      };
    }

    // Defense-in-depth: Re-check capability upon execution
    if (!InterlocutorResolver.hasFounderCapability(interlocutor, plan.requiredCapability)) {
      return {
        success: false,
        message: `⛔ **Acceso Denegado:** Se requiere la capability \`${plan.requiredCapability}\` para ejecutar este plan.`,
      };
    }

    let executionMessage = '';
    let executionData: any = {};
    let auditRecordId = '';

    try {
      switch (plan.action) {
        case 'TOPUP_CREDITS': {
          const tenantId = plan.target.toLowerCase().trim();
          const amountUsd = Number(plan.payload.amountUsd || 0);

          if (isNaN(amountUsd) || amountUsd <= 0) {
            throw new Error(`Monto inválido para recarga: ${plan.payload.amountUsd}`);
          }

          let newBalance = amountUsd;
          if (db) {
            const existing = await db.query.hermesTenantCredits.findFirst({
              where: eq(hermesTenantCredits.tenantId, tenantId),
            });

            if (existing) {
              const currentBal = parseFloat(existing.creditBalanceUsd || '0');
              const currentDep = parseFloat(existing.totalDepositedUsd || '0');
              newBalance = Number((currentBal + amountUsd).toFixed(4));
              const newDeposited = Number((currentDep + amountUsd).toFixed(4));

              await db
                .update(hermesTenantCredits)
                .set({
                  creditBalanceUsd: newBalance.toFixed(4),
                  totalDepositedUsd: newDeposited.toFixed(4),
                  updatedAt: new Date(),
                })
                .where(eq(hermesTenantCredits.tenantId, tenantId));
            } else {
              await db.insert(hermesTenantCredits).values({
                id: `cred_${tenantId}`,
                tenantId,
                creditBalanceUsd: amountUsd.toFixed(4),
                totalDepositedUsd: amountUsd.toFixed(4),
                totalSpentUsd: '0.0000',
                markupPercentage: TenantCreditLedgerService.DEFAULT_MARKUP_PERCENTAGE,
                isSandboxEnabled: true,
                sandboxBalanceUsd: '0.0000',
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            }
          }

          // Update memory ledger cache
          TenantCreditLedgerService.updateInMemoryCredits(tenantId, {
            creditBalanceUsd: newBalance,
          });

          // Immutable audit log
          const audit = await SecurityAuditLogger.logEvent({
            organizationId: tenantId,
            actorId: interlocutor?.id || 'marco_founder',
            eventType: 'EXECUTIVE_CREDIT_TOPUP',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: plan.id,
            toolId: 'TenantCreditLedgerService.topUp',
            metadata: {
              tenantId,
              amountUsd,
              newBalanceUsd: newBalance,
              executedBy: 'HermesExecutivePlanner',
            },
          });
          auditRecordId = audit.id;

          executionMessage = `✅ **Fondos Asignados Exitosamente**\n• **Tenant:** \`${tenantId}\`\n• **Monto Acreditado:** \`$${amountUsd.toFixed(2)} USD\`\n• **Nuevo Saldo:** \`$${newBalance.toFixed(2)} USD\`\n• **Audit Trail:** \`${auditRecordId}\``;
          executionData = { tenantId, amountUsd, newBalance };
          break;
        }

        case 'SET_COLLABORATOR_ROLE': {
          const email = plan.target.toLowerCase().trim();
          const role = (plan.payload.role || 'COLLABORATOR').toUpperCase();

          const result = await updateCollaboratorPermissions(email, role, {});
          if (!result.success) {
            throw new Error(`No se encontró el colaborador con email '${email}' para actualizar su rol.`);
          }

          const audit = await SecurityAuditLogger.logEvent({
            organizationId: 'pandoras_nexus',
            actorId: interlocutor?.id || 'marco_founder',
            eventType: 'EXECUTIVE_COLLABORATOR_ROLE_UPDATED',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: plan.id,
            toolId: 'NexusCollaborators.updateCollaboratorPermissions',
            metadata: { email, newRole: role },
          });
          auditRecordId = audit.id;

          executionMessage = `✅ **Rol de Colaborador Actualizado**\n• **Email:** \`${email}\`\n• **Nuevo Rol:** \`${role}\`\n• **Audit Trail:** \`${auditRecordId}\``;
          executionData = { email, role };
          break;
        }

        case 'INVITE_COLLABORATOR': {
          const email = plan.target.toLowerCase().trim();
          const name = plan.payload.name || email.split('@')[0];
          const role = (plan.payload.role || 'COLLABORATOR').toUpperCase();

          const { collaborator } = await createOrUpdateCollaborator(name, email, role, {});

          const audit = await SecurityAuditLogger.logEvent({
            organizationId: 'pandoras_nexus',
            actorId: interlocutor?.id || 'marco_founder',
            eventType: 'EXECUTIVE_COLLABORATOR_INVITED',
            severity: 'INFO',
            policyDecision: 'ALLOW',
            correlationId: plan.id,
            toolId: 'NexusCollaborators.createOrUpdateCollaborator',
            metadata: { email, name, role, status: collaborator.status },
          });
          auditRecordId = audit.id;

          executionMessage = `✅ **Colaborador Aprovisionado e Invitado**\n• **Nombre:** ${collaborator.name}\n• **Email:** \`${collaborator.email}\`\n• **Rol:** \`${collaborator.role}\`\n• **Estado:** \`${collaborator.status}\`\n• **Audit Trail:** \`${auditRecordId}\``;
          executionData = { email, name, role, status: collaborator.status };
          break;
        }

        case 'SET_TENANT_STATUS': {
          const tenantSlug = plan.target.toLowerCase().trim();
          const status = plan.payload.status || 'active';

          if (db) {
            await db
              .update(projects)
              .set({
                status,
                updatedAt: new Date(),
              })
              .where(eq(projects.slug, tenantSlug));
          }

          const audit = await SecurityAuditLogger.logEvent({
            organizationId: tenantSlug,
            actorId: interlocutor?.id || 'marco_founder',
            eventType: 'EXECUTIVE_TENANT_STATUS_UPDATED',
            severity: 'WARN',
            policyDecision: 'ALLOW',
            correlationId: plan.id,
            toolId: 'ProjectsService.updateStatus',
            metadata: { tenantSlug, newStatus: status },
          });
          auditRecordId = audit.id;

          executionMessage = `✅ **Estado de Tenant Modificado**\n• **Tenant:** \`${tenantSlug}\`\n• **Nuevo Estado:** \`${status.toUpperCase()}\`\n• **Audit Trail:** \`${auditRecordId}\``;
          executionData = { tenantSlug, status };
          break;
        }

        default:
          throw new Error(`Acción ejecutiva desconocida: ${plan.action}`);
      }

      // Mark plan as executed and remove from pending
      plan.status = 'EXECUTED';
      plan.executedAt = Date.now();
      plan.executionResult = { success: true, message: executionMessage, data: executionData };
      this.pendingPlans.delete(founderKey);

      return {
        success: true,
        message: executionMessage,
        plan,
        auditRecordId,
      };
    } catch (err: any) {
      plan.status = 'REJECTED';
      this.pendingPlans.delete(founderKey);

      return {
        success: false,
        message: `❌ **Error al Ejecutar Plan:** ${err?.message || 'Fallo desconocido en la API canónica.'}`,
        plan,
      };
    }
  }

  /**
   * Testing helper: clear all pending plans.
   */
  public static clearPendingPlans(): void {
    this.pendingPlans.clear();
  }
}
