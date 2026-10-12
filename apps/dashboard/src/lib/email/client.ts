
import { sendEmail as sharedSendEmail } from '@saasfly/shared';

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@pandoras.finance';

interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    attachments?: {
        content: string; // Base64 or plain content if using Resend SDK, but via API it expects `content` (base64) + `filename`.
        filename: string;
        content_type?: string;
    }[];
}

export async function sendEmail({ to, subject, html, from = FROM_EMAIL, attachments }: SendEmailParams) {
    const result = await sharedSendEmail({
        to,
        subject,
        html,
        from,
        attachments,
    });

    if (!result.success) {
        throw new Error(`Resend API Error: ${result.error}`);
    }

    return { success: true, id: result.id };
}
