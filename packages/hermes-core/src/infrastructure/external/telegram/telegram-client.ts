export interface TelegramSendResult {
  success: boolean;
  messageId?: string;
  errorType?: 'VALIDATION_ERROR' | 'AUTHORIZATION_ERROR' | 'EXTERNAL_SERVICE_ERROR';
  errorMessage?: string;
  isRetryable?: boolean;
}

export class TelegramClient {
  async sendMessage(
    token: string,
    chatId: string,
    message: string
  ): Promise<TelegramSendResult> {
    if (!chatId || !message) {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        errorMessage: 'chatId and message are required',
        isRetryable: false,
      };
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data?.result?.message_id?.toString(),
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          errorType: 'EXTERNAL_SERVICE_ERROR',
          errorMessage: 'Rate limit exceeded (429)',
          isRetryable: true,
        };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          errorType: 'EXTERNAL_SERVICE_ERROR',
          errorMessage: 'Invalid bot token or unauthorized',
          isRetryable: false,
        };
      }
      
      if (response.status === 400) {
        return {
            success: false,
            errorType: 'VALIDATION_ERROR',
            errorMessage: 'Bad request (400) - check chatId and message format',
            isRetryable: false,
        };
      }

      return {
        success: false,
        errorType: 'EXTERNAL_SERVICE_ERROR',
        errorMessage: `HTTP Error ${response.status}`,
        isRetryable: response.status >= 500,
      };
    } catch (e) {
      return {
        success: false,
        errorType: 'EXTERNAL_SERVICE_ERROR',
        errorMessage: 'Network or protocol error connecting to Telegram',
        isRetryable: true,
      };
    }
  }
}
