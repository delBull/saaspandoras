/**
 * 🌐 Thin API Route: Tenant Project Summary Boundary
 * apps/dashboard/src/app/api/v1/control-plane/tenant-project/route.ts
 *
 * Enforces fail-closed authentication, tenant authorization, and returns
 * a strictly sanitized DTO without leaking internal database fields.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ProjectRepository } from '@/lib/domain/project-repository';
import { getAuth, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({ error: 'SLUG_REQUIRED' }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim();

    // 🛡️ SECURITY GUARD 1: Authenticate caller
    const auth = await getAuth(req.headers);
    const sessionWallet = auth.session?.address?.toLowerCase();
    const headerWallet = (
      req.headers.get('x-wallet-address') || req.headers.get('x-thirdweb-address')
    )?.toLowerCase();

    const callerWallet = sessionWallet || (auth.isVerified ? headerWallet : null);

    if (!callerWallet) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED: Authentication is required to access tenant project data.' },
        { status: 401 }
      );
    }

    const project = await ProjectRepository.findBySlug(cleanSlug);
    if (!project) {
      return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 });
    }

    // 🛡️ SECURITY GUARD 2: Authorize caller (Admin or Tenant Owner)
    const isUserAdmin = await isAdmin(callerWallet);
    const isOwner = project.applicantWalletAddress?.toLowerCase() === callerWallet;

    if (!isUserAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'FORBIDDEN_TENANT_ACCESS: You do not have permissions to view this tenant project.' },
        { status: 403 }
      );
    }

    // 🛡️ SECURITY GUARD 3: Return strictly sanitized DTO
    const sanitizedDTO = {
      id: project.id,
      title: project.title,
      slug: project.slug,
      businessCategory: project.businessCategory,
      logoUrl: project.logoUrl,
      coverPhotoUrl: project.coverPhotoUrl,
      status: project.status,
      deploymentStatus: project.deploymentStatus,
      contractAddress: project.contractAddress,
      treasuryAddress: project.treasuryAddress,
      allowanceControllerAddress: project.allowanceControllerAddress,
      governorContractAddress: project.governorContractAddress,
      targetAmount: project.targetAmount,
      totalValuationUsd: project.totalValuationUsd,
      createdAt: project.createdAt,
    };

    return NextResponse.json(sanitizedDTO);
  } catch (err: any) {
    console.error('[TenantProjectAPI] Error:', err);
    return NextResponse.json({ error: err?.message || 'INTERNAL_ERROR' }, { status: 500 });
  }
}
