export interface ConversationMessage { role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string | Date; }
export interface HermesResponse {
  type: string;
  message?: string;
  payload?: any;
}
export interface IHermesShell {
  handleMessage(input: any): Promise<HermesResponse>;
}
