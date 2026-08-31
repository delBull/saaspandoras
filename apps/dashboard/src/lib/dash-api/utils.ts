/**
 * 🔌 Dash API Utilities
 * src/lib/dash-api/utils.ts
 *
 * Helper to resolve absolute origin and forward session headers in Server Components / Actions.
 */

export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') return '';
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT || 3000}`;
}

export async function getServerAuthHeaders(): Promise<Record<string, string>> {
  if (typeof window !== 'undefined') return {};
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('pandoras_portal_session')?.value;
    if (sessionCookie) {
      return { cookie: `pandoras_portal_session=${sessionCookie}` };
    }
  } catch {
    // Ignored in client components or test contexts
  }
  return {};
}
