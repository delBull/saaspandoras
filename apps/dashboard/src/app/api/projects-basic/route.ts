import { NextResponse } from "next/server";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const revalidate = 600; // Cache for 10 minutes

// Type for database query result
interface ProjectQueryResult {
  id: number | string;
  title: string;
  description: string;
  status: string;
  slug: string;
  createdAt: string | Date;
  businessCategory?: string;
  coverPhotoUrl?: string | null;
  targetAmount?: string | number | null;

  raisedAmount?: string | number | null;
  contractAddress?: string | null;
  utilityContractAddress?: string | null;
  governorContractAddress?: string | null;
  w2eConfig?: any;
}

// Type for formatted project response
interface FormattedProject {
  id: number;
  title: string;
  description: string;
  slug: string;
  status: string;
  businessCategory: string;
  createdAt: string | Date;
  coverPhotoUrl: string;
  targetAmount: string | null;
  raisedAmount: string;
  contractAddress?: string;
  utilityContractAddress?: string;
  governorContractAddress?: string;
  w2eConfig?: any;
}

export async function GET() {
  try {
    console.log('🔍 Basic API: Loading REAL projects from database...');

    // First, try to get real projects from database
    try {
      console.log('🔍 Basic API: Executing optimized database query...');
      const realProjects = await db.execute(sql`
        SELECT
          "id",
          "title",
          "description",
          "status",
          "slug",
          "created_at" as "createdAt",
          "cover_photo_url" as "coverPhotoUrl",
          "target_amount" as "targetAmount",
          "raised_amount" as "raisedAmount",
          "business_category" as "businessCategory",
          "contract_address" as "contractAddress",
          "utility_contract_address" as "utilityContractAddress",
          "governor_contract_address" as "governorContractAddress",
          "w2e_config" as "w2eConfig"
        FROM "projects"
        ORDER BY "created_at" DESC
      `);

      const projects = realProjects as unknown as ProjectQueryResult[];
      console.log(`✅ Basic API: Found ${projects.length} real projects in database`);
      console.log('🔍 Basic API: Real project IDs and titles:', projects.map(p => ({ id: p.id, title: p.title, slug: p.slug })));

      if (projects.length > 0) {
        const formattedProjects: FormattedProject[] = projects.map((project: ProjectQueryResult): FormattedProject => ({
          id: Number(project.id),
          title: project.title,
          description: project.description,
          slug: project.slug,
          status: project.status,
          businessCategory: project.businessCategory ?? 'other',
          createdAt: project.createdAt,
          coverPhotoUrl: project.coverPhotoUrl ?? '/images/default-project.jpg',
          targetAmount: project.targetAmount ? String(project.targetAmount) : null,
          raisedAmount: project.raisedAmount ? String(project.raisedAmount) : '0',
          contractAddress: project.contractAddress ? String(project.contractAddress) : undefined,
          utilityContractAddress: project.utilityContractAddress ? String(project.utilityContractAddress) : undefined,
          governorContractAddress: project.governorContractAddress ? String(project.governorContractAddress) : undefined,
          w2eConfig: project.w2eConfig ?? {}
        }));

        console.log('📊 Basic API: Returning real projects from database');
        console.log('📊 Available slugs:', formattedProjects.map(p => p.slug));
        return NextResponse.json(formattedProjects);
      }

    } catch (dbError) {
      console.error('❌ Basic API: Database query failed, falling back to hardcoded data:', dbError);
      console.error('❌ Basic API: Error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : 'No stack trace'
      });
    }

    // Fallback to hardcoded data (like before) but as backup
    console.log('📊 Basic API: No real projects found, using template data for testing');

    const fallbackProjects = [
      {
        id: Math.floor(Math.random() * 10000) + 1000, // Random ID to avoid conflicts
        title: 'Verifica tus protocolos en admin',
        description: 'Para ver tus protocolos reales, dirígete a admin dashboard y verifica que estén publicados.',
        slug: 'verificacion-admin-' + Date.now(),
        status: 'draft', // Mark as draft so they understand they're not real
        businessCategory: 'other',
        createdAt: new Date().toISOString(),
        coverPhotoUrl: '/images/default-project.jpg',
        targetAmount: '0',
        raisedAmount: '0'
      }
    ];

    return NextResponse.json(fallbackProjects);
  } catch (error) {
    console.error("💥 Basic API: Critical error:", error);

    // Check if it's a quota issue - More comprehensive check
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('limit') ||
      error.message.includes('exceeded') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many') ||
      error.message.includes('connection pool') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json({
        message: "Database quota exceeded",
        error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
        quotaExceeded: true
      }, { status: 503 }); // Service Unavailable
    }

    return NextResponse.json(
      { message: "Error interno del servidor", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
