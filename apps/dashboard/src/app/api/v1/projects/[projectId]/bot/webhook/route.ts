import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

async function handler(req: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { projectId } = params;

    // 0. Validate Telegram secret token (anti-forgery)
    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId),
    });

    if (!projectRecord) {
      console.warn(`[Telegram Bot] Webhook received for unknown project: ${projectId}`);
      return NextResponse.json({ success: true });
    }

    const metadata = (projectRecord.w2eConfig as any) || {};
    const storedSecret = metadata?.botConfig?.webhookSecret;

    if (storedSecret) {
      const requestSecret = req.headers.get('x-telegram-bot-api-secret-token');
      if (!requestSecret || requestSecret !== storedSecret) {
        console.warn(`[Telegram Bot] Invalid secret token for project: ${projectId}`);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json();
    const { message } = body;

    // Telegram sends a lot of events (typing, etc). We only care about text messages.
    // ALWAYS return 200 to Telegram so they don't retry endlessly.
    if (!message || !message.text) {
      return NextResponse.json({ success: true });
    }

    const chatId = message.chat.id;
    const text = message.text;

    let botToken = metadata?.botConfig?.telegramToken;
    let botInstructions = metadata?.aiKnowledgeBase || metadata?.botConfig?.instructions;

    if (projectId === 'snarai') {
       botToken = botToken || process.env.TELEGRAM_SNARAI_BOT_TOKEN;
       botInstructions = botInstructions || `Eres el Conserje Oficial de S'Narai, un proyecto inmobiliario premium de Riviera Nayarit (México) operado por Aztecas Tokenización y Pandoras Protocol. Tu objetivo es asistir a los usuarios de manera cortés, premium y muy profesional.`;
    }

    if (!botToken) {
      console.warn(`[Telegram Bot] No token found for project: ${projectId}`);
      return NextResponse.json({ success: true });
    }

    // Intercept /start command for a custom welcome message
    if (text.trim() === '/start') {
      const welcomeMessage = `¡Hola! Soy el Conserje Oficial de *${projectRecord.title}*. 🏛️\n\nEstoy aquí para resolver cualquier duda que tengas sobre el proyecto, las fases de inversión y cómo adquirir tus Títulos Digitales.\n\n¿En qué te puedo ayudar hoy?`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeMessage,
          parse_mode: 'Markdown'
        })
      });
      return NextResponse.json({ success: true });
    }

    // 2. Fetch Live Project Analytics & Phase Data from DB
    let liveStats: any = {};
    try {
      const { calculatePhaseStats } = await import('@/lib/projects/stats');
      liveStats = await calculatePhaseStats(projectRecord.id);
    } catch (e) {
      console.warn(`[Telegram Bot] Could not fetch live phase stats for project ${projectId}`, e);
    }

    const currentPhase = liveStats?.currentPhase || liveStats?.phases?.[0];
    const projectContext = {
      title: projectRecord.title,
      slug: projectRecord.slug,
      currentPrice: currentPhase?.tokenPrice || metadata?.tokenPriceUsd || 50,
      phaseName: currentPhase?.name || 'Fase Fundadores',
      tokensSold: currentPhase?.tokensSold || 0,
      totalUnits: currentPhase?.totalTokens || metadata?.totalUnits || 30000,
      availableUnits: currentPhase?.remainingTokens || metadata?.availableUnits || 30000,
      progressPercentage: currentPhase?.percent || metadata?.progressPercentage || 0,
      treasury: liveStats?.treasuryDisplay || '0 USDC',
      holdersCount: liveStats?.holdersCount || 0
    };

    // Deep context injection for S'Narai
    if (projectId === 'snarai') {
      botInstructions = `${botInstructions || ''}

INFORMACIÓN INSTITUCIONAL Y LEGAL COMPLETA DE S'NARAI:
- Ubicación / Concepto: Proyecto residencial boutique de lujo en Riviera Nayarit (México), desarrollado por Aztecas Tokenización y respaldado por la arquitectura Pandoras Growth OS (Titular registral MXHUB S.A. de C.V.).
- Modelo de Capitalización: Fraccionamiento mediante Títulos Digitales y Licenciamiento Territorial.
- Fases de Inversión:
  * Fase Actual: ${projectContext.phaseName}
  * Precio por Título Digital / Token: $${projectContext.currentPrice} USD / USDC.
  * Progreso de la Fase: ${projectContext.progressPercentage}% completado (${projectContext.tokensSold} tokens vendidos de ${projectContext.totalUnits}).
  * Miembros DAO / Holders: ${projectContext.holdersCount}.
- Opciones de Compra / Pago:
  1. En Línea / Web3: USDC / USDT vía red Sepolia/Polygon a través de la dApp/Portal oficial.
  2. Fast Lane / Transferencia SPEI: Opción de reserva y pago en moneda local (MXN) con aprobación administrativa y hash de acuerdo digital.
- Gobernanza & Derechos:
  * Cada Título Digital representa poder de voto proporcional en la DAO de S'Narai.
  * Distribuciones de utilidades pro-rata en USDC directamente a la wallet/balance del usuario.
  * Acceso al Data Room Institucional (/nexus) organizado en 6 carpetas (Company, IP, Technology, Business, Legal, Investor).
- Documentación Registral & Legal:
  * La marca madre PANDORAS™ está registrada bajo titularidad inalienable de MXHUB ECOSISTEMA BLOCKCHAIN S.A. DE C.V. (Clases 36 y 42).
- Tono: Profesional, ejecutivo, cortés, altamente conocedor del real estate tokenizado y la tecnología Web3. Invita siempre al usuario a conectar su wallet o acceder a Mi Portal (/portal).`;
    }

    // 3. Generate AI Response
    const aiResponseText = await generateBotResponse({
      projectName: projectRecord.title,
      userMessage: text,
      projectContext,
      botInstructions,
      chatId: chatId.toString()
    });

    // Record Behavior Event in Hermes Intelligence Engine (Phase 4)
    const { HermesIntelligenceEngine } = await import('@/lib/hermes/intelligence-engine');
    const { HermesCommerceEngine } = await import('@/lib/hermes/commerce-engine');

    HermesIntelligenceEngine.recordBehaviorEvent({
      projectSlug: projectId,
      eventType: text.toLowerCase().includes('comprar') || text.toLowerCase().includes('reserva') ? 'INITIATED_CHECKOUT' : 'VIEWED_PHASE',
      channel: 'telegram',
      metadata: { textLength: text.length }
    });

    const web3Checkout = HermesCommerceEngine.createCheckoutSession({
      leadId: chatId.toString(),
      projectSlug: projectId,
      tokenPriceUsd: projectContext.currentPrice,
      paymentMethod: 'WEB3_USDC'
    });

    const speiFastlane = HermesCommerceEngine.createCheckoutSession({
      leadId: chatId.toString(),
      projectSlug: projectId,
      tokenPriceUsd: projectContext.currentPrice,
      paymentMethod: 'SPEI_FASTLANE'
    });

    // 4. Send response back to Telegram User with Dynamic Inline Keyboard (Phase 2 & 3 - Communications & Commerce)
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "📊 Ver Fase & Precios", callback_data: "action_view_phase" },
          { text: "📑 Dossier Legal (/nexus)", url: "https://pandoras.finance/nexus" }
        ],
        [
          { text: "💳 Comprar Web3 (USDC)", url: web3Checkout.checkoutUrl },
          { text: "🇲🇽 Reserva SPEI (Pesos)", url: speiFastlane.checkoutUrl }
        ]
      ]
    };

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiResponseText,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      })
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Telegram Bot] Webhook Error:", error);
    // Even if it fails, return 200 so Telegram doesn't queue and spam the webhook
    return NextResponse.json({ success: true });
  }
}

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter });
