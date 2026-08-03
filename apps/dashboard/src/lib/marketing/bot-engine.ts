import OpenAI from 'openai';
import Redis from 'ioredis';

// Create a singleton Redis client safely
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

export async function generateBotResponse(context: {
  projectName?: string;
  userMessage: string;
  projectContext?: any;
  botInstructions?: string;
  chatId?: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  projectSlug?: string;
  customSystemPrompt?: string;
}) {
  const { projectName = 'S\'Narai', userMessage, projectContext, botInstructions, chatId, customSystemPrompt } = context;

  // Hermes Core Intelligence Engine Integration (Phase 1)
  const { KnowledgePackLoader } = await import('@/lib/hermes/knowledge-pack');
  const { HermesDecisionEngine } = await import('@/lib/hermes/decision-engine');
  
  const projectSlug = context.projectSlug || projectContext?.slug || projectName || 'snarai';
  const pack = KnowledgePackLoader.getPack(projectSlug, projectContext);
  
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

  // Build the system prompt. If a customSystemPrompt is passed (e.g. from Sandbox or dynamic tenant), use it.
  const systemPrompt = customSystemPrompt || `Eres "HERMES PATRIMONIAL", el Gestor Patrimonial IA Autónomo y Conserje Oficial para el proyecto "${projectName}".
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
3. Responde de forma MUY concisa y al grano. Usa emojis con moderación.

INSTRUCCIONES ADICIONALES DEL PROYECTO:
${botInstructions || "Actúa con amabilidad y redirige al portal oficial para adquirir posiciones."}`;

  let history: { role: 'user' | 'assistant', content: string }[] = context.history || [];
  const redisKey = chatId ? `telegram_bot_context:${projectName}:${chatId}` : null;

  // Fetch conversational memory from Redis if not manually passed
  if (!context.history && redis && redisKey) {
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
    // NOTE: isOllamaEnabled must ONLY be true when a real API key is explicitly configured.
    // rawBaseUrl has a default fallback so we cannot use it to determine if Ollama is intended.
    // ─────────────────────────────────────────────────────────────
    // v4.2 Runtime Manifest Integration
    // Load LLM configuration strictly from the Tenant Manifest
    // ─────────────────────────────────────────────────────────────
    
    // Internal fetch of manifest config from DB to avoid HTTP loopbacks
    const { db } = await import('@/db');
    const { projects } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    
    const dbProject = await db.select().from(projects).where(eq(projects.slug, projectSlug)).limit(1);
    const dbConfig: any = (dbProject.length > 0 && dbProject[0]?.tenantRuntimeConfig) ? dbProject[0].tenantRuntimeConfig : {};
    
    const rawBaseUrl = dbConfig?.providers?.llm?.baseUrl 
      || (isSnarai ? process.env.OLLAMA_SNARAI_BASE_URL : null)
      || process.env.OLLAMA_BASE_URL 
      || process.env.OLLAMA_HOST 
      || 'http://127.0.0.1:11434';
      
    const apiKey = dbConfig?.providers?.llm?.apiKeyRef 
      || (isSnarai ? process.env.OLLAMA_SNARAI_API_KEY : null)
      || process.env.OLLAMA_API_KEY 
      || 'ollama-key';
      
    const aiModel = dbConfig?.providers?.llm?.model 
      || (isSnarai ? process.env.OLLAMA_SNARAI_MODEL : null)
      || process.env.OLLAMA_MODEL 
      || 'gpt-oss:20b';

    let botResponseText = "Lo siento, estoy teniendo problemas para procesar la información en este momento.";

    // If using the official Ollama Cloud API (ollama.com), we must use the native Ollama REST API
    // because their cloud doesn't expose the /v1/chat/completions OpenAI compatibility wrapper
    if (rawBaseUrl.includes('ollama.com')) {
      // the docs say the base URL is https://ollama.com/api, so we append /chat
      const baseClean = rawBaseUrl.replace(/\/$/, '');
      const ollamaEndpoint = baseClean.endsWith('/api') ? `${baseClean}/chat` : `${baseClean}/api/chat`;
      
      const ollamaRes = await fetch(ollamaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiModel,
          messages: messages,
          stream: false,
          options: {
            temperature: 0.3
          }
        })
      });

      if (!ollamaRes.ok) {
        throw new Error(`Ollama Cloud API Error: ${ollamaRes.status} ${await ollamaRes.text()}`);
      }
      const data = await ollamaRes.json();
      botResponseText = data?.message?.content || botResponseText;
    } else {
      // For Groq, OpenAI, or Local Ollama which support the OpenAI SDK standard
      const baseUrl = rawBaseUrl.endsWith('/v1') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/v1`;
      const aiClient = new OpenAI({
        baseURL: baseUrl,
        apiKey: apiKey,
      });

      const response = await aiClient.chat.completions.create({
        model: aiModel,
        messages: messages,
        temperature: 0.3,
        max_tokens: 350,
      });

      botResponseText = response.choices[0]?.message?.content || botResponseText;
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
