import { NextRequest, NextResponse } from 'next/server';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { Redis } from 'ioredis';

// Strictly limit sandbox usage to max 10 messages per IP per day to conserve LLM resources
const SANDBOX_DAILY_LIMIT = 10;
let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
  } catch (err) {
    console.warn('[Hermes Sandbox] Redis connection failed, falling back to in-memory limit', err);
  }
}

// In-memory fallback rate limiter
const inMemoryLimits = new Map<string, { count: number; date: string }>();

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

    let currentCount = 0;

    if (redis) {
      currentCount = await redis.incr(rateLimitKey);
      if (currentCount === 1) {
        await redis.expire(rateLimitKey, 86400); // 24 hours
      }
    } else {
      const record = inMemoryLimits.get(rateLimitKey);
      if (!record || record.date !== today) {
        inMemoryLimits.set(rateLimitKey, { count: 1, date: today });
        currentCount = 1;
      } else {
        record.count += 1;
        currentCount = record.count;
      }
    }

    if (currentCount > SANDBOX_DAILY_LIMIT) {
      return NextResponse.json({
        error: 'Límite de Sandbox alcanzado',
        message: `Has alcanzado el límite gratuito de ${SANDBOX_DAILY_LIMIT} mensajes por día en el Sandbox de Hermes. Para habilitar volumen ilimitado y conectar tu empresa, activa tu plan en Growth OS.`,
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
