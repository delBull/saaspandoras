import { NextRequest } from 'next/server';
import { GET as handlerGET } from '@/app/api/nexus/broadcasts/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return handlerGET(req);
}
