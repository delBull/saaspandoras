import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateBotResponse } from '@/lib/marketing/bot-engine';

export async function POST(req: Request, props: { params: Promise<{ projectId: string }> }) {
  try {
    const params = await props.params;
    const { projectId } = params;
    
    const body = await req.json();
    const { message } = body;

    // Telegram sends a lot of events (typing, etc). We only care about text messages.
    // ALWAYS return 200 to Telegram so they don't retry endlessly.
    if (!message || !message.text) {
      return NextResponse.json({ success: true });
    }

    const chatId = message.chat.id;
    const text = message.text;

    // 1. Fetch the project configuration
    const projectRecord = await db.query.projects.findFirst({
      where: eq(projects.slug, projectId) // e.g., 'snarai'
    });

    if (!projectRecord) {
      console.warn(`[Telegram Bot] Webhook received for unknown project: ${projectId}`);
      return NextResponse.json({ success: true });
    }

    const metadata = (projectRecord.w2eConfig as any) || {};
    
    // Fallback security for S'Narai during setup (since DB script failed earlier due to pooler auth)
    let botToken = metadata?.botConfig?.telegramToken;
    let botInstructions = metadata?.aiKnowledgeBase || metadata?.botConfig?.instructions;
    
    if (projectId === 'snarai') {
       botToken = botToken || "8639272150:AAEVRsfHMP-9EzWRRvkZFRaKIiiFvp0K9tY";
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

    // 2. Build live context (In production, this could query your /api/v1/projects/[id]/analytics)
    const projectContext = {
      title: projectRecord.title,
      currentPrice: metadata?.tokenPriceUsd || 50,
      totalUnits: metadata?.totalUnits || 8,
      availableUnits: metadata?.availableUnits || 8,
      progressPercentage: metadata?.progressPercentage || 0,
      treasury: '0' // Could be mapped from DB
    };

    // 3. Generate AI Response
    const aiResponseText = await generateBotResponse({
      projectName: projectRecord.title,
      userMessage: text,
      projectContext,
      botInstructions,
      chatId: chatId.toString()
    });

    // 4. Send response back to Telegram User
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: aiResponseText,
        parse_mode: 'Markdown'
      })
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("[Telegram Bot] Webhook Error:", error);
    // Even if it fails, return 200 so Telegram doesn't queue and spam the webhook
    return NextResponse.json({ success: true });
  }
}
