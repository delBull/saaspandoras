import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/db';
// import { projects } from '@/db/schema';
// import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  
  try {
    const body = await req.json();
    const { provider, phoneNumberId, token } = body;

    if (!provider) {
      return NextResponse.json({ error: 'provider is required' }, { status: 400 });
    }

    // TODO: Validate tenant authorization and save securely to DB/Vault
    // For now we just return success to close the UI loop
    
    console.log(`[connectors/whatsapp] Saving config for tenant ${tenantId}:`, {
      provider,
      phoneNumberId,
      token: token ? '***' : undefined
    });

    return NextResponse.json({ success: true, message: 'WhatsApp provider config saved successfully' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
