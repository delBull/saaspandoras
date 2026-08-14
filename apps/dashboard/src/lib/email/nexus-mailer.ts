import { sendEmail } from "./client";

export interface DealRoomReleaseProps {
    email: string;
    roomLabel: string;
    publicId: string;
    company: string;
    counterparty: string;
}

export async function sendDealRoomReleaseEmail({
    email,
    roomLabel,
    publicId,
    company,
    counterparty,
}: DealRoomReleaseProps) {
    try {
        const isSnarai = company.toLowerCase().includes("narai");
        const title = isSnarai ? "S'Narai Nexus" : "Pandora's Nexus";
        const primaryColor = isSnarai ? "#0f172a" : "#000000";
        const buttonColor = isSnarai ? "#10b981" : "#000000";

        const subject = `Nuevo documento disponible: ${roomLabel}`;
        const accessUrl = `https://dash.pandoras.finance/nexus/room/${publicId}`;

        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: ${primaryColor}; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${title}</h1>
                        <p style="color: #94a3b8; margin-top: 10px; font-size: 16px;">Deal Room — ${company}</p>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                            Hola <strong>${counterparty}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                            Un nuevo documento ha sido liberado para tu revisión y firma en el Deal Room institucional.
                        </p>
                        
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; text-align: center; margin-bottom: 30px;">
                            <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Documento Liberado</p>
                            <div style="font-size: 20px; font-weight: 600; color: #0f172a;">
                                ${roomLabel}
                            </div>
                        </div>
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                            <a href="${accessUrl}" style="background-color: ${buttonColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Abrir Deal Room</a>
                        </div>
                        
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center;">
                            <p style="font-size: 14px; color: #64748b; margin: 0;">
                                ${title} &copy; ${new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log(`[Nexus Mailer] Sending deal room release email to ${email}`);
        
        const data = await sendEmail({
            to: [email],
            subject,
            html: htmlContent,
        });

        return { success: true, id: data.id };
    } catch (error) {
        console.error("[Nexus Mailer Error]:", error);
        return { success: false, error };
    }
}
