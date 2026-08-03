import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { withSecurity, apiRateLimiter } from '@/lib/security-utils';

/**
 * 📢 VOICE NOTE GENERATOR ENGINE (ELEVENLABS API)
 * Convierte respuestas de texto de Hermes a notas de voz de Telegram
 */
async function generateVoiceNoteBuffer(text: string, voiceId: string, apiKey: string): Promise<ArrayBuffer | null> {
  try {
    const cleanText = text.replace(/[*_#`[\]()]/g, '').trim(); // Remove Markdown syntax for voice TTS
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[ElevenLabs Voice] API returned status ${response.status}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (err) {
    console.error('[ElevenLabs Voice] Error generating audio:', err);
    return null;
  }
}

async function sendTelegramVoiceNote(botToken: string, chatId: number, audioBuffer: ArrayBuffer) {
  try {
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('chat_id', chatId.toString());
    formData.append('voice', blob, 'hermes_voice_note.mp3');

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendVoice`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('[Telegram Voice] Failed to send voice note:', errData);
    }
  } catch (err) {
    console.error('[Telegram Voice] Error sending voice note:', err);
  }
}

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
      return NextResponse.json({ error: "Unknown project" }, { status: 400 });
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

    // Telegram sends a lot of events (typing, etc). We process text or voice notes.
    if (!message || (!message.text && !message.voice)) {
      return NextResponse.json({ error: "No text or voice" });
    }

    const chatId = message.chat.id;
    let text = message.text || "";
    const isVoiceMessage = !!message.voice;

    let botToken = metadata?.botConfig?.telegramToken;
    let botInstructions = metadata?.aiKnowledgeBase || metadata?.botConfig?.instructions;

    if (projectId === 'snarai') {
       botToken = botToken || process.env.TELEGRAM_SNARAI_BOT_TOKEN;
       botInstructions = botInstructions || `Eres el Gestor Patrimonial e Inmobiliario Oficial de S'Narai, un desarrollo boutique de lujo en la Zona Dorada de Bucerías (Riviera Nayarit, México) operado por Aztecas Hub S.A.P.I. de C.V. Tu objetivo es asistir a los usuarios de manera cortés, ejecutiva y muy profesional.`;
    }

    if (!botToken) {
      console.warn(`[Telegram Bot] No token found for project: ${projectId}`);
      return NextResponse.json({ error: "No token configured for project" }, { status: 400 });
    }

    // Intercept /start command for a custom welcome message
    if (text.trim() === '/start') {
      const welcomeMessage = `¡Hola! Soy Hermes, el Gestor Patrimonial e Inmobiliario Oficial de *${projectRecord.title}*. 🏛️\n\nEstoy aquí para resolver cualquier duda que tengas sobre la propiedad fraccionada en Bucerías, los Certificados de Participación respaldados por Aztecas Hub S.A.P.I. de C.V. y el uso de tus estancias de lujo.\n\n¿En qué te puedo ayudar hoy?`;

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

    // Handle incoming voice note transcription fallback if text is empty
    if (isVoiceMessage && !text) {
      text = "El usuario ha enviado una nota de voz preguntando por la propiedad y los certificados de S'Narai.";
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

INFORMACIÓN INSTITUCIONAL COMPLETA DE S'NARAI:
- Ubicación / Concepto: Desarrollo residencial boutique de lujo en la Zona Dorada de Bucerías, Riviera Nayarit (México), desarrollado por Aztecas Real Estate (+15 años de experiencia) y operado corporativamente bajo Aztecas Hub S.A.P.I. de C.V.
- Modelo de Participación: Propiedad Fraccionada mediante Certificados de Participación.
- Fases de Adquisición:
  * Fase Actual: ${projectContext.phaseName}
  * Precio por Certificado: $${projectContext.currentPrice} USD.
  * Progreso de la Fase: ${projectContext.progressPercentage}% completado.
- Opciones de Pago:
  1. Transferencia SPEI (Pesos MXN) mediante Fast Lane con reserva de 7 días (Soft-Lock) y emisión de contrato.
  2. En Línea / Web3: USDC vía portal oficial.
- Tono: Profesional, ejecutivo, cortés, enfocado en el valor patrimonial inmobiliario.`;
    }

    // 3. Generate AI Response
    const aiResponseText = await generateBotResponse({
      projectName: projectRecord.title,
      userMessage: text,
      projectContext,
      botInstructions,
      chatId: chatId.toString()
    });

    // Record Behavior Event in Hermes Intelligence Engine
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

    // 4. Send response back to Telegram User with Dynamic Inline Keyboard
    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "📊 Ver Fase & Precios", callback_data: "action_view_phase" },
          { text: "📑 Data Room S'Narai", url: "https://snarai.com/portal" }
        ],
        [
          { text: "🇲🇽 Reserva SPEI (Pesos MXN)", url: speiFastlane.checkoutUrl },
          { text: "💳 Comprar Web3 (USDC)", url: web3Checkout.checkoutUrl }
        ]
      ]
    };

    // Send Text Message
    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiResponseText,
        parse_mode: 'Markdown',
        reply_markup: inlineKeyboard
      })
    });
    
    if (!tgRes.ok) {
      const errText = await tgRes.text();
      console.error('[Telegram Bot] Failed to send message. Telegram API Response:', errText, 'AI Text:', aiResponseText);
      
      // Fallback: Try again without Markdown if it failed due to markdown parsing
      if (errText.includes('can\'t parse entities')) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: aiResponseText, // Raw text
            reply_markup: inlineKeyboard
          })
        });
      }
    }

    // 🎙️ Voice Note Feature (ElevenLabs API)
    // If the user sent a voice message or ElevenLabs credentials are configured
    const elevenVoiceId = process.env.ELEVENLABS_VOICE_ID || process.env.ELEVENLABS_SNARAI_VOICE_ID || '9Godp7dNohUvXk6qp0gS';
    const elevenApiKey = process.env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_SNARAI_API_KEY;

    if (elevenApiKey && (isVoiceMessage || process.env.ENABLE_HERMES_ALWAYS_VOICE === 'true')) {
      const voiceBuffer = await generateVoiceNoteBuffer(aiResponseText, elevenVoiceId, elevenApiKey);
      if (voiceBuffer) {
        await sendTelegramVoiceNote(botToken, chatId, voiceBuffer);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Telegram Bot] Webhook Error:", error);
    return NextResponse.json({ success: true });
  }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow enough time for LLM generation

export const POST = withSecurity(handler as any, { rateLimit: apiRateLimiter });
