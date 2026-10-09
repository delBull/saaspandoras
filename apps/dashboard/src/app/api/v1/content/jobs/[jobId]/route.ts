import { NextResponse } from 'next/server';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { db } from '@/db';

export async function GET(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const client = await IntegrationKeyService.validateKey(apiKey);
    if (!client) {
      return NextResponse.json({ error: 'Invalid API Key' }, { status: 401 });
    }

    const permissions = (client.permissions as string[]) || [];
    if (!permissions.includes('content.asset.read')) {
      return NextResponse.json({ error: 'Missing required permission: content.asset.read' }, { status: 403 });
    }

    // Mock implementation for Phase 1
    return NextResponse.json({ 
      success: true, 
      jobId,
      status: 'completed'
    });
  } catch (error: any) {
    console.error('[ContentAPI] GET /jobs/:jobId error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}
