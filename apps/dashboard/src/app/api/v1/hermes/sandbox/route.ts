import { NextRequest, NextResponse } from 'next/server';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { Redis } from 'ioredis';

// Strictly limit sandbox usage to max 10 messages/day AND max 30 total lifetime messages per IP
const SANDBOX_DAILY_LIMIT = 10;
const SANDBOX_LIFETIME_LIMIT = 30;
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, industry, customPrompt, userMessage, history = [] } = body;

    if (!userMessage || typeof userMessage !== 'string') {
      return NextResponse.json({ error: 'Mensaje de usuario requerido' }, { status: 400 });
    }

    // Determine client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'sandbox-user';
    const today: string = new Date().toISOString().split('T')[0] ?? '';
    const rateLimitKey = `hermes:sandbox:ratelimit:${ip}:${today}`;
    const lifetimeKey = `hermes:sandbox:lifetime:${ip}`;

    let currentCount = 0;
    let lifetimeCount = 0;

    if (redis) {
      currentCount = await redis.incr(rateLimitKey);
      if (currentCount === 1) {
        await redis.expire(rateLimitKey, 86400); // 24 hours
      }
      lifetimeCount = await redis.incr(lifetimeKey);
    } else {
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

    // Check Lifetime Cap (Trial Period Expiration)
    if (lifetimeCount > SANDBOX_LIFETIME_LIMIT) {
      return NextResponse.json({
        error: 'Periodo de Prueba Agotado',
        message: `Has completado el periodo de prueba gratuito en el Sandbox de Hermes (máximo ${SANDBOX_LIFETIME_LIMIT} mensajes totales). Para conectar a Hermes con tu empresa en producción y habilitar volumen ilimitado, activa tu plan en Pandora's Growth OS.`,
        remaining: 0,
        trialExpired: true
      }, { status: 429 });
    }

    // Check Daily Cap
    if (currentCount > SANDBOX_DAILY_LIMIT) {
      return NextResponse.json({
        error: 'Límite de Sandbox diario alcanzado',
        message: `Has alcanzado el límite diario de ${SANDBOX_DAILY_LIMIT} mensajes. Vuelve mañana o activa tu plan en Growth OS para uso ilimitado.`,
        remaining: 0
      }, { status: 429 });
    }

    // Build dynamic system prompt for Sandbox
    const effectiveCompany = companyName || 'Mi Empresa';
    const effectiveIndustry = industry || 'General';
    const basePrompt = customPrompt || `Eres Hermes, el Agente Autónomo de Inteligencia Corporativa de ${effectiveCompany} (Industria: ${effectiveIndustry}). Tu objetivo es atender a los clientes con máxima elegancia, responder sus dudas sobre servicios/productos, agendar citas y calificar leads.`;

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
