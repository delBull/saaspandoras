import crypto from 'crypto';
import { db } from '@saasfly/db';
import { webhookEvents, integrationClients } from '@saasfly/db/schema';
import { eq, and, isNotNull } from "@saasfly/db-core";

export class WebhookService {
    /**
     * Signs a payload using HMAC-SHA256
     */
    static signPayload(payload: any, secret: string): string {
        const data = JSON.stringify(payload);
        return `sha256=${crypto.createHmac('sha256', secret).update(data).digest('hex')}`;
    }

    /**
     * Queue a webhook event to be sent.
     *
     * Invariant: Events are tenant-scoped by default to prevent cross-tenant data leakage.
     * If clientId === 'system', a targetProjectId or projectScope must be evaluated,
     * delivering only to clients owning that specific project.
     */
    static async queueEvent(
        clientId: string,
        event: string,
        payload: any,
        options: { projectId?: number; isPlatformBroadcast?: boolean } = {}
    ) {
        if (clientId === 'system') {
            // Resolve tenant scope from explicit option, top-level payload, or nested data
            // (real callers pass `data.project_id` nested; scoping MUST NOT degrade to a global broadcast)
            const targetProjectIdRaw =
                options.projectId ??
                payload?.projectId ??
                payload?.data?.project_id ??
                payload?.data?.projectId;

            const numericProjectId = targetProjectIdRaw !== undefined && targetProjectIdRaw !== null && targetProjectIdRaw !== ''
                ? Number(targetProjectIdRaw)
                : NaN;

            const tenantScope = Number.isNaN(numericProjectId)
                ? undefined
                : eq(integrationClients.projectId, numericProjectId);

            if (!tenantScope) {
                // No concrete tenant scope for a 'system' broadcast — refuse to fan out to all tenants.
                console.warn(`[WebhookService] Refusing un-scoped 'system' broadcast for event '${event}': no projectId available.`);
                return;
            }

            // Only broadcast to clients belonging to the specified project
            const activeClients = await db.query.integrationClients.findMany({
                where: and(
                    eq(integrationClients.isActive, true),
                    isNotNull(integrationClients.callbackUrl),
                    tenantScope
                ),
                columns: { id: true, projectId: true },
            });

            if (activeClients.length === 0) {
                // No authorized clients registered for this project scope — skip silently
                return;
            }

            await db.insert(webhookEvents).values(
                activeClients.map(c => ({
                    clientId: c.id,
                    event,
                    payload,
                    status: 'pending' as const,
                    attempts: 0,
                    nextRetryAt: new Date(),
                }))
            );
        } else {
            // Targeted: send to a specific client UUID
            await db.insert(webhookEvents).values({
                clientId,
                event,
                payload,
                status: 'pending',
                attempts: 0,
                nextRetryAt: new Date(),
            });
        }
    }
}

