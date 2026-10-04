/**
 * Capa de abstracción para modelos de IA.
 * Permite a Media Co generar texto, imágenes o videos sin casarse con un proveedor.
 */
export interface AIAdapterResponse {
  success: boolean;
  content?: any;
  error?: string;
  metadata?: {
    model: string;
    tokens?: number;
  };
}

export interface AIAdapter {
  generateText(prompt: string, context?: any): Promise<AIAdapterResponse>;
  generateImage(prompt: string, style?: string): Promise<AIAdapterResponse>;
}

/**
 * Stub temporal para el MVP.
 * En el futuro esto implementará la lógica real conectándose a OpenAI, Claude, Flux, etc.
 */
export class MockAIAdapter implements AIAdapter {
  async generateText(prompt: string, context?: any): Promise<AIAdapterResponse> {
    return {
      success: true,
      content: `[Contenido generado por IA basado en: "${prompt.substring(0, 30)}..."]`,
      metadata: { model: 'mock-text-gen', tokens: 150 }
    };
  }

  async generateImage(prompt: string, style?: string): Promise<AIAdapterResponse> {
    return {
      success: true,
      content: `https://mock-storage.pandoras.com/assets/${Date.now()}.png`,
      metadata: { model: 'mock-image-gen' }
    };
  }
}
