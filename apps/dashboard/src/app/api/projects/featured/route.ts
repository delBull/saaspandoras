import { NextResponse } from 'next/server';
import { db } from '~/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const featuredProjects = await db.execute(sql`
      SELECT id, title, description, slug, status, created_at, cover_photo_url, target_amount,
             applicant_wallet_address, applicant_name, applicant_email, business_category, image_url, logo_url
      FROM projects
      WHERE featured = true
      ORDER BY created_at DESC
      LIMIT 10
    `);

    return NextResponse.json(featuredProjects);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured projects' },
      { status: 500 }
    );
  }
}