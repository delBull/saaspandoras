/**
 * 📢 Hermes OS — Proactive Notification Dispatcher
 * apps/dashboard/src/lib/hermes/notifications/notification-dispatcher.ts
 *
 * Central dispatcher that delivers real-time, proactive Telegram notifications
 * to verified tenant operators via @pandorasHermes_bot.
 *
 * Invariants:
 * 1. Multi-tenant isolation: recipients are resolved through the SAME chain as
 *    HermesTenantMembershipService (telegramId -> wallet [users + telegram_bindings]
 *    -> dao_members of the target project, PLUS portal-linked operators via
 *    channel_identity_bindings / RULE 4). Global platform admins are included
 *    ONLY when HERMES_NOTIFY_GLOBAL_ADMINS === 'true' (explicit opt-in).
 * 2. Deep-link preservation: notifications embed WebApp buttons targeting /tma?tenant=<orgId>.
 * 3. Sanitized presentation: all user-supplied content is escaped via escapeHtml.
 * 4. In-memory anti-spam & deduplication window; security dedupe keys include a
 *    detail hash so distinct incidents of the same type are never dropped.
 *
 * Note: `role` on NotifiableOperator is an informational label only — dao_members
 * has no role column; membership authority is enforced by the TMA BFF, not here.
 */

import { db } from '@/db';
import { users, projects, daoMembers, telegramBindings, channelIdentityBindings } from '@/db/schema';
import { eq, or, inArray, and, isNotNull, sql } from 'drizzle-orm';
import { createHash } from 'crypto';
import { sendTelegramMessage } from '@/lib/hermes/telegram-runtime/router';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export interface FactDiscoveredPayload {
  factId: string;
  dimension: string;
  key: string;
  content: string;
  source?: string;
}

export interface HumanEscalationPayload {
  chatId: string;
  reason: string;
  summary?: string;
  conversationId?: string;
  customerName?: string;
}

export interface SecurityAlertPayload {
  eventType: string;
  severity: 'INFO' | 'WARN' | 'CRITICAL' | string;
  detail: string;
}

export interface MediaCoActivationPayload {
  capability: string;
  label: string;
  requestedBy: string;
  requestId: string;
}

export interface NotifiableOperator {
  telegramUserId: string;
  name?: string;
  role: 'OWNER' | 'ADMIN' | 'OPERATOR';
}

interface ProjectContext {
  organizationId: string;
  name: string;
}

export class HermesNotificationDispatcher {
  private botToken: string;
  private tmaBaseUrl: string;
  private dedupeWindowMs: number;
  private recentDispatches = new Map<string, number>();

  constructor(opts?: { botToken?: string; tmaBaseUrl?: string; dedupeWindowMs?: number }) {
    this.botToken = opts?.botToken ||
      process.env.HERMES_BOT_TOKEN ||
      process.env.TELEGRAM_BOT_TOKEN ||
      '';
    this.tmaBaseUrl = (opts?.tmaBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://dash.pandoras.finance').replace(/\/$/, '');
    this.dedupeWindowMs = opts?.dedupeWindowMs ?? 60_000;
  }

  /**
   * Resolves the canonical project context (UUID + display title) for an org id/slug.
   */
  async resolveProjectContext(organizationId: string): Promise<ProjectContext | null> {
    if (!organizationId) return null;

    const cleanOrgId = organizationId.replace(/^org_/, '').trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanOrgId);

    const [project] = await db
      .select({
        organizationId: projects.organizationId,
        title: projects.title,
        slug: projects.slug,
      })
      .from(projects)
      .where(
        or(
          ...(isUuid ? [eq(projects.organizationId, cleanOrgId)] : []),
          eq(projects.slug, cleanOrgId),
          eq(projects.slug, organizationId)
        )
      )
      .limit(1);

    if (!project) return null;

    return {
      organizationId: project.organizationId || project.slug,
      name: project.title || project.slug,
    };
  }

  /**
   * Resolves verified tenant operators through the same chain as the membership service:
   * wallets in dao_members(project) <- users.walletAddress OR telegram_bindings.walletAddress.
   * DB errors propagate (no silent zero-notification).
   */
  async getNotifiableOperators(organizationId: string): Promise<NotifiableOperator[]> {
    if (!organizationId) return [];

    const ctx = await this.resolveProjectContext(organizationId);
    if (!ctx) return [];
    const isUuidCtx = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ctx.organizationId);

    const [projectRow] = await db
      .select({ id: projects.id, slug: projects.slug })
      .from(projects)
      .where(
        isUuidCtx
          ? eq(projects.organizationId, ctx.organizationId)
          : eq(projects.slug, organizationId)
      )
      .limit(1);

    if (!projectRow) return [];

    const recipients = new Map<string, NotifiableOperator>();

    // Mismo criterio de membresía que HermesTenantMembershipService:
    // wallets en dao_members del proyecto objetivo.
    const memberWallets = (
      await db
        .select({ wallet: daoMembers.wallet })
        .from(daoMembers)
        .where(eq(daoMembers.projectId, projectRow.id))
        .limit(50)
    ).map(d => d.wallet?.toLowerCase()).filter((w): w is string => Boolean(w));

    if (memberWallets.length > 0) {
      const operatorUsers = await db
        .select({
          telegramId: users.telegramId,
          name: users.name,
        })
        .from(users)
        .where(
          and(
            inArray(users.walletAddress, memberWallets),
            isNotNull(users.telegramId)
          )
        )
        .limit(50);

      for (const op of operatorUsers) {
        if (op.telegramId && !recipients.has(op.telegramId)) {
          recipients.set(op.telegramId, {
            telegramUserId: op.telegramId,
            name: op.name || undefined,
            role: 'OPERATOR',
          });
        }
      }

      // Bindings secundarios (telegram_bindings), igual que el membership service.
      const bindingRows = await db
        .select({ telegramUserId: telegramBindings.telegramUserId })
        .from(telegramBindings)
        .where(inArray(sql`lower(${telegramBindings.walletAddress})`, memberWallets))
        .limit(50);

      for (const b of bindingRows) {
        if (!recipients.has(b.telegramUserId)) {
          recipients.set(b.telegramUserId, {
            telegramUserId: b.telegramUserId,
            role: 'OPERATOR',
          });
        }
      }
    }

    // Operadores vinculados desde el Portal de Hermes (channel_identity_bindings),
    // misma fuente que HermesTenantMembershipService RULE 4. Solo IDs numéricos.
    const identityKeys = Array.from(
      new Set([ctx.organizationId, projectRow.slug].filter((v): v is string => Boolean(v)))
    );
    const cibRows = await db
      .select({ externalUserId: channelIdentityBindings.externalUserId })
      .from(channelIdentityBindings)
      .where(
        and(
          eq(channelIdentityBindings.channel, 'telegram'),
          eq(channelIdentityBindings.status, 'ACTIVE'),
          inArray(channelIdentityBindings.identityId, identityKeys)
        )
      )
      .limit(50);

    for (const row of cibRows) {
      const tgId = String(row.externalUserId || '');
      if (/^\d{3,20}$/.test(tgId) && !recipients.has(tgId)) {
        recipients.set(tgId, { telegramUserId: tgId, role: 'OPERATOR' });
      }
    }

    // Fan-out global SOLO con opt-in explícito (invariante #1 por defecto).
    if (process.env.HERMES_NOTIFY_GLOBAL_ADMINS === 'true') {
      const adminUsers = await db
        .select({ telegramId: users.telegramId, name: users.name })
        .from(users)
        .where(and(eq(users.role, 'admin'), isNotNull(users.telegramId)))
        .limit(20);

      for (const admin of adminUsers) {
        if (admin.telegramId && !recipients.has(admin.telegramId)) {
          recipients.set(admin.telegramId, {
            telegramUserId: admin.telegramId,
            name: admin.name || undefined,
            role: 'ADMIN',
          });
        }
      }
    }

    return Array.from(recipients.values());
  }

  /**
   * Internal deduplication guard. Returns true if dispatch is allowed, false if duplicate within window.
   */
  private checkDedupe(key: string): boolean {
    const now = Date.now();
    const last = this.recentDispatches.get(key);

    if (last && now - last < this.dedupeWindowMs) {
      return false;
    }

    this.recentDispatches.set(key, now);

    if (this.recentDispatches.size > 200) {
      for (const [k, ts] of this.recentDispatches.entries()) {
        if (now - ts > 300_000) {
          this.recentDispatches.delete(k);
        }
      }
    }

    return true;
  }

  private buildWebAppKeyboard(label: string, organizationId: string) {
    return {
      inline_keyboard: [
        [
          {
            text: label,
            web_app: {
              url: `${this.tmaBaseUrl}/tma?tenant=${encodeURIComponent(organizationId)}`,
            },
          },
        ],
      ],
    };
  }

  private async deliverToOperators(
    operators: NotifiableOperator[],
    messageHtml: string,
    keyboard: ReturnType<HermesNotificationDispatcher['buildWebAppKeyboard']>
  ): Promise<number> {
    let deliveredCount = 0;
    for (const op of operators) {
      try {
        const chatId = Number(op.telegramUserId);
        if (!isNaN(chatId)) {
          await sendTelegramMessage(this.botToken, chatId, messageHtml, keyboard);
          deliveredCount++;
        }
      } catch (err: any) {
        console.error(`[HermesNotificationDispatcher] Failed to deliver to ${op.telegramUserId}:`, err?.message);
      }
    }
    return deliveredCount;
  }

  /**
   * Dispatches a notification when a new fact is discovered and awaiting approval in KNOW Vault.
   */
  async dispatchFactDiscovered(
    organizationId: string,
    organizationName: string,
    payload: FactDiscoveredPayload
  ): Promise<number> {
    const dedupeKey = `fact:${organizationId}:${payload.factId}`;
    if (!this.checkDedupe(dedupeKey)) {
      return 0;
    }

    const operators = await this.getNotifiableOperators(organizationId);
    if (operators.length === 0 || !this.botToken) return 0;

    let displayName = organizationName;
    if (!displayName || displayName === organizationId || /^[0-9a-f-]{36}$/i.test(displayName)) {
      const ctx = await this.resolveProjectContext(organizationId);
      displayName = ctx?.name || organizationId;
    }

    const messageHtml =
      `🧠 <b>Nuevo Hecho en Bóveda KNOW</b>\n\n` +
      `🏢 <b>Workspace:</b> <code>${escapeHtml(displayName)}</code>\n` +
      `🏷️ <b>Dimensión:</b> <code>${escapeHtml(payload.dimension)}</code>\n` +
      `🔑 <b>Clave:</b> <b>${escapeHtml(payload.key)}</b>\n\n` +
      `<i>"${escapeHtml(payload.content)}"</i>\n\n` +
      `⚡ <i>Requiere validación 1-Tap en la Mini App.</i>`;

    return this.deliverToOperators(
      operators,
      messageHtml,
      this.buildWebAppKeyboard('📱 Validar en Mini App', organizationId)
    );
  }

  /**
   * Dispatches an urgent alert when a customer conversation triggers a Human Escalation request.
   */
  async dispatchHumanEscalation(
    organizationId: string,
    organizationName: string,
    payload: HumanEscalationPayload
  ): Promise<number> {
    const dedupeKey = `escalation:${organizationId}:${payload.chatId}:${payload.reason}`;
    if (!this.checkDedupe(dedupeKey)) {
      return 0;
    }

    const operators = await this.getNotifiableOperators(organizationId);
    if (operators.length === 0 || !this.botToken) return 0;

    let displayName = organizationName;
    if (!displayName || displayName === organizationId || /^[0-9a-f-]{36}$/i.test(displayName)) {
      const ctx = await this.resolveProjectContext(organizationId);
      displayName = ctx?.name || organizationId;
    }

    const messageHtml =
      `🚨 <b>Escalación a Asesor Humano</b>\n\n` +
      `🏢 <b>Workspace:</b> <code>${escapeHtml(displayName)}</code>\n` +
      `💬 <b>Canal / Chat:</b> <code>${escapeHtml(payload.chatId)}</code>\n` +
      `⚠️ <b>Razón:</b> <b>${escapeHtml(payload.reason)}</b>\n` +
      (payload.summary ? `\n📝 <b>Resumen:</b> <i>${escapeHtml(payload.summary)}</i>\n` : '') +
      `\n⚡ <i>Un prospecto requiere intervención humana inmediata.</i>`;

    return this.deliverToOperators(
      operators,
      messageHtml,
      this.buildWebAppKeyboard('📱 Abrir Command Center', organizationId)
    );
  }

  /**
   * Dispatches a notification when a tenant requests activation of a Media Co
   * capability (self-service request flow routed to operators + opted-in admins).
   * @returns number of operators notified (0 = none configured or muted by dedupe).
   */
  async dispatchMediaCoActivationRequest(
    organizationId: string,
    organizationName: string,
    payload: MediaCoActivationPayload
  ): Promise<number> {
    const dedupeKey = `media_activation:${organizationId}:${payload.requestId}`;
    if (!this.checkDedupe(dedupeKey)) {
      return 0;
    }

    const operators = await this.getNotifiableOperators(organizationId);
    if (operators.length === 0 || !this.botToken) return 0;

    const messageHtml =
      `🎨 <b>Solicitud de Activación — Media Co</b>\n\n` +
      `🏢 <b>Workspace:</b> <code>${escapeHtml(organizationName)}</code>\n` +
      `🛠️ <b>Capacidad:</b> <b>${escapeHtml(payload.label)}</b> (<code>${escapeHtml(payload.capability)}</code>)\n` +
      `🎫 <b>Req:</b> <code>${escapeHtml(payload.requestId)}</code>\n\n` +
      `⚡ <i>La activación será aprobada por el equipo Hermes. Esta será una capacidad paga.</i>`;

    return this.deliverToOperators(
      operators,
      messageHtml,
      this.buildWebAppKeyboard('🎨 Abrir Media Studio', organizationId)
    );
  }

  /**
   * Dispatches a security or IPFS durability degradation alert.
   */
  async dispatchSecurityAlert(
    organizationId: string,
    organizationName: string,
    payload: SecurityAlertPayload
  ): Promise<number> {
    const detailHash = createHash('sha256').update(payload.detail).digest('hex').slice(0, 12);
    const dedupeKey = `security:${organizationId}:${payload.eventType}:${payload.severity}:${detailHash}`;
    if (!this.checkDedupe(dedupeKey)) {
      return 0;
    }

    const operators = await this.getNotifiableOperators(organizationId);
    if (operators.length === 0 || !this.botToken) return 0;

    let displayName = organizationName;
    if (!displayName || displayName === organizationId || /^[0-9a-f-]{36}$/i.test(displayName)) {
      const ctx = await this.resolveProjectContext(organizationId);
      displayName = ctx?.name || organizationId;
    }

    const icon = payload.severity === 'CRITICAL' ? '⛔' : '🛡️';
    const messageHtml =
      `${icon} <b>Alerta de Seguridad Hermes (K26)</b>\n\n` +
      `🏢 <b>Workspace:</b> <code>${escapeHtml(displayName)}</code>\n` +
      `🔍 <b>Evento:</b> <code>${escapeHtml(payload.eventType)}</code>\n` +
      `📊 <b>Severidad:</b> <b>${escapeHtml(payload.severity)}</b>\n\n` +
      `<i>${escapeHtml(payload.detail)}</i>`;

    return this.deliverToOperators(
      operators,
      messageHtml,
      this.buildWebAppKeyboard('📱 Ver Estado en Mini App', organizationId)
    );
  }
}
