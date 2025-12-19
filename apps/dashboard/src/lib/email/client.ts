
const RESEND_API_KEY = process.env.RESEND_API_KEY;
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
    if (!RESEND_API_KEY) {
        console.warn('⚠️ [EmailClient] RESEND_API_KEY missing. Mocking send to:', to);
        return { success: true, id: 'mock-id' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from,
                to,
                subject,
                html,
                attachments
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Resend API Error: ${error}`);
        }

        const data = await response.json();
        return { success: true, id: data.id };
    } catch (error) {
        console.error('❌ [EmailClient] Failed to send email:', error);
        throw error;
    }
}
