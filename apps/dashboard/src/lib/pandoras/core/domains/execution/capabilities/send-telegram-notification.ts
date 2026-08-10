import { Capability, CapabilityContext, CapabilityResult, CapabilityErrorCategory } from '../contracts/capability-contracts';
import { TelegramClient } from '~/lib/pandoras/infrastructure/external/telegram/telegram-client';
import { DatabaseTelegramCredentialProvider } from '~/lib/pandoras/infrastructure/external/telegram/telegram-credential-adapter';

export interface SendTelegramNotificationInput {
  chatId: string;
  message: string;
}

export interface SendTelegramNotificationOutput {
  delivered: boolean;
  provider: 'telegram';
  messageReference?: string;
}

export class SendTelegramNotificationCapability implements Capability<SendTelegramNotificationInput, SendTelegramNotificationOutput> {
  id = 'SEND_TELEGRAM_NOTIFICATION';
  version = '1.0.0';

  private telegramClient = new TelegramClient();
  private credentialProvider = new DatabaseTelegramCredentialProvider();

  async execute(input: SendTelegramNotificationInput, context: CapabilityContext): Promise<CapabilityResult<SendTelegramNotificationOutput>> {
    try {
      if (!input.chatId || !input.message) {
        return {
          status: 'failed',
          error: {
            category: 'VALIDATION_ERROR',
            message: 'chatId and message are required',
            retryable: false,
          }
        };
      }

      const botToken = await this.credentialProvider.getBotToken(context.organizationId);
      if (!botToken) {
        return {
          status: 'failed',
          error: {
            category: 'AUTHORIZATION_ERROR',
            message: `Telegram configuration not found for organization ${context.organizationId}`,
            retryable: false,
          }
        };
      }

      const result = await this.telegramClient.sendMessage(botToken, input.chatId, input.message);

      if (result.success) {
        return {
          status: 'succeeded',
          data: {
            delivered: true,
            provider: 'telegram',
            messageReference: result.messageId,
          }
        };
      } else {
        return {
          status: 'failed',
          error: {
            category: (result.errorType as CapabilityErrorCategory) || 'EXTERNAL_SERVICE_ERROR',
            message: result.errorMessage || 'Failed to deliver telegram message',
            retryable: result.isRetryable || false,
          }
        };
      }

    } catch (e: any) {
      return {
        status: 'failed',
        error: {
          category: 'EXTERNAL_SERVICE_ERROR',
          message: 'Unhandled error invoking telegram provider',
          retryable: false,
        }
      };
    }
  }
}
