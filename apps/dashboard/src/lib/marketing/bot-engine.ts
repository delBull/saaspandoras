import OpenAI from 'openai';
import Redis from 'ioredis';

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

  // Hermes Core Intelligence Engine Integration (Phase 1)
  const { KnowledgePackLoader } = await import('@/lib/hermes/knowledge-pack');
  const { HermesDecisionEngine } = await import('@/lib/hermes/decision-engine');
  
  const projectSlug = projectContext?.slug || projectName || 'snarai';
  const pack = KnowledgePackLoader.getPack(projectSlug);
  
  const customerMemory = {
    leadId: chatId || 'guest-session',
    acquisitionChannel: 'telegram',
    expressedIntent: 'explore' as const,
    concernsAndObjections: [],
    topicsDiscussed: [],
    documentsSent: []
  };

  const { mission, recommendedAction } = HermesDecisionEngine.evaluateNextMission(
    projectSlug,
    customerMemory,
    'ENGAGED',
    userMessage
  );

  console.info(`[Hermes Engine] Mission Goal: ${mission.goal}, Target State: ${mission.targetState}`);

  // Build the strict system prompt with Sales Pitch & Objection Handling Matrix
  const systemPrompt = `Eres "HERMES PATRIMONIAL", el Gestor Patrimonial IA Autónomo y Conserje Oficial para el proyecto "${projectName}".
Tu objetivo es asesorar, calificar prospectos, resolver dudas legales/técnicas y guiar a los clientes hacia el cierre de su inversión de manera cortes, profesional y ejecutiva.

ACCIONES RECOMENDADAS POR HERMES DECISION ENGINE:
- Meta de la Misión: ${mission.goal} (Estado Objetivo: ${mission.targetState})
- Recomendación de Cierre: ${recommendedAction}

CONTEXTO DEL PROYECTO (DATA EN VIVO DE BASE DE DATOS):
- Título/Proyecto: ${projectContext?.title || projectName}
- Precio Actual: $${projectContext?.currentPrice || 'N/A'} USD / USDC
- Fase Activa: ${projectContext?.phaseName || 'Fase Fundadores'}
- Unidades Totales: ${projectContext?.totalUnits || 'N/A'}
- Unidades Disponibles: ${projectContext?.availableUnits || 'N/A'}
- Progreso de Fondeo: ${projectContext?.progressPercentage || 0}%
- Tesorería/TVL: ${projectContext?.treasury || '0'}
- Miembros DAO / Holders: ${projectContext?.holdersCount || 0}

PITCH DE VENTAS (PACK: ${pack.name}):
${pack.salesPitch}

REGLAS ESTRICTAS DE SEGURIDAD (ANTI-ABUSO):
1. NUNCA des consejos de inversión ni prometas retornos exactos. Si te preguntan por rendimientos, da estimaciones y redirige al Aviso de Riesgos.
2. Si el usuario te pregunta cosas fuera del contexto del proyecto ${projectName}, discúlpate cortésmente y diles que solo puedes hablar sobre ${projectName}.
3. Responde de forma MUY concisa y al grano (es un chat de Telegram). Usa emojis con moderación.
4. Medios de Pago: USDC/USDT vía Web3 en dApp o SPEI Fast Lane en Pesos MXN.

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
    const projectSlug = projectContext?.slug?.toLowerCase() || '';
    const isSnarai = projectSlug === 'snarai';

    // Project-specific variable resolution for granular analytics and metering
    const apiKey = (isSnarai && process.env.OLLAMA_SNARAI_API_KEY) || process.env.OLLAMA_SNARAI_API_KEY || process.env.OLLAMA_API_KEY || '';
    const rawBaseUrl = (isSnarai && process.env.OLLAMA_SNARAI_BASE_URL) || process.env.OLLAMA_SNARAI_BASE_URL || process.env.OLLAMA_BASE_URL || "https://api.ollama.com/v1";
    const aiModel = (isSnarai && process.env.OLLAMA_SNARAI_MODEL) || process.env.OLLAMA_SNARAI_MODEL || process.env.OLLAMA_MODEL || 'llama3.1:8b';

    const isOllamaEnabled = !!apiKey || !!rawBaseUrl;
    let botResponseText = "";

    if (isOllamaEnabled) {
      const baseUrl = rawBaseUrl.endsWith('/v1') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/v1`;

      // Modern Ollama / Cloud provider OpenAI compatibility endpoint
      const aiClient = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey || 'ollama-key',
      });

      const response = await aiClient.chat.completions.create({
        model: aiModel,
        messages: messages,
        temperature: 0.3,
        max_tokens: 350,
      });

      botResponseText = response.choices[0]?.message?.content || "Lo siento, estoy teniendo problemas para procesar la información en este momento.";
    } else {
      const aiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "missing-key",
      });

      const response = await aiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.3,
        max_tokens: 300,
      });
      botResponseText = response.choices[0]?.message?.content || "Lo siento, estoy teniendo problemas para procesar la información en este momento.";
    }

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
  } catch (error: any) {
    console.error("[BotEngine] Error generating response:", error);
    return `Error técnico (Temporal para Debug): ${error?.message || error}. Por favor avisa a soporte.`;
  }
}
