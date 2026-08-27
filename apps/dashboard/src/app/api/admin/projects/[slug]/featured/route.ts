import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '~/db';
import { eq } from 'drizzle-orm';
import { projects } from '~/db/schema';
import { validateAdminSession } from '~/lib/admin-auth';

interface FeaturedUpdateRequest {
  featured?: boolean;
  featuredButtonText?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const auth = await validateAdminSession(request.headers);
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    console.log('🔧 Featured API: Starting PATCH request');
    const { slug } = await params;
    console.log('🔧 Featured API: Project slug:', slug);

    // Try to parse slug as ID first (for numeric slugs) or use directly
    const projectId = parseInt(slug);

    const body = await request.json() as FeaturedUpdateRequest;
    console.log('🔧 Featured API: Request body:', body);
    const { featured, featuredButtonText } = body;

    const updateData: { featured?: boolean; featuredButtonText?: string } = {};
    if (typeof featured === 'boolean') {
      updateData.featured = featured;
      console.log('🔧 Featured API: Setting featured to:', featured);
    }
    if (featuredButtonText !== undefined) {
      updateData.featuredButtonText = featuredButtonText;
      console.log('🔧 Featured API: Setting featuredButtonText to:', featuredButtonText);
    }

    console.log('🔧 Featured API: Update data:', updateData);

    const updatedProject = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    console.log('🔧 Featured API: Update result:', updatedProject);

    if (updatedProject.length === 0) {
      console.log('🔧 Featured API: Project not found');
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log('🔧 Featured API: Project updated successfully');
    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error('🔧 Featured API: Error updating featured status:', error);
    console.error('🔧 Featured API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: 'Failed to update featured status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}