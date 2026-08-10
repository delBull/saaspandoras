export interface TelegramCredentialProvider {
  getBotToken(organizationId: string): Promise<string | null>;
}
