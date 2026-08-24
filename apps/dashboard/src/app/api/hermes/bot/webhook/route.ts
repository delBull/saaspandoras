import { NextRequest, NextResponse } from 'next/server';
import { HermesOSBotAdapter, TelegramUpdate } from '@/lib/hermes/bot/hermes-os-bot';

const botAdapter = new HermesOSBotAdapter();

export async function POST(req: NextRequest) {
  try {
    const update = (await req.json()) as TelegramUpdate;
    if (!update || !update.update_id) {
      return NextResponse.json({ ok: false, error: 'Invalid update payload' }, { status: 400 });
    }

    const result = await botAdapter.handleUpdate(update);
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error('[API /api/hermes/bot/webhook] Webhook handling error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
