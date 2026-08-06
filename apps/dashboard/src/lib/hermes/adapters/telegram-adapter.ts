import { ExecutionRequest } from '../contracts/universal';

export class TelegramAdapter {
  static parse(projectId: number, body: any): ExecutionRequest {
    const userMessage = body?.message?.text || '';
    const chatId = String(body?.message?.chat?.id || '');

    // For telegram, we can heuristically determine capability or rely on InteractionRouter 
    // downstream. Since the webhook needs to send a capability, we can assume 'interactive' profile
    // and let the Kernel resolve it, or we assign a generic 'conversation.message' capability.
    
    return {
      requestId: `req-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      executionId: `tg-${Date.now()}`,
      tenantId: projectId.toString(),
      requester: chatId,
      channel: 'telegram',
      capability: 'communication.route', 
      executionProfile: 'interactive',
      identity: {}, 
      priority: 'normal',
      payload: {
        projectId,
        chatId,
        userMessage,
        botToken: body.botToken || '',
        raw: body
      }
    };
  }

  static render(result: any): string {
    // Extract the primary text message from the artifacts
    const textArtifact = result.artifacts?.find((a: any) => a.type === 'message');
    return textArtifact ? textArtifact.content : result.reply || '';
  }
}
