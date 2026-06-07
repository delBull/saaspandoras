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
                            Has sido aceptado(a) oficialmente en el programa de corretaje y gestión de capital de <strong>${projectName}</strong>. 
                            A partir de este momento, eres nuestro socio comercial.
                        </p>
                        
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 24px; text-align: center; margin-bottom: 30px;">
                            <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.05em;">Tu Código Oficial de Referido</p>
                            <div style="font-size: 24px; font-family: monospace; font-weight: 700; color: #0f172a; letter-spacing: 0.1em;">
                                ${referralCode}
                            </div>
                        </div>
                        
                        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 16px;">¿Cómo funciona tu estructura de comisiones?</h3>
                        
                        <ul style="padding-left: 20px; color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
                            <li style="margin-bottom: 10px;"><strong>Bono Directo (4%):</strong> Ganarás el 4% líquido en USDC de todo el capital que levantes con tu código. El pago es automatizado.</li>
                            <li><strong>Yield Residual (1%):</strong> De por vida, ganarás el 1% de todos los rendimientos hoteleros y de rentas que obtengan tus clientes referidos, convirtiéndote en su socio a perpetuidad.</li>
                        </ul>
                        
                        <p style="font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px;">
                            Comparte este código con tus clientes y prospectos. Puedes anexarlo al final del enlace de S'Narai así: <code>snarai.com/?ref=${referralCode}</code>
                        </p>
                        
                        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; text-align: center;">
                            <p style="font-size: 14px; color: #64748b; margin: 0;">
                                Pandoras Growth OS &copy; ${new Date().getFullYear()}<br>
                                Ecosistema Descentralizado de Real World Assets
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
                        <img src="https://dash.pandoras.finance/images/safety-shield.png" alt="Pandoras Shield" width="50" height="50" />
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
