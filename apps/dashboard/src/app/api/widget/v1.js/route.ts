import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * GET /api/widget/v1.js
 * 
 * Secure bridge to the physical widget script.
 * Mimics the advertised path in documentation and provides correct MIME types.
 */
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'scripts', 'growth-widget.v1.js');
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse('Widget Script Not Found', { status: 404 });
    }

    const scriptContent = fs.readFileSync(filePath, 'utf8');

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Widget Loader Bridge Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Support for /api/widget/loader.js (Legacy/Narai compatibility)
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
