/**
 * 📧 Tenant Provision Mailer — emails por tipo de acción
 * src/lib/email/tenant-provision-mailer.ts
 *
 * Un mailer, tres templates según la acción real:
 *  - PLAN_UPGRADE   → upgrade comercial clásico (sandbox → starter/growth/enterprise),
 *                     considerando targeting por vertical (productFamily o ALL).
 *  - FULL_ACCESS    → pase directo sin cobro (Super Admin o aprobado desde el muro).
 *  - REJECT/UNKNOWN → no envía (fail-safe).
 *
 * Política (Marco, Oct-2026): el email ES NOTIFICACIÓN, no autorización — su
 * fallo jamás revierte la provisión ya ejecutada (los llamadores ya están
 * envuelto en try/catch no-bloqueante).
 */

import { resolveEmailBranding } from "../email-engine/branding";
import { renderEmailAsync } from "../email-engine/render-email";
import { HermesNotificationTemplate } from "../email-engine/templates/hermes/HermesNotificationTemplate";
import { sendEmail } from "../email-engine/send";

const BRAND = "Pandora's Growth OS";
const DEFAULT_FALLBACK_EMAIL = 'marco@pandoras.finance';

type ProvisionAction = 'PLAN_UPGRADE' | 'FULL_ACCESS';

function familiesLabel(families?: string[]): string {
    if (!families || families.length === 0) return 'Todas las verticales';
    return families.join(', ');
}

export async function sendTenantProvisionEmail(
    email: string,
    tenantName: string,
    planOrAction: string,
    opts?: {
        action?: ProvisionAction;
        families?: string[];        // concretamente qué se activó
        productFamily?: string;     // targeting por vertical (Upgrade clásico)
        requestedBy?: string;       // quien ejecutó (wallet o token)
        approvedVia?: 'DIRECT_PASS' | 'APPROVAL_WALL' | 'CLASSIC_UPGRADE';
        billingExempt?: boolean;    // pase directo sin cobro
    }
) {
    // ── Resolve action ───────────────────────────────────────────────────
    let action: ProvisionAction = opts?.action || (
        /full[- ]?access/i.test(planOrAction) ? 'FULL_ACCESS' : 'PLAN_UPGRADE'
    );

    // Denied plans/unknown values → no mail (no inventar)
    if (action === 'PLAN_UPGRADE' && !/^(sandbox|starter|growth|enterprise)$/i.test(planOrAction)) {
        return { success: false, error: 'Plan not recognized — email skipped' };
    }

    // ── Routing del mail (destinatario) ──────────────────────────────────
    const to = email || DEFAULT_FALLBACK_EMAIL;

    try {
        let subject = '';
        let details: string[] = [];

        if (action === 'FULL_ACCESS') {
            const via = opts?.approvedVia === 'APPROVAL_WALL'
                ? 'aprobado desde el Muro de Aprobaciones'
                : 'Pase Directo de Super Admin';
            subject = `🔓 Full Access activado: ${tenantName}`;
            details = [
                `Tenant: ${tenantName}`,
                `Método de Aprobación: ${via}`,
                `Verticales Activadas: ${familiesLabel(opts?.families)}`,
                `Nivel de Acceso: enterprise${opts?.billingExempt !== false ? ' · sin cobro (billing exempt)' : ''}`,
                ...(opts?.requestedBy ? [`Ejecutado por: ${opts.requestedBy}`] : []),
            ];
        } else {
            // PLAN_UPGRADE clásico — reconocer targeting por vertical
            const target = opts?.productFamily
                ? `aplicado a la vertical ${opts.productFamily}`
                : 'aplicado a todas las verticales provisionadas';
            subject = `📈 Plan actualizado: ${tenantName} → ${planOrAction.toUpperCase()}`;
            details = [
                `Tenant: ${tenantName}`,
                `Nuevo Plan Asignado: ${planOrAction.toUpperCase()} (${target})`,
                ...(opts?.requestedBy ? [`Ejecutado por: ${opts.requestedBy}`] : []),
                'Los módulos y capacidades correspondientes ya están activos en el ecosistema del tenant.',
            ];
        }

        const branding = await resolveEmailBranding({
            explicitBrand: {
                name: BRAND,
                isPandorasPlatform: true,
            },
        });

        const rendered = await renderEmailAsync({
            template: HermesNotificationTemplate,
            props: {
                branding,
                title: subject,
                recipientName: tenantName,
                message: details.join('\n\n'),
                badge: action === 'FULL_ACCESS' ? 'Full Access Activo' : 'Upgrade Plan',
                type: 'success',
                ctaText: 'Ir a mi Panel de Control →',
                ctaUrl: 'https://dash.pandoras.finance',
            },
        });

        const sendResult = await sendEmail({
            from: "Pandoras Growth OS <system@pandoras.finance>",
            to: [to],
            subject,
            html: rendered.html,
            text: rendered.text,
        });

        if (!sendResult.success) {
            return { success: false, error: sendResult.error };
        }
        return { success: true, id: sendResult.id, action };
    } catch (error: any) {
        // Email es notificación — fallo jamás revierte la provisión.
        console.error("[Tenant Mailer Error]:", error?.message || error);
        return { success: false, error: error?.message || String(error) };
    }
}
