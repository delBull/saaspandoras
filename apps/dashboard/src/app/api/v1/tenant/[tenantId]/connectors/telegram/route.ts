import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }

    // TODO: Validate tenant authorization and save securely to DB/Vault
    
    console.log(`[connectors/telegram] Saving config for tenant ${tenantId}:`, {
      token: '***'
    });

    return NextResponse.json({ success: true, message: 'Telegram bot token saved successfully' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
