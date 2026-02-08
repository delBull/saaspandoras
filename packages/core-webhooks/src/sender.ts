import { signRawBody } from './signer';
import { PandoraWebhookEvent } from './types';

export interface SendWebhookResult {
    success: boolean;
    statusCode?: number;
    error?: string;
}

/**
 * Sends a signed webhook event to the specified URL.
 */
export async function sendWebhook(
    url: string,
    secret: string,
    event: PandoraWebhookEvent,
): Promise<SendWebhookResult> {
    try {
        const jsonString = JSON.stringify(event);
        const bodyBuffer = Buffer.from(jsonString, 'utf-8');

        // Sign the exact buffer we are sending
        // This ensures no encoding differences between sign and send
        const signature = signRawBody(bodyBuffer.toString('utf-8'), secret);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-core-signature': signature,
                'x-core-event-id': event.id,
                'x-core-version': event.version,
                'x-core-timestamp': event.timestamp.toString(),
                'User-Agent': 'Pandora-Core-Webhooks/1.0',
                'Content-Length': bodyBuffer.length.toString()
            },
            body: bodyBuffer, // Send the buffer directly
        });

        if (!response.ok) {
            return {
                success: false,
                statusCode: response.status,
                error: response.statusText
            };
        }

        return { success: true, statusCode: response.status };

    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Unknown network error'
        };
    }
}
