// HUMAN AGENT FLOW HANDLER
// Maneja conversaciones con agentes humanos una vez escalada

import { NextResponse } from 'next/server';
import type { WhatsAppSession } from '@/db/schema';
import { logMessage, updateSessionState } from '@/lib/whatsapp/preapply-db';

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: { body: string };
  timestamp: string;
  id: string;
}

/**
 * Resultado del procesamiento de flujo humano
 */
interface HumanFlowResult {
  handled: boolean;
  flowType: string;
  response?: string;
  action?: string;
  progress?: string;
  status?: string;
  isCompleted?: boolean;
  projectCreated?: boolean;
  error?: string;
}

/**
 * Handle Human Agent Flow Messages - Human-assisted conversations
 */
export async function handleHumanAgentFlow(
  message: WhatsAppMessage,
  session: WhatsAppSession
): Promise<HumanFlowResult> {
  console.log(`👨‍💼 Processing human flow for session ${session.id}`);

  try {
    // Log incoming message (will be visible to human agents)
    const messageBody = message.text?.body || '';
    await logMessage(session.id, 'incoming', messageBody, message.type || 'text');

    // In human flow, we just log everything and notify agents
    // The actual response will come from a human agent via admin panel

    // Check if agent wants to end conversation (agent-side command)
    // This would be handled via admin panel, not webhook

    console.log(`📩 Message logged for human agent review - Session: ${session.id}`);

    // For now, send an acknowledgment response
    const ackMessage = `Mensaje recibido. Un agente está revisando tu consulta.

Mantente en línea, te responderemos pronto.`;

    await logMessage(session.id, 'outgoing', ackMessage, 'text');

    // Update session to indicate human involvement
    await updateSessionState(session.id, { currentStep: (session.currentStep || 0) + 1 });

    return {
      handled: true,
      flowType: 'human',
      response: ackMessage,
      action: 'message_logged_for_agent',
      status: 'awaiting_agent_response'
    };

  } catch (error) {
    console.error('❌ Human Agent Flow Error:', error);

    const errorMessage = "Disculpa, hubo un error en la conexión. ¿Puedes intentar nuevamente?";
    await logMessage(session.id, 'outgoing', errorMessage, 'text');

    return {
      handled: false,
      flowType: 'human',
      error: 'Processing error',
      status: 'error'
    };
  }
}
