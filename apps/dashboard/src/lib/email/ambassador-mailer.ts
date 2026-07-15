import { sendEmail } from "./client";

export interface AmbassadorWelcomeProps {
    ambassadorName: string;
    ambassadorEmail: string;
    referralCode: string;
    origin: string; // "pandoras" | "snarai"
}

export async function sendAmbassadorWelcomeEmail({
    ambassadorName,
    ambassadorEmail,
    referralCode,
    origin
}: AmbassadorWelcomeProps) {
    try {
        const projectName = origin === "snarai" ? "S'Narai" : "Pandoras Growth OS";
        const roleName = origin === "snarai" ? "Gestor Patrimonial" : "Ambassador";
        
        const subject = `¡Bienvenido como ${roleName} oficial de ${projectName}! 🚀`;
        
        const htmlContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; padding: 40px 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <div style="background-color: ${origin === 'snarai' ? '#0f172a' : '#000000'}; padding: 40px 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">${projectName}</h1>
                        <p style="color: #94a3b8; margin-top: 10px; font-size: 16px;">Programa de ${roleName}s Oficial</p>
                    </div>
                    
                    <div style="padding: 40px 30px;">
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                            Hola <strong>${ambassadorName}</strong>,
                        </p>
                        
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                            Tu registro como ${roleName} oficial de <strong>${projectName}</strong> ha sido confirmado exitosamente. Bienvenido a nuestro equipo de socios comerciales.
                        </p>
                        
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; text-align: center; margin-bottom: 30px;">
                            <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Tu Código Oficial de Referido</p>
                            <div style="font-size: 24px; font-family: monospace; font-weight: 700; color: #0f172a; letter-spacing: 0.1em;">
                                ${referralCode}
                            </div>
                        </div>
                        
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
                            En los próximos días recibirás más información sobre los detalles operativos, herramientas disponibles y los siguientes pasos para comenzar a operar. Nuestro equipo estará en contacto contigo para resolver cualquier duda.
                        </p>
                        
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
                            Comparte tu código con tus clientes y prospectos para que puedan registrarse en la plataforma.
                        </p>
                        
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center;">
                            <p style="font-size: 14px; color: #64748b; margin: 0;">
                                ${projectName} &copy; ${new Date().getFullYear()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        console.log(`[Ambassador Mailer] Sending welcome email to ${ambassadorEmail}`);
        
        const data = await sendEmail({
            to: [ambassadorEmail],
            subject,
            html: htmlContent,
        });

        return { success: true, id: data.id };
    } catch (error) {
        console.error("[Ambassador Mailer Error]:", error);
        return { success: false, error };
    }
}

export async function sendAmbassadorOTPEmail(email: string, fullName: string, pin: string) {
    try {
        const data = await sendEmail({
            to: email,
            subject: 'Verifica tu identidad - Gestores Patrimoniales',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <div style="text-align: center; padding: 20px;">
                        <img src="https://dash.pandoras.finance/images/logopure.png" alt="Pandoras" width="60" style="display: block; margin: 0 auto;" />
                    </div>
                    <h1 style="color: #111; text-align: center;">Verifica tu identidad</h1>
                    <p>Hola ${fullName},</p>
                    <p>Hemos recibido tu solicitud para unirte al programa de Gestores Patrimoniales. Para continuar con el proceso, por favor ingresa el siguiente código de verificación (OTP) en la plataforma:</p>
                    <div style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #000;">${pin}</span>
                    </div>
                    <p style="color: #666; font-size: 14px; text-align: center;">Este código expirará pronto. Si no has solicitado esto, puedes ignorar este correo.</p>
                </div>
            `,
        });

        console.log(`✅ OTP Email sent to ${email}`);
        return { success: true, data };
    } catch (error) {
        console.error('Error sending ambassador OTP email:', error);
        return { success: false, error };
    }
}
