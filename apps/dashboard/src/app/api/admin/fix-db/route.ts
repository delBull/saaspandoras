import { NextResponse } from 'next/server';
import { sql } from '@saasfly/db-core';
import { validateAdminSession } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 🛡️ Autorización propia: el middleware sólo verifica que exista *una* cookie,
  // no que la sesión sea válida. Esta ruta ejecuta DDL sobre la base real.
  const { errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS marketing_leads_project_email_idx ON public.marketing_leads USING btree (project_id, email);`;
    return NextResponse.json({ success: true, message: 'Index created successfully on the Vercel connected database!' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
