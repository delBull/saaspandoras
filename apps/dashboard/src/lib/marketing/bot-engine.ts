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
  const { dataProviderSingleton } = await import('@/lib/hermes/data-provider');
  const { HermesSoulRegistry } = await import('@/lib/hermes/soul/snarai-soul');
  
  const projectSlug = context.projectSlug || projectContext?.slug || projectName || 'snarai';
  const pack = await KnowledgePackLoader.getPack(projectSlug, projectContext);

  // Resolve Soul for this project (identity, language policy, canonical URLs)
  const soul = HermesSoulRegistry.getSoul(projectSlug);
  const soulPrompt = soul ? HermesSoulRegistry.buildSoulPrompt(soul) : '';
  
  // Resolve real-time project state using Universal DataProvider (skip if sandbox)
  let resolvedState = null;
  if (projectSlug !== 'sandbox') {
    resolvedState = await dataProviderSingleton.getProjectState(projectSlug);
  }
  
  const liveContext = resolvedState ? {
    title: resolvedState.title,
    slug: resolvedState.slug,
    currentPrice: resolvedState.metadata?.tokenPrice,
    phaseName: resolvedState.metadata?.phaseName,
    availableUnits: resolvedState.metadata?.availableUnits,
    progressPercentage: resolvedState.metadata?.progressPercentage,
    treasury: resolvedState.treasuryDisplay,
    holdersCount: resolvedState.holdersCount,
    ...projectContext
  } : projectContext;
  
  const customerMemory = {
    leadId: chatId || 'guest-session',
    acquisitionChannel: 'telegram',
    expressedIntent: 'explore' as const,
    concernsAndObjections: [],
    topicsDiscussed: [],
    documentsSent: []
  };

  const { mission, recommendedAction } = await HermesDecisionEngine.evaluateNextMission(
    projectSlug,
    customerMemory,
    'ENGAGED',
    userMessage
  );

  console.info(`[Hermes Engine] Mission Goal: ${mission.goal}, Target State: ${mission.targetState}`);

  // Build the system prompt. If a customSystemPrompt is passed (e.g. from Sandbox or dynamic tenant), use it.
  // Otherwise build from Soul (identity + policies) + Knowledge (project facts) + live data.
  const systemPrompt = customSystemPrompt || `${soulPrompt}

ROL Y OBJETIVO:
Eres "${soul?.agentName || 'HERMES PATRIMONIAL'}", el Gestor Patrimonial IA Autónomo para el proyecto "${liveContext?.title || projectName}".
Tu objetivo es asesorar, calificar prospectos, resolver dudas y guiar hacia el cierre de forma ejecutiva y profesional.

ACCIONES RECOMENDADAS POR HERMES DECISION ENGINE:
- Meta de la Misión: ${mission.goal} (Estado Objetivo: ${mission.targetState})
- Recomendación de Cierre: ${recommendedAction}

CONTEXTO DEL PROYECTO (DATA EN TIEMPO REAL):
- Título/Proyecto: ${liveContext?.title || projectName}
- Precio Actual: $${liveContext?.currentPrice || 'N/A'} USD
- Fase Activa: ${liveContext?.phaseName || 'Etapa Fundadores'}
- Unidades Disponibles: ${liveContext?.availableUnits || 'N/A'}
- Progreso de Fondeo: ${liveContext?.progressPercentage || 0}%
- Tesoría/TVL: ${liveContext?.treasury || '0'}
- Miembros / Holders: ${liveContext?.holdersCount || 0}

PITCH DEL PROYECTO (PACK: ${pack.name}):
${pack.salesPitch}

INSTRUCCIONES ADICIONALES DEL PROYECTO:
${botInstructions || 'Actuar con amabilidad y redirigir al portal oficial para adquirir posiciones.'}

**MUY IMPORTANTE**: DEBES responder EXCLUSIVAMENTE en formato JSON. Tu respuesta debe ser un objeto JSON válido con la siguiente estructura:
{
  "action": "ANSWER" | "QUALIFY" | "OFFER_DOCUMENT" | "OFFER_CALL" | "SEND_CHECKOUT" | "HANDOFF_HUMAN",
  "rationale": "Breve explicación de por qué tomas esta acción",
  "replyText": "El texto que le dirás al usuario (este es el mensaje final)",
  "payload": "Opcional: link o información extra si aplica"
}`;

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
    const resolvedSlug = (projectSlug && projectSlug !== 'undefined') ? projectSlug : 'snarai';
    const isSnarai = resolvedSlug === 'snarai';

    // Internal fetch of manifest config from DB to avoid HTTP loopbacks
    let dbConfig: any = {};
    try {
      const { db } = await import('@/db');
      const { projects } = await import('@/db/schema');
      const { eq } = await import('drizzle-orm');
      
      const dbProject = await db.select().from(projects).where(eq(projects.slug, resolvedSlug)).limit(1);
      dbConfig = (dbProject.length > 0 && dbProject[0]?.tenantRuntimeConfig) ? dbProject[0].tenantRuntimeConfig : {};
    } catch (dbErr) {
      console.warn('[BotEngine] DB lookup skipped or failed, falling back to local KnowledgePack/Soul:', dbErr);
    }
    
    const apiKey = dbConfig?.providers?.llm?.apiKeyRef 
      || (isSnarai ? process.env.OLLAMA_SNARAI_API_KEY : null)
      || process.env.OLLAMA_API_KEY 
      || process.env.GROQ_API_KEY
      || process.env.OPENAI_API_KEY
      || 'ollama-key';
      
    let rawBaseUrl = dbConfig?.providers?.llm?.baseUrl 
      || (isSnarai ? process.env.OLLAMA_SNARAI_BASE_URL : null)
      || process.env.OLLAMA_BASE_URL 
      || process.env.OLLAMA_HOST;

    if (!rawBaseUrl) {
      if (process.env.GROQ_API_KEY) {
        rawBaseUrl = 'https://api.groq.com/openai';
      } else if (process.env.OPENAI_API_KEY) {
        rawBaseUrl = 'https://api.openai.com';
      } else {
        rawBaseUrl = 'http://127.0.0.1:11434';
      }
    }
      
    const aiModel = dbConfig?.providers?.llm?.model 
      || (isSnarai ? process.env.OLLAMA_SNARAI_MODEL : null)
      || process.env.OLLAMA_MODEL 
      || (process.env.GROQ_API_KEY ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini');

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
          format: 'json',
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
        response_format: { type: "json_object" }
      });

      botResponseText = response.choices[0]?.message?.content || botResponseText;
    }

    let structuredResponse = {
      action: 'ANSWER',
      rationale: '',
      replyText: botResponseText,
      payload: ''
    };

    try {
      structuredResponse = JSON.parse(botResponseText);
    } catch (parseError) {
      console.warn("[BotEngine] LLM did not return valid JSON:", botResponseText);
      structuredResponse.replyText = botResponseText;
    }

    // Save updated conversational memory back to Redis
    if (redis && redisKey) {
      try {
        const newHistory = [
          ...history,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: structuredResponse.replyText }
        ];
        
        const trimmedHistory = newHistory.slice(-6);
        await redis.set(redisKey, JSON.stringify(trimmedHistory), 'EX', 86400);
      } catch (err) {
        console.warn("[BotEngine] Failed to save memory to Redis", err);
      }
    }

    // Backwards compatibility for callers expecting string
    // Return the string object that has properties, or explicitly change the signature
    // Actually, we'll return the object. We will update the callers immediately.
    return structuredResponse;
  } catch (error: any) {
    console.error("[BotEngine] Error generating response:", error);
    return {
      action: 'ANSWER',
      rationale: 'Error fallback',
      replyText: `Error técnico (Temporal para Debug): ${error?.message || error}. Por favor avisa a soporte.`
    };
  }
}
