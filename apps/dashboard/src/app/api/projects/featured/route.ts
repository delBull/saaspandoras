import { NextResponse } from 'next/server';
import { db } from '~/db';
import { eq } from 'drizzle-orm';
import { projects } from '~/db/schema';

export async function GET() {
  try {
    const featuredProjects = await db.query.projects.findMany({
      where: eq(projects.featured, true),
      orderBy: (projects, { desc }) => [desc(projects.createdAt)],
      limit: 10,
    });

    return NextResponse.json(featuredProjects);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured projects' },
      { status: 500 }
    );
  }
}