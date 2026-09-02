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
    const { cookies, headers } = await import('next/headers');
    const cookieStore = await cookies();
    const reqHeaders = await headers();

    const headersToSend: Record<string, string> = {};
    const cookieParts: string[] = [];

    const sessionCookie = cookieStore.get('pandoras_portal_session')?.value;
    if (sessionCookie) cookieParts.push(`pandoras_portal_session=${sessionCookie}`);

    const walletCookie = cookieStore.get('wallet-address')?.value || cookieStore.get('thirdweb:wallet-address')?.value;
    if (walletCookie) {
      cookieParts.push(`wallet-address=${walletCookie}`);
      headersToSend['x-wallet-address'] = walletCookie;
    }

    const clientWallet = reqHeaders.get('x-wallet-address') || reqHeaders.get('x-thirdweb-address');
    if (clientWallet) {
      headersToSend['x-wallet-address'] = clientWallet;
    }

    if (cookieParts.length > 0) {
      headersToSend['cookie'] = cookieParts.join('; ');
    }

    return headersToSend;
  } catch {
    // Ignored in client components or test contexts
  }
  return {};
}
