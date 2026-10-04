/**
 * 📞 SignalWire Communication Channel Adapter
 * Multi-Tenant SMS & Voice LaML Adapter for Hermes Runtime
 */

export interface SignalWireMessagePayload {
  to: string;
  body: string;
  from?: string;
}

export class SignalWireService {
  private static getCredentials() {
    const projectId = process.env.SIGNALWIRE_PROJECT_ID;
    const apiToken = process.env.SIGNALWIRE_API_TOKEN;
    const spaceUrl = process.env.SIGNALWIRE_SPACE_URL || 'pandoras.signalwire.com';
    const defaultPhoneNumber = process.env.SIGNALWIRE_PHONE_NUMBER || '+18336529213';

    if (!projectId || !apiToken) {
      console.warn('[SignalWire] Credentials missing in environment variables');
    }

    return { projectId, apiToken, spaceUrl, defaultPhoneNumber };
  }

  /**
   * Send outbound SMS via SignalWire REST API (LAML Messages API)
   */
  static async sendSMS(payload: SignalWireMessagePayload): Promise<{ success: boolean; sid?: string; error?: string }> {
    try {
      const { projectId, apiToken, spaceUrl, defaultPhoneNumber } = this.getCredentials();

      if (!projectId || !apiToken) {
        throw new Error('SignalWire credentials not configured');
      }

      const fromNumber = payload.from || defaultPhoneNumber;
      const endpoint = `https://${spaceUrl}/api/laml/2010-04-01/Accounts/${projectId}/Messages.json`;

      const formData = new URLSearchParams();
      formData.append('From', fromNumber);
      formData.append('To', payload.to);
      formData.append('Body', payload.body);

      const authHeader = 'Basic ' + Buffer.from(`${projectId}:${apiToken}`).toString('base64');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[SignalWire SMS Error]:', data);
        return { success: false, error: data.message || `HTTP ${response.status}` };
      }

      console.info(`[SignalWire SMS Sent] SID: ${data.sid} to ${payload.to}`);
      return { success: true, sid: data.sid };
    } catch (err: any) {
      console.error('[SignalWire Service Exception]:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generate LaML XML response for Voice Call handling
   */
  static generateLaMLVoiceResponse(options: { text: string; voice?: string }): string {
    const safeText = options.text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const voice = options.voice || 'Polly.Lupe'; // Spanish female voice

    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="${voice}" language="es-MX">${safeText}</Say>
</Response>`;
  }
}
