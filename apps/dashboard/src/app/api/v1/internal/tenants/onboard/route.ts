import { NextResponse } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/v1/internal/tenants/onboard
 * 
 * B0/B1: Creates a new tenant organization and sets its initial Identity and Policy packs.
 * This is the API endpoint representing the first step of Zero-Code Customer Onboarding.
 */
export async function POST(req: Request) {
  try {
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
      description: `Auto-provisioned tenant for ${name}`,
      status: 'draft',
      identityPack: identity || {},
      policyPack: policies || {},
      tenantRuntimeConfig: runtimeConfig || {}
    }).returning();

    return NextResponse.json({ 
      success: true, 
      tenant: newTenant[0],
      message: "Tenant onboarded successfully. B0 & B1 completed."
    });
  } catch (error: any) {
    console.error('[TenantOnboard] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
