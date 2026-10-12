import { sendEmail } from "./client";
import { resolveEmailBranding } from "./engine/branding";
import { renderEmailAsync } from "./engine/render-email";
import { PurchaseSuccessTemplate } from "./templates/purchases/PurchaseSuccessTemplate";

/**
 * Public Purchase Mailer Contract
 * Invariant: Parameter signatures and return types are strictly preserved to guarantee zero caller regressions.
 * Uses EmailEngine to render React-Email with fallback to local HTML if render fails.
 */
export async function sendPurchaseEmail(
    to: string, 
    data: { 
        projectName: string;
        projectSlug: string;
        amount: number;
        isReturning: boolean;
        legalConfig: any;
        portalUrl: string;
    }
) {
    const isReturning = data.isReturning;
    const subject = isReturning 
        ? `📜 Adición de Títulos Confirmada - ${data.projectName}` 
        : `🎉 Bienvenido a ${data.projectName} - Participación Confirmada`;

    // Dynamic legal fallbacks
    const agreementUrl = data.legalConfig?.agreementUrl || `https://dash.pandoras.finance/legal/agreement/${data.projectSlug}`;
    const riskUrl = data.legalConfig?.riskUrl || `https://dash.pandoras.finance/legal/risk-disclosure/${data.projectSlug}`;
    const phaseDynamicsUrl = data.legalConfig?.phaseDynamicsUrl || `https://dash.pandoras.finance/legal/phase-dynamics/${data.projectSlug}`;

    let html: string;
    try {
        const branding = await resolveEmailBranding({
            tenantSlug: data.projectSlug,
            explicitBrand: {
                name: data.projectName,
                legalUrls: {
                    agreement: agreementUrl,
                    riskDisclosure: riskUrl,
                    phaseDynamics: phaseDynamicsUrl,
                }
            }
        });

        const rendered = await renderEmailAsync({
            template: PurchaseSuccessTemplate,
            props: {
                branding,
                amount: data.amount,
                isReturning,
                portalUrl: data.portalUrl,
                projectName: data.projectName,
            }
        });
        html = rendered.html;
    } catch (renderError) {
        console.warn("⚠️ [purchase-mailer] Render via EmailEngine failed, executing safe fallback:", renderError);
        const title = isReturning ? "Nuevos Títulos Adquiridos" : "¡Felicidades por tu Participación!";
        const bodyText = isReturning
            ? `Has adquirido exitosamente <strong>${data.amount} título(s) adicionales</strong> en ${data.projectName}. Tu portafolio ha sido actualizado.`
            : `Bienvenido a la comunidad de <strong>${data.projectName}</strong>. Has adquirido <strong>${data.amount} título(s) de participación</strong> exitosamente.`;

        const styles = {
            container: "font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000000; color: #ffffff; border-radius: 8px; border: 1px solid #27272a; overflow: hidden;",
            header: "background: #09090b; padding: 32px 24px; text-align: center; border-bottom: 1px solid #27272a;",
            content: "padding: 40px 24px;",
            buttonContainer: "text-align: center; margin: 32px 0;",
            button: "background: #10b981; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px;",
            footer: "background: #09090b; padding: 24px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a;",
            link: "color: #10b981; text-decoration: none; display: inline-block; margin: 4px;"
        };

        html = `
            <div style="${styles.container}">
                <div style="${styles.header}">
                    <h2 style="margin:0; color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: -0.02em;">${title}</h2>
                </div>
                <div style="${styles.content}">
                    <p style="color: #e4e4e7; font-size: 16px; line-height: 1.6; margin-top: 0;">
                        ${bodyText}
                    </p>
                    <p style="color: #a1a1aa; font-size: 15px; line-height: 1.6;">
                        Tus certificados digitales se han emitido y registrado inmutablemente. Puedes visualizarlos, descargarlos en PDF y revisar tu estado general desde tu Portal de Gestión.
                    </p>
                    <div style="${styles.buttonContainer}">
                        <a href="${data.portalUrl}" style="${styles.button}">
                            Acceder a Mi Portal
                        </a>
                    </div>
                </div>
                <div style="${styles.footer}">
                    <div style="margin-bottom: 16px;">
                        <a href="${agreementUrl}" style="${styles.link}">Acuerdo Marco</a> • 
                        <a href="${riskUrl}" style="${styles.link}">Aviso de Riesgos</a> • 
                        <a href="${phaseDynamicsUrl}" style="${styles.link}">Anexo Comercial</a>
                    </div>
                    <p style="margin: 0;">
                        Enviado por el motor transaccional de <strong>Pandoras Growth OS</strong>.
                    </p>
                </div>
            </div>
        `;
    }

    await sendEmail({
        to,
        subject,
        html,
    });
}
