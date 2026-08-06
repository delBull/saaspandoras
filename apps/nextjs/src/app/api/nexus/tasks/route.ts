import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const COLORS = {
  PURPLE: 10181046,
  AMBER: 16761344,
  GREEN: 5763719,
  RED: 15548997,
};

interface TaskPayload {
  kind?: 'task' | 'alert';
  requester?: string;
  task?: string;
  details?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  category?: string;
  dueDate?: string;
  taskId?: string;
  message?: string;
}

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 3000;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();
    const lastRequest = rateLimitMap.get(ip);
    if (lastRequest && now - lastRequest < RATE_LIMIT_COOLDOWN_MS) {
      return NextResponse.json({ ok: false, error: 'Demasiadas solicitudes. Espera unos segundos.' }, { status: 429 });
    }
    rateLimitMap.set(ip, now);

    const body = await req.json() as TaskPayload;
    const kind = body.kind === 'alert' ? 'alert' : 'task';
    const WEBHOOK = process.env.DISCORD_SECURITY_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || '';

    if (kind === 'task') {
      if (!body.requester || !body.task) {
        return NextResponse.json({ ok: false, error: 'requester and task are required' }, { status: 400 });
      }
    }

    if (!WEBHOOK) {
      console.warn('[Nexus Tasks] DISCORD_SECURITY_WEBHOOK_URL / DISCORD_WEBHOOK_URL missing');
      return NextResponse.json({ ok: false, error: 'Discord webhook not configured' }, { status: 500 });
    }

    const taskId = body.taskId || `NX-${Date.now().toString(36).toUpperCase()}`;    const due = body.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const embed: any =
      kind === 'task'
        ? {
            title: `🧾 Nueva Tarea Pendiente — ${taskId}`,
            color: COLORS.PURPLE,
            fields: [
              { name: '👤 Solicitante', value: body.requester || 'N/A', inline: true },
              { name: '🎯 Prioridad', value: body.priority || 'MEDIUM', inline: true },
              { name: '📅 Sugerida', value: due, inline: true },
              { name: '📋 Tarea', value: body.task || 'N/A' },
              { name: '📝 Detalles', value: body.details || 'Sin detalles adicionales' },
              ...(body.category ? [{ name: '🏷️ Categoría', value: body.category, inline: true }] : []),
            ],
            footer: { text: 'Nexus Operations Hub · Pendiente de atención' },
            timestamp: new Date().toISOString(),
          }
        : {
            title: '🔔 Nexus Operations Alert',
            description: body.message || body.details || 'Actualización de operaciones',
            color: COLORS.AMBER,
            fields: [
              { name: '👤 Origen', value: body.requester || 'Nexus Ops', inline: true },
              ...(body.task ? [{ name: '📋 Contexto', value: body.task }] : []),
            ],
            footer: { text: 'Nexus Operations Hub' },
            timestamp: new Date().toISOString(),
          };

    const discordRes = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Nexus Operations Hub',
        embeds: [embed],
      }),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error('[Nexus Tasks] Discord webhook error:', errText);
      return NextResponse.json({ ok: false, error: errText }, { status: 500 });
    }

    return NextResponse.json({ ok: true, taskId });
  } catch (e: any) {
    console.error('[Nexus Tasks] Error:', e);
    return NextResponse.json({ ok: false, error: e.message || 'Internal error' }, { status: 500 });
  }
}
