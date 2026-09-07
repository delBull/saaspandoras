import { NextRequest, NextResponse } from 'next/server';
import { requireNexusAdmin } from '@/lib/nexus/collaborators-service';
import { db } from '@/db';
import { nexusCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendWhatsAppMessage } from '@/lib/whatsapp/utils/client';

export const runtime = 'nodejs'; // Use nodejs because whatsapp crypto might fail on edge

const COLORS = {
  AMBER: 16761344,
};

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-wallet-address, x-thirdweb-address, x-user-address',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: NextRequest) {
  const cors = getCorsHeaders(req);
  try {
    if (!(await requireNexusAdmin(req))) {
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 403, headers: cors });
    }

    const body = await req.json();
    const { assigneeId, message, requester, task } = body;

    if (!assigneeId || !message) {
      return NextResponse.json({ error: 'assigneeId and message are required' }, { status: 400, headers: cors });
    }

    const [collaborator] = await db
      .select()
      .from(nexusCollaborators)
      .where(eq(nexusCollaborators.id, Number(assigneeId)))
      .limit(1);

    if (!collaborator) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404, headers: cors });
    }

    let via = 'Discord';

    if (collaborator.whatsappPhone) {
      const waMsg = `*🔔 Nexus Operations Hub*\n\nHola ${collaborator.name},\n${message}\n\n_Asignado por: ${requester || 'Nexus Ops'}_`;
      try {
        await sendWhatsAppMessage(collaborator.whatsappPhone, waMsg);
        via = 'WhatsApp';
      } catch (err: any) {
        console.error('[Nexus Assignments] WhatsApp API error:', err);
        via = 'Discord (Fallback due to error)';
        await fallbackToDiscord(collaborator.name, message, requester, task);
      }
    } else {
      await fallbackToDiscord(collaborator.name, message, requester, task);
    }

    return NextResponse.json({ ok: true, via }, { headers: cors });
  } catch (error: any) {
    console.error('[Nexus Assignments] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500, headers: cors }
    );
  }
}

async function fallbackToDiscord(name: string, message: string, requester?: string, task?: string) {
  const WEBHOOK = process.env.DISCORD_SECURITY_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';
  if (!WEBHOOK) return;

  const embed = {
    title: '🔔 Nexus Operations Alert',
    description: `**Notificando a ${name}**\n${message}`,
    color: COLORS.AMBER,
    fields: [
      { name: '👤 Origen', value: requester || 'Nexus Ops', inline: true },
      ...(task ? [{ name: '📋 Contexto', value: task }] : []),
    ],
    footer: { text: 'Nexus Operations Hub' },
    timestamp: new Date().toISOString(),
  };

  await fetch(WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'Nexus Operations Hub',
      embeds: [embed],
    }),
  }).catch(() => null);
}
