import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { projects } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received utility application request');

    const body = await request.json();
    console.log('📦 Request body:', body);

    // Validar campos requeridos
    if (!body.title || !body.description || !body.businessCategory) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { message: 'Faltan campos requeridos: title, description, businessCategory' },
        { status: 400 }
      );
    }

    // Generar slug automáticamente
    const baseSlug = body.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and generate unique one (max 100 attempts to avoid infinite loop)
    while (counter < 100) {
      const existingProject = await db.select().from(projects).where(eq(projects.slug, slug)).limit(1);
      if (existingProject.length === 0) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Preparar datos para inserción
    const projectData = {
      title: body.title,
      slug: slug,
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
      targetAmount: body.targetAmount ? body.targetAmount.toString() : "0.00",
      totalValuationUsd: body.totalValuationUsd ? body.totalValuationUsd.toString() : null,
      tokenType: body.tokenType || null,
      totalTokens: body.totalTokens ? parseInt(body.totalTokens) : null,
      tokensOffered: body.tokensOffered ? parseInt(body.tokensOffered) : null,
      tokenPriceUsd: body.tokenPriceUsd ? body.tokenPriceUsd.toString() : null,
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
      isMintable: body.isMintable === 'true' ? true : body.isMintable === 'false' ? false : null,
      isMutable: body.isMutable === 'true' ? true : body.isMutable === 'false' ? false : null,
      updateAuthorityAddress: body.updateAuthorityAddress || null,
      applicantName: body.applicantName || null,
      applicantPosition: body.applicantPosition || null,
      applicantEmail: body.applicantEmail || null,
      applicantPhone: body.applicantPhone || null,
      applicantWalletAddress: body.applicantWalletAddress || null,
      verificationAgreement: body.verificationAgreement === 'true' || body.verificationAgreement === true,
      status: body.status || 'draft',
      featured: body.featured || false,
    };

    console.log('💾 Inserting project data:', projectData);

    // Insertar proyecto en la base de datos
    const result = await db.insert(projects).values(projectData).returning();

    if (!result || result.length === 0) {
      console.error('❌ Failed to insert project');
      return NextResponse.json(
        { message: 'Error al crear el proyecto' },
        { status: 500 }
      );
    }

    const newProject = result[0];
    if (!newProject) {
      console.error('❌ Project insertion returned empty result');
      return NextResponse.json(
        { message: 'Error al crear el proyecto' },
        { status: 500 }
      );
    }

    console.log('✅ Project created successfully:', newProject);

    // 🎮 TRIGGER GAMIFICATION EVENT FOR PROJECT APPLICATION
    try {
      const { trackGamificationEvent } = await import('@/lib/gamification/service');

      if (body.applicantWalletAddress) {
        await trackGamificationEvent(
          body.applicantWalletAddress,
          'project_application_submitted',
          {
            projectId: newProject.id.toString(),
            projectTitle: body.title,
            businessCategory: body.businessCategory,
            targetAmount: body.targetAmount,
            isPublicApplication: true,
            submissionType: 'utility_form_api'
          }
        );
        console.log('✅ Gamification event tracked for project application');
      }
    } catch (gamificationError) {
      console.warn('⚠️ Failed to track gamification event:', gamificationError);
      // Don't fail the project creation if gamification fails
    }

    return NextResponse.json({
      message: 'Proyecto creado exitosamente',
      project: newProject,
      id: newProject.id
    });

  } catch (error) {
    console.error('💥 Error creating utility application:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export function GET() {
  return NextResponse.json(
    { message: 'Method not allowed' },
    { status: 405 }
  );
}
