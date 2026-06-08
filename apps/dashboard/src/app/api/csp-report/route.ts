import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const report = await request.json();
    const blocked = report?.['csp-report'] || report;

    console.warn('[CSP Report-Only] Violation:', JSON.stringify({
      documentUri: blocked['document-uri'],
      blockedUri: blocked['blocked-uri'],
      violatedDirective: blocked['violated-directive'],
      originalPolicy: blocked['original-policy']?.slice(0, 80),
      sourceFile: blocked['source-file'],
      lineNumber: blocked['line-number'],
    }));
  } catch (err) {
    // Ignore malformed reports
  }

  return new NextResponse(null, { status: 204 });
}
