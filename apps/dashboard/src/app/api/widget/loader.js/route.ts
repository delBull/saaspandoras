import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const dynamic = 'force-dynamic';

/**
 * GET /api/widget/loader.js
 * 
 * Compatibility route for Narai and legacy guides.
 * Points to the same physical engine as v1.js.
 */
export async function GET() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const widgetPath = path.join(__dirname, '..', '..', '..', 'public', 'scripts', 'growth-widget.v1.js');
    const absolutePath = path.resolve(widgetPath);
    
    // SECURITY: Ensure path is within public/ directory (prevent path traversal)
    const publicDir = path.resolve('public');
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
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Widget Loader Bridge Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
