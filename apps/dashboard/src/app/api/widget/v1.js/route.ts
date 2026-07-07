import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const dynamic = 'force-dynamic';

/**
 * GET /api/widget/v1.js
 * 
 * Secure bridge to the physical widget script.
 * Mimics the advertised path in documentation and provides correct MIME types.
 */
export async function GET() {
  try {
    // Use process.cwd() to reliably find the public directory in Next.js
    const publicDir = path.join(process.cwd(), 'public');
    const absolutePath = path.join(publicDir, 'scripts', 'growth-widget.v1.js');
    
    // SECURITY: Ensure path is within public/ directory (prevent path traversal)
    if (!absolutePath.startsWith(publicDir + path.sep) && absolutePath !== publicDir) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(absolutePath)) {
      return new NextResponse('Widget Script Not Found', { status: 404 });
    }

    const scriptContent = fs.readFileSync(absolutePath, 'utf8');

    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
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
