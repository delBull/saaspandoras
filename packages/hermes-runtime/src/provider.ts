/**
 * ModelProvider Interface for Model Agnosticism
 * Allows switching between OpenAI, Anthropic, Gemini, Grok, Ollama, Azure, etc.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelProvider {
  id: string;
  name: string;
  chat(messages: ChatMessage[], options?: ModelCompletionOptions): Promise<string>;
  summarize?(text: string): Promise<string>;
  reason?(prompt: string): Promise<string>;
}

export class OpenAIModelProvider implements ModelProvider {
  id = 'openai';
  name = 'OpenAI Provider';
  private apiKey: string;
  private baseURL?: string;

  constructor(apiKey: string, baseURL?: string) {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  async chat(messages: ChatMessage[], options?: ModelCompletionOptions): Promise<string> {
    const OpenAI = (await import('openai')).default;
    const client = new OpenAI({ apiKey: this.apiKey, baseURL: this.baseURL });
    const response = await client.chat.completions.create({
      model: options?.model || 'gpt-4o-mini',
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 350
    });
    return response.choices[0]?.message?.content || '';
  }
}
