import { NextRequest, NextResponse } from 'next/server';
import { db } from '@saasfly/db-core';
import { hermesBriefingPreferences } from '@saasfly/db-core/schema';
import { eq } from '@saasfly/db-core';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // En producción, aquí se valida el token y se extrae el organizationId
    // Para simplificar, asumiremos que se extrajo correctamente:
    const organizationId = req.headers.get('x-tenant-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Missing x-tenant-id' }, { status: 400 });
    }

    const prefs = await db.query.hermesBriefingPreferences.findFirst({
      where: eq(hermesBriefingPreferences.organizationId, organizationId)
    });

    return NextResponse.json({ success: true, data: prefs || {} });
  } catch (error) {
    console.error('[GET /tma/briefings/preferences] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = req.headers.get('x-tenant-id');
    if (!organizationId) {
      return NextResponse.json({ error: 'Missing x-tenant-id' }, { status: 400 });
    }

    const body = await req.json();
    const { enabled, channel, leadTimeMinutes, targetEmails, targetPhones, includeFacts, includeFinancials } = body;

    const result = await db.insert(hermesBriefingPreferences)
      .values({
        organizationId,
        enabled: enabled ?? true,
        channel: channel || 'EMAIL',
        leadTimeMinutes: leadTimeMinutes ?? 30,
        targetEmails: targetEmails || [],
        targetPhones: targetPhones || [],
        includeFacts: includeFacts ?? true,
        includeFinancials: includeFinancials ?? false,
      })
      .onConflictDoUpdate({
        target: hermesBriefingPreferences.organizationId,
        set: {
          enabled: enabled ?? true,
          channel: channel || 'EMAIL',
          leadTimeMinutes: leadTimeMinutes ?? 30,
          targetEmails: targetEmails || [],
          targetPhones: targetPhones || [],
          includeFacts: includeFacts ?? true,
          includeFinancials: includeFinancials ?? false,
          updatedAt: new Date()
        }
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /tma/briefings/preferences] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
