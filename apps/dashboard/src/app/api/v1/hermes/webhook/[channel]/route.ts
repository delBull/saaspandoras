import { NextRequest, NextResponse } from 'next/server';
import { OrganizationSDK } from '@/lib/platform/organization-sdk';
import { generateBotResponse } from '@/lib/marketing/bot-engine';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * 📡 Pandora's Platform OS v3 — Unified Multi-Tenant Webhook Endpoint
 * /api/v1/hermes/webhook/[channel]
 *
 * Channel: 'telegram' | 'whatsapp' | 'webchat' | 'signalwire'
 * Query Params: ?slug=org-slug OR ?projectId=123
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ channel: string }> }
) {
  try {
    const { channel } = await params;
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug') || searchParams.get('project');
    const projectIdStr = searchParams.get('projectId');

    let projectId: number | null = projectIdStr ? parseInt(projectIdStr, 10) : null;

    if (!projectId && slug) {
      const proj = await db.query.projects.findFirst({
        where: eq(projects.slug, slug),
        columns: { id: true }
      });
      if (proj) projectId = proj.id;
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project or slug parameter is required' }, { status: 400 });
    }

    // Resolve tenant context via OrganizationSDK
    const orgContext = await OrganizationSDK.resolve(projectId, 'HERMES');
    const installed = orgContext.activeProduct;

    if (!installed || installed.status === 'suspended') {
      return NextResponse.json({ error: 'Hermes product is not active for this organization' }, { status: 403 });
    }

    const body = await req.json();

    // Extract user message based on channel payload format
    let userMessage = '';
    let chatId = '';

    if (channel === 'telegram') {
      userMessage = body?.message?.text || '';
      chatId = String(body?.message?.chat?.id || '');
    } else if (channel === 'whatsapp') {
      userMessage = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || body?.message || '';
      chatId = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from || body?.from || '';
    } else {
      userMessage = body?.message || body?.text || '';
      chatId = body?.chatId || body?.userId || 'webchat-session';
    }

    if (!userMessage) {
      return NextResponse.json({ ok: true, note: 'No text message to process' });
    }

    // Build custom knowledge prompt from Client KnowledgePack (Wizard output)
    const knowledgePack = (installed.config as any)?.knowledgePack;
    let customKnowledgePrompt = '';

    if (knowledgePack) {
      customKnowledgePrompt = `
BASE DE CONOCIMIENTO CONFIGURADA POR LA EMPRESA (${knowledgePack.companyName || orgContext.name}):
- Industria: ${knowledgePack.industry || 'General'}
- Descripción: ${knowledgePack.description || ''}
- Horario de Atención: ${knowledgePack.schedule || ''}
- Contacto: Teléfono: ${knowledgePack.phone || ''}, Email: ${knowledgePack.email || ''}
- Servicios / Productos Clave: ${(knowledgePack.services || []).join(', ')}
- Preguntas Frecuentes (FAQs):
${(knowledgePack.faqs || []).map((f: any) => `  * Q: ${f.question}\n    A: ${f.answer}`).join('\n')}
      `;
    }

    const customSystemPrompt = (installed.config as any)?.prompt || `Eres Hermes, el Agente Autónomo de ${orgContext.name}. Atiende a los clientes con amabilidad y precisión.`;
    const fullSystemPrompt = `${customSystemPrompt}\n\n${customKnowledgePrompt}`;

    // Execute Bot Engine with resolved context
    const botReply = await generateBotResponse({
      userMessage,
      chatId,
      projectSlug: orgContext.slug,
      projectName: orgContext.name,
      customSystemPrompt: fullSystemPrompt,
      projectContext: {
        title: orgContext.name,
        slug: orgContext.slug,
      }
    });

    // If Telegram webhook, reply back directly if bot token exists
    if (channel === 'telegram' && chatId && (installed.connectors as any)?.telegram?.botToken) {
      const botToken = (installed.connectors as any).telegram.botToken;
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: botReply })
      }).catch(e => console.error('[Webhook Telegram Send Error]:', e));
    }

    return NextResponse.json({
      ok: true,
      channel,
      project: orgContext.slug,
      reply: botReply
    });
  } catch (error: any) {
    console.error('[Hermes Unified Webhook Error]:', error);
    return NextResponse.json({ error: error?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
