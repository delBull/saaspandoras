import OpenAI from 'openai';
import Redis from 'ioredis';

// Create a singleton Redis client safely
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

/**
 * @deprecated [DEPRECATED / NO AUTHORITY] 
 * Do not use `BotEngine` for execution. It has no authority over tenant resources.
 * All new conversational surfaces must enter through `HermesRuntime.respond()` 
 * to ensure capability checks, policy gates, and sovereign identity resolution.
 */
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
  const { projectName, userMessage, projectContext, botInstructions, chatId, customSystemPrompt } = context;

  // Hermes Core Intelligence Engine Integration (Phase 1)
  const { KnowledgePackLoader } = await import('@saasfly/hermes-core');
  const { HermesDecisionEngine } = await import('@saasfly/hermes-core');
  const { HermesSoulRegistry } = await import('@saasfly/hermes-core'); // TODO: Rename to generic soul registry later
  const { CommercialCloserService } = await import('@saasfly/hermes-core');
  const { RwaIntelligenceProvider } = await import('@saasfly/hermes-core');
  const { db } = await import('@saasfly/db-core');
  const { projects } = await import('@saasfly/db-core/schema');
  const { eq } = await import('@saasfly/db-core');
  
  const projectSlug = context.projectSlug || projectContext?.slug || projectName;
  if (!projectSlug || projectSlug === 'undefined') {
    throw new Error('Hermes OS Bot Engine requires a valid projectSlug to establish tenant context.');
  }
  const resolvedSlug = projectSlug;

  // Internal fetch of manifest config from DB to avoid HTTP loopbacks and resolve Canonical ResourceScope
  let dbProject: any = null;
  let dbConfig: any = {};
  let resourceScope: any = null;
  try {
    const projResult = await db.select().from(projects).where(eq(projects.slug, resolvedSlug)).limit(1);
    if (projResult.length > 0) {
      dbProject = projResult[0];

      // COMMERCIAL GATE: Ensure tenant has an active Hermes license
      const { installedProducts } = await import('@saasfly/db-core/schema');
      const { and } = await import('@saasfly/db-core');
      const hermesInstall = await db.select().from(installedProducts)
        .where(
          and(
            eq(installedProducts.projectId, dbProject.id),
            eq(installedProducts.productFamily, 'HERMES')
          )
        ).limit(1);

      if (hermesInstall.length === 0 || (hermesInstall[0]!.status !== 'active' && hermesInstall[0]!.status !== 'trial')) {
        throw new Error(`HERMES_SUSPENDED: Tenant ${resolvedSlug} does not have an active Hermes license.`);
      }

      dbConfig = dbProject.tenantRuntimeConfig || {};
      resourceScope = {
        canonicalOrgId: dbProject.organizationId,
        projectId: dbProject.id,
        scopeType: 'PROJECT',
        actorId: chatId
      };
    } else if (resolvedSlug === 'sandbox') {
      // Sandbox operates without a DB tenant context
    } else {
      throw new Error(`Tenant context not found for slug: ${resolvedSlug}`);
    }
  } catch (dbErr: any) {
    console.error('[BotEngine] Tenant resolution or commercial gate FAIL CLOSED:', dbErr);
    if (dbErr.message?.includes('HERMES_SUSPENDED')) {
      return {
        action: 'ANSWER',
        rationale: 'COMMERCIAL_GATE_REJECTED',
        replyText: 'El asistente Hermes está temporalmente inactivo para este proyecto.',
        payload: ''
      };
    }
    throw new Error('UNAVAILABLE: Tenant resolution failed.');
  }

  const pack = await KnowledgePackLoader.getPack(resolvedSlug, projectContext);

  // Resolve Soul for this project (identity, language policy, canonical URLs)
  const soul = HermesSoulRegistry.getSoul(resolvedSlug);
  const soulPrompt = soul ? HermesSoulRegistry.buildSoulPrompt(soul) : '';
  
  // Resolve real-time project state using RwaIntelligenceProvider instead of direct data provider
  let liveContext: any = projectContext;
  if (resolvedSlug !== 'sandbox' && resourceScope) {
    const provider = new RwaIntelligenceProvider();
    const result = await provider.getProjectState(resourceScope, { slug: resolvedSlug });
    if (result.status === 'SUCCESS' && result.data) {
      liveContext = {
        ...projectContext,
        title: result.data.title,
        slug: result.data.slug,
        currentPrice: result.data.currentPrice,
        phaseName: result.data.phaseName,
        availableUnits: result.data.availableUnits,
        progressPercentage: result.data.progressPercentage,
        treasury: result.data.treasury,
        holdersCount: result.data.holdersCount,
      };
    }
  }
  
  const customerMemory = {
    leadId: chatId || 'guest-session',
    acquisitionChannel: 'telegram',
    expressedIntent: 'explore' as const,
    concernsAndObjections: [],
    topicsDiscussed: [],
    documentsSent: []
  };

  const { mission, recommendedAction } = await HermesDecisionEngine.evaluateNextMission(
    resolvedSlug,
    customerMemory,
    'ENGAGED',
    userMessage
  );

  console.info(`[Hermes Engine] Mission Goal: ${mission.goal}, Target State: ${mission.targetState}`);

  // Evaluate commercial closer signals & doctrine
  const closerResult = await CommercialCloserService.evaluateInbound({
    tenantSlug: resolvedSlug,
    leadId: chatId || 'anonymous_telegram',
    messageText: userMessage,
    channel: 'telegram',
  });

  if (closerResult.executiveHandoff) {
    CommercialCloserService.notifySalesTeam(closerResult.executiveHandoff).catch((err) => {
      console.warn('[BotEngine] Error notifying sales team of handoff:', err);
    });
  }

  // Build the system prompt. If a customSystemPrompt is passed (e.g. from Sandbox or dynamic tenant), use it.
  // Otherwise build from Soul (identity + policies) + Knowledge (project facts) + live data + Closer doctrine.
  const systemPrompt = customSystemPrompt || `${soulPrompt}

ROL Y OBJETIVO:
Eres "${soul?.agentName || 'HERMES PATRIMONIAL'}", el Gestor Patrimonial IA Autónomo para el proyecto "${liveContext?.title || projectName}".
Tu objetivo es asesorar, calificar prospectos, resolver dudas y guiar hacia el cierre de forma ejecutiva y profesional.

ACCIONES RECOMENDADAS POR HERMES DECISION ENGINE Y REVENUE CLOSER:
- Meta de la Misión: ${mission.goal} (Estado Objetivo: ${mission.targetState})
- Recomendación de Cierre: ${recommendedAction}
- Next Best Action (Revenue Closer): ${closerResult.nextBestAction.action} (${closerResult.nextBestAction.reason})
${closerResult.doctrinalGuidance ? `- DOCTRINA OFICIAL DATA ROOM APLICABLE: ${closerResult.doctrinalGuidance.responseStrategy}` : ''}
${closerResult.recommendedCallToAction ? `- LLAMADO A LA ACCIÓN REQUERIDO: ${closerResult.recommendedCallToAction.label} (${closerResult.recommendedCallToAction.url})` : ''}

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
    
    const apiKey = dbConfig?.providers?.llm?.apiKeyRef 
      || process.env.OLLAMA_API_KEY 
      || process.env.GROQ_API_KEY
      || process.env.OPENAI_API_KEY
      || 'ollama-key';
      
    let rawBaseUrl = dbConfig?.providers?.llm?.baseUrl 
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

    // Alinear acción con directivas deterministas de Revenue Closer
    if (closerResult.nextBestAction.action === 'PROPOSE_MEETING' && structuredResponse.action !== 'OFFER_CALL') {
      structuredResponse.action = 'OFFER_CALL';
    } else if (closerResult.recommendedCallToAction?.type === 'CHECKOUT' && structuredResponse.action !== 'SEND_CHECKOUT') {
      structuredResponse.action = 'SEND_CHECKOUT';
    }

    // Si el texto del bot no incluye el link oficial de cierre requerido, anexarlo limpiamente
    if (closerResult.recommendedCallToAction && !structuredResponse.replyText.includes(closerResult.recommendedCallToAction.url)) {
      if (closerResult.recommendedCallToAction.type === 'MEETING') {
        structuredResponse.replyText += `\n\n📅 <b>Sesión Estratégica:</b> <a href="${closerResult.recommendedCallToAction.url}">Agendar con Fundadores</a>`;
      } else if (closerResult.recommendedCallToAction.type === 'CHECKOUT') {
        structuredResponse.replyText += `\n\n💳 <b>Checkout Oficial:</b> <a href="${closerResult.recommendedCallToAction.url}">Adquirir Títulos</a>`;
      }
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
