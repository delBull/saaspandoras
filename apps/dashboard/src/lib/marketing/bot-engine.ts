import OpenAI from 'openai';
import Redis from 'ioredis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure Custom Provider (Ollama / Local LLM) if provided
const isOllamaEnabled = !!process.env.OLLAMA_API_KEY || !!process.env.OLLAMA_BASE_URL;
const customLLM = isOllamaEnabled ? new OpenAI({
  apiKey: process.env.OLLAMA_API_KEY || "dummy-key-for-local",
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1", // Default Ollama OpenAI-compatible endpoint
}) : null;

// Create a singleton Redis client safely
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export async function generateBotResponse(context: {
  projectName: string;
  userMessage: string;
  projectContext: any;
  botInstructions?: string;
  chatId?: string;
}) {
  const { projectName, userMessage, projectContext, botInstructions, chatId } = context;

  // Build the strict system prompt
  const systemPrompt = `Eres un asistente oficial (Conserje IA) para el proyecto "${projectName}".
Tu objetivo es responder de manera cortés, premium y muy profesional a los usuarios en Telegram.

CONTEXTO DEL PROYECTO (DATA EN VIVO):
- Título/Proyecto: ${projectContext?.title || projectName}
- Precio Actual: $${projectContext?.currentPrice || 'N/A'}
- Unidades Totales: ${projectContext?.totalUnits || 'N/A'}
- Unidades Disponibles: ${projectContext?.availableUnits || 'N/A'}
- Progreso de Fondeo: ${projectContext?.progressPercentage || 0}%
- Tesorería/TVL: ${projectContext?.treasury || '0'} USDC

REGLAS ESTRICTAS DE SEGURIDAD (ANTI-ABUSO):
1. NUNCA des consejos de inversión ni prometas retornos exactos. Si te preguntan por rendimientos, da estimaciones (si el contexto las incluye) y redirige al Aviso de Riesgos.
2. Si el usuario te pregunta cosas fuera del contexto del proyecto ${projectName}, discúlpate cortésmente y diles que solo puedes hablar sobre ${projectName}.
3. Responde de forma MUY concisa y al grano (es un chat de Telegram). No uses bloques de texto largos. Usa emojis con moderación.
4. El pago se realiza en USDC (red Polygon u optimizada).
5. Invita al usuario a visitar su Portal de Inversión para conectar su wallet.

INSTRUCCIONES ADICIONALES DEL PROYECTO:
${botInstructions || "Actúa con amabilidad y redirige al portal oficial para adquirir posiciones."}`;

  let history: { role: 'user' | 'assistant', content: string }[] = [];
  const redisKey = chatId ? `telegram_bot_context:${projectName}:${chatId}` : null;

  // Fetch conversational memory from Redis
  if (redis && redisKey) {
    try {
      const storedContext = await redis.get(redisKey);
      if (storedContext) {
        history = JSON.parse(storedContext);
      }
    } catch (err) {
      console.warn("[BotEngine] Failed to load memory from Redis", err);
    }
  }

  // Format history for OpenAI
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  try {
    // Use the custom LLM if configured, otherwise fallback to standard OpenAI
    const aiClient = customLLM ? customLLM : openai;
    const aiModel = customLLM ? (process.env.OLLAMA_MODEL || 'llama3') : 'gpt-4o-mini';

    const response = await aiClient.chat.completions.create({
      model: aiModel,
      messages: messages,
      temperature: 0.3, // Low temperature for deterministic, factual responses
      max_tokens: 300,
    });

    const botResponseText = response.choices[0]?.message?.content || "Lo siento, estoy teniendo problemas para procesar la información en este momento.";

    // Save updated conversational memory back to Redis
    if (redis && redisKey) {
      try {
        const newHistory = [
          ...history,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: botResponseText }
        ];
        
        // Keep only the last 6 messages (3 interactions) to save context length and cost
        const trimmedHistory = newHistory.slice(-6);
        
        // Save to Redis and set expiration to 24 hours (86400 seconds)
        await redis.set(redisKey, JSON.stringify(trimmedHistory), 'EX', 86400);
      } catch (err) {
        console.warn("[BotEngine] Failed to save memory to Redis", err);
      }
    }

    return botResponseText;
  } catch (error) {
    console.error("[BotEngine] Error generating response:", error);
    return "Lo siento, ha ocurrido un error temporal en mis servidores. Por favor, intenta de nuevo más tarde.";
  }
}
