// MULTI-FLOW WHATSAPP ROUTER
// Webhook principal que maneja todos los tipos de conversaciones

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { WHATSAPP, validateWhatsAppConfig } from '@/lib/whatsapp/config';
import { upsertWhatsAppUser, getOrCreateActiveSession, switchSessionFlow } from '@/lib/whatsapp/preapply-db';
import { handleEightQuestionsFlow } from './handlers/eight-q';
import { handleHighTicketFlow } from './handlers/high-ticket';
import { handleSupportFlow } from './handlers/support';
import { handleHumanAgentFlow } from './handlers/human';
import { handleUtilityFlow } from './handlers/utility';

// Flow Handlers Map
const FLOW_HANDLERS = {
  eight_q: handleEightQuestionsFlow,
  high_ticket: handleHighTicketFlow,
  support: handleSupportFlow,
  human: handleHumanAgentFlow,
  utility: handleUtilityFlow,
} as const;

// Flow Detection Keywords (each keyword triggers flow switch)
const FLOW_TRIGGERS = {
  high_ticket: ['soy founder', 'high ticket', 'capital', 'inversor', 'invertir', 'founder', 'founders', 'founders program', 'want founders'],
  support: ['ayuda', 'problema', 'ayudame', 'soporte', 'hablar con humano'],
  eight_q: ['eight questions', '8 preguntas', 'cuestionario', 'filtro 8q', 'inicio', 'empezar', 'iniciar', 'start', 'comenzar'],
  utility: ['utility protocol', 'protocolo utilidad', 'work to earn', 'w2e', 'loom protocol', 'arquitectura utilidad', 'protocolo funcional'],
  human: [], // Only switched by admin/system
} as const;

/**
 * Detect if message should trigger flow switch
 */
function detectFlowChange(messageBody: string, currentFlow: string): string | null {
  // Don't switch if already in target flow
  for (const [flowType, keywords] of Object.entries(FLOW_TRIGGERS)) {
    if (flowType === currentFlow) continue;

    const hasKeyword = keywords.some(keyword =>
      messageBody.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      console.log(`🔄 Flow switch detected from ${currentFlow} to ${flowType}`);
      return flowType;
    }
  }

  return null; // No flow change needed
}

/**
 * Detect if first message from founders should force high_ticket flow
 */
function shouldForceHighTicketFlow(messageBody: string, session: any): boolean {
  // Only for brand new sessions (step 0) that haven't been assigned to high_ticket yet
  if (session.currentStep !== 0 || session.flowType !== 'eight_q') {
    return false;
  }

  const lowerBody = messageBody.toLowerCase();

  // Force high_ticket if message contains founders keywords
  const hasFoundersKeywords = FLOW_TRIGGERS.high_ticket.some(keyword =>
    lowerBody.includes(keyword.toLowerCase())
  );

  if (hasFoundersKeywords) {
    console.log('🎯 Founders message detected - forcing high_ticket flow');
    return true;
  }

  return false;
}

async function handleMultiFlowMessage(message: any, userId: string, sessionId: string) {
  const messageBody = message.text?.body || '';

  // Get current session
  const session = await getOrCreateActiveSession(userId);
  if (!session) {
    console.error('❌ Failed to get/create session');
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }

  // Force high_ticket flow for founders first messages
  if (shouldForceHighTicketFlow(messageBody, session)) {
    await switchSessionFlow(session.id, 'high_ticket');
    console.log(`🚀 Founders user forced to high_ticket flow`);
    return await handleHighTicketFlow(message, { ...session, flowType: 'high_ticket' });
  }

  // Check for flow switch (for existing conversations)
  const newFlowType = detectFlowChange(messageBody, session.flowType);
  if (newFlowType && newFlowType !== session.flowType) {
    await switchSessionFlow(session.id, newFlowType);
    console.log(`✅ Switched to flow: ${newFlowType}`);
    // Return updated session for consistent handling below
    const updatedSession = { ...session, flowType: newFlowType };
    const handler = FLOW_HANDLERS[newFlowType as keyof typeof FLOW_HANDLERS];
    return await handler(message, updatedSession);
  }

  // Route to appropriate handler
  const handler = FLOW_HANDLERS[session.flowType as keyof typeof FLOW_HANDLERS];
  if (!handler) {
    console.error(`❌ No handler for flow type: ${session.flowType}`);
    return NextResponse.json({ error: 'Handler not found' }, { status: 500 });
  }

  // Execute handler
  try {
    const result = await handler(message, session);
    console.log(`✅ Flow ${session.flowType} handled successfully`);
    return result;
  } catch (error) {
    console.error(`❌ Error in flow handler ${session.flowType}:`, error);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}

// ===================
// WEBHOOK ENDPOINTS
// ===================

// GET - Webhook Verification (Same as before)
export function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`🔐 [${timestamp}] WhatsApp multi-flow webhook verification`);

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (!validateWhatsAppConfig()) {
    console.error('❌ WhatsApp config validation failed');
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  if (mode !== 'subscribe' || token !== WHATSAPP.VERIFY_TOKEN) {
    console.warn('🚫 Invalid webhook verification');
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  console.log('✅ WhatsApp multi-flow webhook verified');
  return new Response(challenge, { status: 200 });
}

// POST - Multi-Flow Message Handling
export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`📱 [${timestamp}] WhatsApp multi-flow webhook message`);

  try {
    const body = await request.json();

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📨 Multi-flow webhook payload:', JSON.stringify(body, null, 2));
    }

    // Validate message structure
    if (!body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      console.log('ℹ️ No message in payload (status update)');
      return NextResponse.json({ received: true });
    }

    const message = body.entry[0].changes[0].value.messages[0];
    console.log(`💬 Message from ${message.from}: ${message.text?.body?.substring(0, 100)}...`);

    // Step 1: Get or create user
    const userPhone = message.from;
    const user = await upsertWhatsAppUser(userPhone);
    if (!user) {
      console.error('❌ Failed to create user');
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    console.log(`👤 User ${user.id} (${user.phone}) - Priority: ${user.priorityLevel}`);

    // Step 2: Handle multi-flow routing
    const result = await handleMultiFlowMessage(message, user.id, user.id);

    // Step 3: Log final result - Result is a NextResponse, not an object
    console.log(`🎯 Multi-flow webhook completed successfully`, { timestamp });

    return result;

  } catch (error) {
    console.error('❌ Multi-flow webhook critical error:', error);
    return NextResponse.json(
      { error: 'Internal server error', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
