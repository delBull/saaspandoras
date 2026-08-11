import { NextRequest, NextResponse } from 'next/server';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { Redis } from 'ioredis';

// Global Freno de Mano: Max 100 sandbox requests/day across ALL users combined (First-Come, First-Served)
// Keeps sandbox token usage strictly under ~2% of total quota
const GLOBAL_DAILY_SANDBOX_CAP = 100;

// Tight per-IP limits for cold lead magnet prospection
const SANDBOX_DAILY_LIMIT = 3;
const SANDBOX_LIFETIME_LIMIT = 10;

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (err) {
    console.warn('[Hermes Sandbox] Redis connection failed, falling back to in-memory limit', err);
  }
}

// In-memory fallback rate limiters
const inMemoryLimits = new Map<string, { count: number; date: string }>();
const inMemoryLifetime = new Map<string, number>();
let globalDailyCount = { count: 0, date: '' };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, industry, customPrompt, userMessage, history = [], referralContext } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Mensaje de usuario requerido' }, { status: 400 });
    }

    // Determine client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'sandbox-user';
    const today: string = new Date().toISOString().split('T')[0] ?? '';
    const globalKey = `hermes:sandbox:global:${today}`;
    const rateLimitKey = `hermes:sandbox:ratelimit:${ip}:${today}`;
    const lifetimeKey = `hermes:sandbox:lifetime:${ip}`;

    let totalGlobalToday = 0;
    let currentCount = 0;
    let lifetimeCount = 0;

    if (redis) {
      totalGlobalToday = await redis.incr(globalKey);
      if (totalGlobalToday === 1) await redis.expire(globalKey, 86400);

      currentCount = await redis.incr(rateLimitKey);
      if (currentCount === 1) await redis.expire(rateLimitKey, 86400);

      lifetimeCount = await redis.incr(lifetimeKey);
    } else {
      if (globalDailyCount.date !== today) {
        globalDailyCount = { count: 1, date: today };
      } else {
        globalDailyCount.count += 1;
      }
      totalGlobalToday = globalDailyCount.count;

      const record = inMemoryLimits.get(rateLimitKey);
      if (!record || record.date !== today) {
        inMemoryLimits.set(rateLimitKey, { count: 1, date: today });
        currentCount = 1;
      } else {
        record.count += 1;
        currentCount = record.count;
      }

      const lifeVal = (inMemoryLifetime.get(lifetimeKey) || 0) + 1;
      inMemoryLifetime.set(lifetimeKey, lifeVal);
      lifetimeCount = lifeVal;
    }

    // 1. Check Global Freno de Mano (First-Come, First-Served Daily Capacity)
    if (totalGlobalToday > GLOBAL_DAILY_SANDBOX_CAP) {
      return NextResponse.json({
        error: 'Capacidad Global del Sandbox Agotada por Hoy',
        message: `El Sandbox interactivo ha alcanzado su capacidad diaria máxima de prueba por hoy (First-Come, First-Served). Para asegurar el rendimiento operativo, vuelve mañana o activa tu prueba dedicada para tu empresa.`,
        remaining: 0,
        globalCapReached: true
      }, { status: 429 });
    }

    // 2. Check Lifetime Cap (Trial Period Expiration for IP)
    if (lifetimeCount > SANDBOX_LIFETIME_LIMIT) {
      return NextResponse.json({
        error: 'Periodo de Prueba Agotado',
        message: `Has completado tus ${SANDBOX_LIFETIME_LIMIT} mensajes de prueba gratuita en este Sandbox. Activa Hermes OS dedicado para tu empresa.`,
        remaining: 0,
        trialExpired: true
      }, { status: 429 });
    }

    // 3. Check Daily Cap for IP
    if (currentCount > SANDBOX_DAILY_LIMIT) {
      return NextResponse.json({
        error: 'Límite de Sandbox diario alcanzado',
        message: `Has alcanzado tu límite diario de ${SANDBOX_DAILY_LIMIT} mensajes de prueba. Vuelve mañana o activa tu plan dedicado.`,
        remaining: 0
      }, { status: 429 });
    }

    // Build dynamic system prompt for Sandbox & Referral Trust Journey
    const effectiveCompany = companyName || 'Mi Empresa';
    const effectiveIndustry = industry || 'General';

    let conciergeInstructions = '';
    if (referralContext) {
      conciergeInstructions = `\n\nHERMES CONCIERGE MODE (REFERRAL TRUST JOURNEY ACTIVO):
- Origen del Contacto: Referido por ${referralContext.referredBy || 'Círculo Cercano'} (${referralContext.relationship || 'VIP Family'}).
- Prioridad: ${referralContext.priorityTier || 'VIP'}.
- REGLAS DE TONO E INSTITUCIONALIDAD:
  • NUNCA uses lenguaje de presión, ventas agresivas ni FOMO ("compra antes de que suba", "oportunidad de tu vida").
  • Habla con máxima elegancia institucional sobre la preservación de PATRIMONIO y PARTICIPACIÓN DESDE EL ORIGEN (Etapa Cero).
  • Salta las preguntas frías de prospección. Reconoce el origen de la invitación y guía hacia la tesis del proyecto y agendamiento con los fundadores.`;
    }

    // Evaluate Hermes OS v7 Journey & Playbook Engine
    const { HermesJourneyEngine } = await import('@/lib/hermes/journey-engine');
    const selectedJourneyId = referralContext ? 'family_referral_journey' : (effectiveIndustry.includes('Web3') ? 'web3_sovereign_education' : 'family_referral_journey');
    const { journey, playbook, objectiveState } = HermesJourneyEngine.evaluateJourney(selectedJourneyId);

    const journeyPromptInjection = `\n\nHERMES OS V7 JOURNEY & OBJECTIVE ENGINE:
- Journey Activo: ${journey.name} (Persona: ${journey.persona})
- Meta del Journey: ${journey.goal}
- Playbook Activo: ${playbook.name} (Etapa Actual: ${objectiveState.currentStageId})
- Objetivo de la Etapa: ${playbook.stages.find(s => s.id === objectiveState.currentStageId)?.objective}
- Acción Sugerida: ${objectiveState.recommendedAction}`;

    const basePrompt = (customPrompt ? `${customPrompt}\n\n` : '') + `Eres Hermes, el Agente Autónomo de Inteligencia Corporativa de ${effectiveCompany} (Industria: ${effectiveIndustry}).${conciergeInstructions}${journeyPromptInjection}

REGLAS DE FORMATO VISUAL Y ESTILO:
- Utiliza siempre emojis relevantes (✨, 🚀, 💡, 📅, 💳, 📌, 🎯) para dar dinamismo a tus respuestas.
- Organiza tu respuesta en párrafos cortos separados por doble salto de línea (enter).
- Usa listas con viñetas (•) o numeración cuando menciones opciones, precios o características.
- Usa negritas (**texto**) para destacar términos clave, precios o acciones importantes.
- NUNCA entregues texto plano sin formato ni párrafos apelmazados.`;

    // Call Hermes Bot Engine using Sandbox mode
    const botResponseText = await generateBotResponse({
      userMessage,
      history,
      projectSlug: 'sandbox',
      customSystemPrompt: basePrompt,
      projectContext: {
        title: effectiveCompany,
        slug: 'sandbox',
        industry: effectiveIndustry
      }
    });

    // Record intelligence event for Growth OS Mission Control Analytics
    try {
      const { HermesIntelligenceEngine } = await import('@/lib/hermes/intelligence-engine');
      HermesIntelligenceEngine.recordBehaviorEvent({
        projectSlug: 'sandbox',
        eventType: 'HANDLED_OBJECTION',
        channel: 'web',
        metadata: { companyName: effectiveCompany, industry: effectiveIndustry, ip, currentCount, lifetimeCount }
      });
    } catch (err) {
      // Non-blocking telemetry
    }

    return NextResponse.json({
      success: true,
      response: botResponseText,
      remaining: Math.max(0, SANDBOX_DAILY_LIMIT - currentCount)
    });
  } catch (err: any) {
    console.error('[Hermes Sandbox Error]:', err);
    return NextResponse.json({
      error: 'Error al procesar mensaje en Sandbox',
      details: err.message || 'Error interno'
    }, { status: 500 });
  }
}
