import { NextResponse } from 'next/server';
import { IntegrationKeyService } from '@/lib/integrations/auth';
import { db } from '@/db';
import { projects } from '@saasfly/db/schema';
import { eq } from '@saasfly/db-core';

export async function POST(req: Request) {
  try {
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
    if (!permissions.includes('tenant.provision')) {
      return NextResponse.json({ error: 'Missing required permission: tenant.provision' }, { status: 403 });
    }

    const body = await req.json();
    const { name, slug, identity, policies, runtimeConfig } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
    }

    // Check if tenant already exists
    const existing = await db.query.projects.findFirst({
      where: eq(projects.slug, slug)
    });

    if (existing) {
      return NextResponse.json({ error: 'Tenant slug already exists' }, { status: 409 });
    }

    // Insert new tenant
    const newTenant = await db.insert(projects).values({
      title: name,
      slug: slug,
      description: `Auto-provisioned tenant via Integration API`,
      status: 'draft',
      identityPack: identity || {},
      policyPack: policies || {},
      tenantRuntimeConfig: runtimeConfig || {},
      isSimulationMode: true // By default, new tenants start in simulation mode
    }).returning();

    return NextResponse.json({ 
      success: true, 
      tenant: newTenant[0],
      message: "Tenant provisioned successfully via API."
    });
  } catch (error: any) {
    console.error('[TenantProvisionAPI] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
