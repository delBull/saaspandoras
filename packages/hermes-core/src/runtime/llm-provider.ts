import { CompiledCognitiveRequest } from './prompt-compiler';
import { LLMResponse } from './cognitive-response-parser';

export interface ILLMProvider {
  /**
   * Executes the compiled request against the underlying LLM.
   * This is where OpenAI, Anthropic, or local models are actually invoked.
   */
  execute(request: CompiledCognitiveRequest): Promise<LLMResponse>;
}

/**
 * Real Ollama Provider leveraging OLLAMA_BASE_URL and OLLAMA_MODEL.
 */
export class OllamaLLMProvider implements ILLMProvider {
  public async execute(request: CompiledCognitiveRequest): Promise<LLMResponse> {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
    const model = request.modelPolicy.model || process.env.OLLAMA_MODEL || 'llama3';
    
    console.log(`[OllamaLLMProvider] Executing compilation ${request.compilationId} with model ${model}`);
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: request.messages,
        temperature: request.modelPolicy.temperature,
        max_tokens: request.modelPolicy.maxTokens,
        // Since we want structured output:
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || '';

    return {
      rawContent,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0
      }
    };
  }
}
