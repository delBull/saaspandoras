import { NextResponse } from 'next/server';
import { sql } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_project_email_idx ON public.marketing_leads USING btree (project_id, email);`;
    return NextResponse.json({ success: true, message: 'Index created successfully on the Vercel connected database!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
