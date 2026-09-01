/**
 * 🌐 Thin API Route: Tenant Project Summary Boundary
 * apps/dashboard/src/app/api/v1/control-plane/tenant-project/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/lib/domain/project-repository';
import { getAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'SLUG_REQUIRED' }, { status: 400 });
    }

    const project = await ProjectRepository.findBySlug(slug);
    if (!project) {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    console.error('[TenantProjectAPI] Error:', err);
    return NextResponse.json({ error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
