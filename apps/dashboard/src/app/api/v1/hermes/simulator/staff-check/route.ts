import { NextResponse } from 'next/server';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';

const INTERNAL_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']);

/**
 * GET /api/v1/hermes/simulator/staff-check
 *
 * Lightweight server-side gate for the Hermes Sales Simulator Demo Builder drawer.
 * Returns { isInternalStaff: boolean } based on the real Nexus RBAC role.
 *
 * Rules:
 * - SUPER_ADMIN, ADMIN, OPERATOR → isInternalStaff: true
 * - Any other authenticated role, unauthenticated, or public visitor → isInternalStaff: false
 * - This endpoint NEVER grants privileges; it is read-only presentation logic.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const auth = await getNexusAuthContext().catch(() => null);

    const isInternalStaff =
      auth?.isAuthenticated === true &&
      auth.role != null &&
      INTERNAL_ROLES.has(auth.role);

    return NextResponse.json(
      { isInternalStaff },
      {
        status: 200,
        headers: {
          // Never cache — role can change between requests
          'Cache-Control': 'no-store, private',
        },
      }
    );
  } catch {
    // Fail-open to false: if anything goes wrong, do NOT show internal controls.
    return NextResponse.json({ isInternalStaff: false }, { status: 200 });
  }
}
