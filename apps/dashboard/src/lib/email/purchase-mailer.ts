import { sendEmail } from "./client";

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

    const title = isReturning ? "Nuevos Títulos Adquiridos" : "¡Felicidades por tu Participación!";
    const bodyText = isReturning
        ? `Has adquirido exitosamente <strong>${data.amount} título(s) adicionales</strong> en ${data.projectName}. Tu portafolio ha sido actualizado.`
        : `Bienvenido a la comunidad de <strong>${data.projectName}</strong>. Has adquirido <strong>${data.amount} título(s) de participación</strong> exitosamente.`;

    // Dynamic legal fallback
    const agreementUrl = data.legalConfig?.agreementUrl || `https://dash.pandoras.finance/legal/agreement/${data.projectSlug}`;
    const riskUrl = data.legalConfig?.riskUrl || `https://dash.pandoras.finance/legal/risk-disclosure/${data.projectSlug}`;
    const phaseDynamicsUrl = data.legalConfig?.phaseDynamicsUrl || `https://dash.pandoras.finance/legal/phase-dynamics/${data.projectSlug}`;

    const styles = {
        container: "font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #000000; color: #ffffff; border-radius: 8px; border: 1px solid #27272a; overflow: hidden;",
        header: "background: #09090b; padding: 32px 24px; text-align: center; border-bottom: 1px solid #27272a;",
        content: "padding: 40px 24px;",
        buttonContainer: "text-align: center; margin: 32px 0;",
        button: "background: #10b981; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px;",
        footer: "background: #09090b; padding: 24px; text-align: center; font-size: 11px; color: #71717a; border-top: 1px solid #27272a;",
        link: "color: #10b981; text-decoration: none; display: inline-block; margin: 4px;"
    };

    const html = `
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

                <p style="color: #71717a; font-size: 13px; text-align: center;">
                    Si no solicitaste esta participación, por favor ignora este correo.
                </p>
            </div>
            <div style="${styles.footer}">
                <p style="margin-bottom: 12px; font-size: 10px; color: #52525b;">
                    Al participar, aceptas nuestros documentos legales y normativos vigentes:
                </p>
                <div style="margin-bottom: 16px;">
                    <a href="${agreementUrl}" style="${styles.link}">Acuerdo Marco de Participación</a> • 
                    <a href="${riskUrl}" style="${styles.link}">Aviso Integral de Riesgos</a> • 
                    <a href="${phaseDynamicsUrl}" style="${styles.link}">Anexo Comercial y Fases</a>
                </div>
                <p style="margin: 0;">
                    Enviado por el motor transaccional de <strong>Pandoras Growth OS</strong>.
                </p>
            </div>
        </div>
    `;

    await sendEmail({
        to,
        subject,
        html,
    });
}
