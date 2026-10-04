/**
 * 📦 Dash Contracts — Hermes Conversations & Operations Domain
 * src/lib/dash-contracts/conversations.ts
 */

export interface ConversationMessageDTO {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM' | 'OPERATOR' | 'ACTIVITY';
  content: string;
  createdAt: string;
}

export interface ConversationSummaryDTO {
  id: string;
  channel: string;
  actorId: string;
  lastMessageAt: string;
  unreadCount?: number;
  status: string;
}

export interface GetConversationMessagesResponseDTO {
  messages: ConversationMessageDTO[];
}

export interface ManualTakeoverRequestDTO {
  conversationId: string;
  operatorId?: string;
  reason?: string;
}

export interface ManualTakeoverResponseDTO {
  success: boolean;
  escalationId: string;
}
