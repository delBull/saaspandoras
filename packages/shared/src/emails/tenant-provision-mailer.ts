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

import { resend } from "../resend";

const BRAND = "Pandora's Growth OS";
const DEFAULT_FALLBACK_EMAIL = 'marco@pandoras.finance';

type ProvisionAction = 'PLAN_UPGRADE' | 'FULL_ACCESS';

function baseLayout(title: string, bodyLines: string[]): string {
    return `
        <div style="font-family: sans-serif; padding: 40px; background-color: #f4f4f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 8px;">
                <h2 style="color: #0f172a;">${title}</h2>
                ${bodyLines.map(l => `<p style="color: #334155;">${l}</p>`).join('\n')}
                <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">— ${BRAND} · Core Engine</p>
            </div>
        </div>
    `;
}

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
        let html = '';

        if (action === 'FULL_ACCESS') {
            const via = opts?.approvedVia === 'APPROVAL_WALL'
                ? 'aprobado desde el Muro de Aprobaciones'
                : 'Pase Directo de Super Admin';
            subject = `🔓 Full Access activado: ${tenantName}`;
            html = baseLayout('🔓 Organización Provisionada — Full Access', [
                `Tenant: <strong>${tenantName}</strong>`,
                `Método: ${via}`,
                `Verticales activadas: <strong>${familiesLabel(opts?.families)}</strong>`,
                `Plan: <strong>enterprise</strong>${opts?.billingExempt !== false ? ' · <em>sin cobro (billing exempt)</em>' : ''}`,
                opts?.requestedBy ? `Ejecutado por: <code>${opts.requestedBy}</code>` : '',
            ].filter(Boolean));
        } else {
            // PLAN_UPGRADE clásico — reconocer targeting por vertical
            const target = opts?.productFamily
                ? `aplicado a la vertical <strong>${opts.productFamily}</strong>`
                : 'aplicado a <strong>todas las verticales provisionadas</strong>';
            subject = `📈 Plan actualizado: ${tenantName} → ${planOrAction.toUpperCase()}`;
            html = baseLayout('📈 Upgrade Comercial Ejecutado', [
                `Tenant: <strong>${tenantName}</strong>`,
                `Nuevo plan: <strong>${planOrAction.toUpperCase()}</strong> ${target}`,
                opts?.requestedBy ? `Ejecutado por: <code>${opts.requestedBy}</code>` : '',
                'Los módulos y capacidades correspondientes al plan ya están activos en el ecosistema del tenant.',
            ].filter(Boolean));
        }

        const { data, error } = await resend.emails.send({ from: "Pandoras Growth OS <system@pandoras.finance>", to: [to], subject, html });
        if (error) {
            return { success: false, error: error.message };
        }
        return { success: true, id: data?.id, action };
    } catch (error: any) {
        // Email es notificación — fallo jamás revierte la provisión.
        console.error("[Tenant Mailer Error]:", error?.message || error);
        return { success: false, error: error?.message || String(error) };
    }
}
