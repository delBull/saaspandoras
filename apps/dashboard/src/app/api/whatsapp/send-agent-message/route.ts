// API ENDPOINT FOR AGENTS TO SEND WHATSAPP MESSAGES
// Allows authorized agents to respond to human conversations

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logMessage } from '@/lib/whatsapp/preapply-db';
import { sendWhatsAppMessage } from '@/lib/whatsapp/client';
// TODO: Implement isAuthorizedAgent from notifications service
const isAuthorizedAgent = (agentId: string) => {
  // For now, accept all agents - add your authorization logic here
  return true; // Change to false for production security
};

/**
 * POST /api/whatsapp/send-agent-message
 *
 * Body: {
 *   sessionId: string,
 *   message: string,
 *   agentId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, agentId } = body;

    if (!sessionId || !message || !agentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: sessionId, message, agentId'
      }, { status: 400 });
    }

    // Verify agent is authorized
    if (!isAuthorizedAgent(agentId)) {
      console.error(`❌ Unauthorized agent ${agentId} attempted to send message`);
      return NextResponse.json({
        success: false,
        error: 'Unauthorized agent'
      }, { status: 403 });
    }

    // Log the outgoing agent message
    await logMessage(sessionId, 'outgoing', message, 'text');

    // TODO: Get phone number from session/user lookup
    // For now, we'll need to get user phone from session
    // This is a placeholder - you need to implement getting the phone number

    const userPhone = '521234567890'; // TODO: Get from session lookup

    // Send WhatsApp message
    const sendResult = await sendWhatsAppMessage(userPhone, message);

    if (!sendResult.success) {
      console.error('❌ Failed to send agent WhatsApp message:', sendResult.error);
      return NextResponse.json({
        success: false,
        error: sendResult.error || 'Failed to send message'
      }, { status: 500 });
    }

    console.log(`✅ Agent ${agentId} sent message via WhatsApp: ${sendResult.messageId}`);

    return NextResponse.json({
      success: true,
      messageId: sendResult.messageId,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('❌ Agent message send error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

interface HumanSession {
  id: string;
  userId: string;
  userPhone: string;
  lastMessage: string;
  messageCount: number;
  createdAt: string;
  lastActivity: string;
}

/**
 * GET /api/whatsapp/send-agent-message_sessions
 * Returns active human-agent sessions for agents to respond
 */
export function GET(request: NextRequest) {
  try {
    const agentId = request.nextUrl.searchParams.get('agentId');

    if (!agentId || !isAuthorizedAgent(agentId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or unauthorized agent ID'
      }, { status: 403 });
    }

    // TODO: Implement session lookup for human conversations
    // This should return active sessions where flow_type = 'human'
    // with recent messages, user info, etc.

    const activeSessions: HumanSession[] = []; // TODO: Implement this

    return NextResponse.json({
      success: true,
      sessions: activeSessions
    });

  } catch (error) {
    console.error('❌ Get agent sessions error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}