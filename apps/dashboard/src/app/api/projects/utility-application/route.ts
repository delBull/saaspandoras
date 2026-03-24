import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { withRetry } from '@/lib/database';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      console.log('📥 Received utility application request');
    }

    const body = await request.json();
    if (!isProd) {
      console.log('📦 Request body keys:', Object.keys(body));
    }

    // Validar campos requeridos
    if (!body.title || !body.description || !body.businessCategory) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { message: 'Faltan campos requeridos: title, description, businessCategory' },
        { status: 400 }
      );
    }

    // 1. Generar slug base y fallback
    const baseSlug = body.title
      ?.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim() || `project-${Date.now().toString().slice(-6)}`;

    const safeNumber = (val: any) => {
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    // 2. Preparar datos para inserción (Sanitización de tipos)
    const projectData = {
      title: body.title,
      slug: baseSlug, 
      description: body.description,
      businessCategory: body.businessCategory,
      tagline: body.tagline || null,
      logoUrl: body.logoUrl || null,
      coverPhotoUrl: body.coverPhotoUrl || null,
      videoPitch: body.videoPitch || null,
      website: body.website || null,
      whitepaperUrl: body.whitepaperUrl || null,
      twitterUrl: body.twitterUrl || null,
      discordUrl: body.discordUrl || null,
      telegramUrl: body.telegramUrl || null,
      linkedinUrl: body.linkedinUrl || null,
      targetAmount: body.targetAmount?.toString() || "0.00",
      totalValuationUsd: body.totalValuationUsd?.toString() || null,
      tokenType: body.tokenType || null,
      totalTokens: safeNumber(body.totalTokens),
      tokensOffered: safeNumber(body.tokensOffered),
      tokenPriceUsd: body.tokenPriceUsd?.toString() || null,
      estimatedApy: body.estimatedApy || null,
      yieldSource: body.yieldSource || null,
      fundUsage: body.fundUsage || null,
      lockupPeriod: body.lockupPeriod || null,
      teamMembers: body.teamMembers || null,
      advisors: body.advisors || null,
      tokenDistribution: body.tokenDistribution || null,
      treasuryAddress: body.treasuryAddress || null,
      legalStatus: body.legalStatus || null,
      fiduciaryEntity: body.fiduciaryEntity || null,
      valuationDocumentUrl: body.valuationDocumentUrl || null,
      dueDiligenceReportUrl: body.dueDiligenceReportUrl || null,
      // Sanitización explícitamente booleana
      stakingRewardsEnabled: body.stakingRewardsEnabled === true || body.stakingRewardsEnabled === 'true',
      revenueSharingEnabled: body.revenueSharingEnabled === true || body.revenueSharingEnabled === 'true',
      workToEarnEnabled: body.workToEarnEnabled === true || body.workToEarnEnabled === 'true',
      tieredAccessEnabled: body.tieredAccessEnabled === true || body.tieredAccessEnabled === 'true',
      discountedFeesEnabled: body.discountedFeesEnabled === true || body.discountedFeesEnabled === 'true',
      isMintable: body.isMintable === true || body.isMintable === 'true',
      isMutable: body.isMutable === true || body.isMutable === 'true',
      legalEntityHelp: body.legalEntityHelp === true || body.legalEntityHelp === 'true',
      updateAuthorityAddress: body.updateAuthorityAddress || null,
      applicantName: body.applicantName || null,
      applicantPosition: body.applicantPosition || null,
      applicantEmail: body.applicantEmail || null,
      applicantPhone: body.applicantPhone || null,
      applicantWalletAddress: body.applicantWalletAddress || null,
      verificationAgreement: body.verificationAgreement === true || body.verificationAgreement === 'true',
      protoclMecanism: body.protoclMecanism || null,
      artefactUtility: body.artefactUtility || null,
      worktoearnMecanism: body.worktoearnMecanism || null,
      monetizationModel: body.monetizationModel || null,
      adquireStrategy: body.adquireStrategy || null,
      mitigationPlan: body.mitigationPlan || null,
      status: body.status || 'draft',
      featured: body.featured === true || body.featured === 'true',
    };

    /**
     * 3. SOFT IDEMPOTENCY CHECK
     * Evita duplicados si el cliente reintenta tras un 504 (timeout).
     */
    if (body.applicantEmail) {
      const existing = await withRetry(() => 
        db.select()
          .from(projects)
          .where(eq(projects.applicantEmail, body.applicantEmail))
          .limit(1)
      );
      if (existing.length > 0 && existing[0]) {
        const proj = existing[0];
        if (!isProd) console.log('🔄 Idempotency hit: Project already exists for', body.applicantEmail);
        return NextResponse.json({
          message: 'Proyecto ya registrado con este email',
          project: proj,
          id: proj.id
        });
      }
    }

    /**
     * 4. ATOMIC INSERT WITH WAR-LEVEL SLUG COLLISION HANDLING
     * Triple retry inmutable con entropía criptográfica.
     */
    async function insertProjectAtomic(data: typeof projectData) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const [inserted] = await db.insert(projects).values(data).returning();
          return inserted;
        } catch (err: any) {
          // Postgres 23505: unique_violation (Blindly assume slug if constraint unknown)
          if (err.code === '23505') {
            if (!isProd) console.warn(`⚠️ Slug collision (attempt ${attempt + 1}), retrying...`);
            data = { 
              ...data, 
              slug: `${baseSlug}-${crypto.randomUUID().slice(0, 6)}` 
            };
            continue; 
          }
          throw err;
        }
      }
      throw new Error('SLUG_GENERATION_FAILED');
    }

    /**
     * 5. EXECUTION WITH RETRY & AGGRESSIVE TIMEOUT (6s)
     */
    const newProject = await Promise.race([
      withRetry(() => insertProjectAtomic(projectData)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_LIMIT_REACHED')), 6000))
    ]) as any;

    if (!newProject) {
      throw new Error('Failed to create project record');
    }

    if (!isProd) console.log('✅ Project created successfully:', newProject.id);

    // 6. GAMIFICATION: FIRE & FORGET (NON-BLOCKING)
    if (body.applicantWalletAddress) {
      import('@/lib/gamification/service').then(({ trackGamificationEvent }) => {
        trackGamificationEvent(
          body.applicantWalletAddress,
          'project_application_submitted',
          {
            projectId: newProject.id.toString(),
            projectTitle: body.title,
            isPublicApplication: true,
            submissionType: 'utility_form_api'
          }
        ).catch(gErr => console.warn('⚠️ Gamification Fire&Forget failed:', gErr.message));
      }).catch(impErr => console.warn('⚠️ Failed to import gamification service:', impErr));
    }

    return NextResponse.json({
      message: 'Proyecto creado exitosamente',
      project: newProject,
      id: newProject.id
    });

  } catch (error: any) {
    const isTimeout = error.message === 'TIMEOUT_LIMIT_REACHED';
    console.error(`💥 ${isTimeout ? 'TIMEOUT' : 'CRASH'} creating utility application:`, error.message);
    
    return NextResponse.json(
      { message: isTimeout ? 'La solicitud tardó demasiado, por favor intenta de nuevo.' : 'Error interno del servidor' },
      { status: isTimeout ? 504 : 500 }
    );
  }

}

export function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
