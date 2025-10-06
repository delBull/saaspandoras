import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '~/db';
import { eq } from 'drizzle-orm';
import { projects } from '~/db/schema';

interface FeaturedUpdateRequest {
  featured?: boolean;
  featuredButtonText?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as FeaturedUpdateRequest;
    const { featured, featuredButtonText } = body;

    const updateData: { featured?: boolean; featuredButtonText?: string } = {};
    if (typeof featured === 'boolean') {
      updateData.featured = featured;
    }
    if (featuredButtonText !== undefined) {
      updateData.featuredButtonText = featuredButtonText;
    }

    const updatedProject = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, parseInt(id)))
      .returning();

    if (updatedProject.length === 0) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error('Error updating featured status:', error);
    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    );
  }
}