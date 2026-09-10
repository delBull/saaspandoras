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

    // Build dynamic system prompt using sanitized DemoContext
    const { resolveSafeDemoContext, buildSandboxTrace } = await import('@/lib/hermes/simulator-types');
    const demoCtx = resolveSafeDemoContext({
      company: companyName,
      industry,
      goal: body.goal,
      rep: referralContext?.referredBy || body.rep,
      source: body.source,
    });

    const effectiveCompany = demoCtx.company;
    const effectiveIndustry = demoCtx.industry;

    // Detect Intent visually for demo feedback
    const lowerMsg = userMessage.toLowerCase();
    let detectedIntent: { type: string; label: string; confidence: string } | null = null;
    if (
      lowerMsg.includes('precio') ||
      lowerMsg.includes('costo') ||
      lowerMsg.includes('comprar') ||
      lowerMsg.includes('cuanto') ||
      lowerMsg.includes('cuánto') ||
      lowerMsg.includes('pagar') ||
      lowerMsg.includes('contratar')
    ) {
      detectedIntent = {
        type: 'HIGH_PRIORITY_PURCHASE',
        label: 'Intención de Compra / Consulta de Precios',
        confidence: '94%',
      };
    } else if (
      lowerMsg.includes('cita') ||
      lowerMsg.includes('agendar') ||
      lowerMsg.includes('visita') ||
      lowerMsg.includes('reunión') ||
      lowerMsg.includes('reunion') ||
      lowerMsg.includes('horario')
    ) {
      detectedIntent = {
        type: 'APPOINTMENT_REQUEST',
        label: 'Solicitud de Agenda / Visita',
        confidence: '91%',
      };
    }

    // Build live Hermes OS engine trace (5-layer pipeline + execution action)
    const trace = buildSandboxTrace({
      company: effectiveCompany,
      industry: effectiveIndustry,
      goal: demoCtx.goal,
      intent: detectedIntent,
      message: userMessage,
    });

    const honestyDirective = `
REGLAS DE TRANSPARENCIA Y HONESTIDAD DE DEMOSTRACIÓN:
- Eres Hermes, configurado en modo demostración para ${effectiveCompany} en la vertical de ${effectiveIndustry}.
- Saluda reconociendo a ${effectiveCompany} y el objetivo comercial del sector.
- Si el usuario pregunta por inventario, catálogo o precios específicos que no tengas detallados, responde demostrando la estructura comercial y aclara amablemente: "Para esta demostración estoy configurado con los flujos y parámetros estándar de ${effectiveIndustry} para ${effectiveCompany}. Al activar tu instancia dedicada en producción, cargaremos el catálogo, precios e inventario exactos de tu negocio para responder con total precisión."
- NUNCA inventes direcciones físicas, números de cuenta falsos ni nombres de productos que no conozcas.`;

    const basePrompt = `Eres Hermes, el Asistente y Cerrador Comercial IA de ${effectiveCompany} (Industria: ${effectiveIndustry}).${honestyDirective}

REGLAS DE FORMATO VISUAL Y ESTILO:
- Utiliza siempre emojis relevantes (✨, 🚀, 💡, 📅, 💳, 📌, 🎯) para dar dinamismo a tus respuestas.
- Organiza tu respuesta en párrafos cortos separados por doble salto de línea.
- Usa viñetas (•) o numeración para opciones y características.
- Usa negritas (**texto**) para destacar términos clave o llamados a la acción.
- Mantén un tono sumamente profesional, resolutivo y comercial sin ser agresivo.`;

    // Call Hermes Bot Engine using Sandbox mode
    const botResponseText = await generateBotResponse({
      userMessage,
      history,
      projectSlug: 'sandbox',
      customSystemPrompt: basePrompt,
      projectContext: {
        title: effectiveCompany,
        slug: 'sandbox',
        industry: effectiveIndustry,
      },
    });

    // Record intelligence event for Growth OS Mission Control Analytics
    try {
      const { HermesIntelligenceEngine } = await import('@/lib/hermes/intelligence-engine');
      HermesIntelligenceEngine.recordBehaviorEvent({
        projectSlug: 'sandbox',
        eventType: 'HANDLED_OBJECTION',
        channel: 'web',
        metadata: {
          companyName: effectiveCompany,
          industry: effectiveIndustry,
          ip,
          currentCount,
          lifetimeCount,
          attributionRep: demoCtx.attributionRep,
        },
      });
    } catch (err) {
      // Non-blocking telemetry
    }

    return NextResponse.json({
      success: true,
      response: botResponseText,
      remaining: Math.max(0, SANDBOX_DAILY_LIMIT - currentCount),
      intentDetected: detectedIntent,
      trace,
    });
  } catch (err: any) {
    console.error('[Hermes Sandbox Error]:', err);
    return NextResponse.json({
      error: 'Error al procesar mensaje en Sandbox',
      details: err.message || 'Error interno'
    }, { status: 500 });
  }
}
