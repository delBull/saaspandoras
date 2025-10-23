import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import postgres from "postgres";
import { ensureUser } from "@/lib/user";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(connectionString);

// Test database connection at startup

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 300; // Cache for 5 minutes

// Force this route to be dynamic to avoid static generation issues with cookies
// Add rate limiting for production
export async function GET(request: Request) {
  // Simple rate limiting check (basic implementation)
  const clientIP = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown';
  const _rateLimitKey = `profile-requests-${clientIP}`;

  // In production, you might want to use Redis or similar for proper rate limiting
  // For now, we'll just log excessive requests
  console.log(`Profile API request from ${clientIP} at ${new Date().toISOString()}`);
  let walletAddress: string | undefined;
  let authMethod: 'header' | 'body' | 'session' | 'none' = 'none';

  try {
    const requestHeaders = await headers();

    // First try to get wallet from header (same as admin API)
    // Try multiple header names in case Vercel filters some
    const headerWallet = requestHeaders.get('x-thirdweb-address') ??
                        requestHeaders.get('x-wallet-address') ??
                        requestHeaders.get('x-user-address');

    if (headerWallet) {
      walletAddress = headerWallet.toLowerCase().trim(); // Ensure lowercase and trim
      authMethod = 'header';
    } else {
      // Fallback to session auth (if no header provided)
      const { session } = await getAuth(requestHeaders);
      walletAddress = session?.userId ?? undefined;
      authMethod = 'session';

      if (!walletAddress) {
        return NextResponse.json({
          message: "No autorizado - No se encontró wallet ni sesión válida",
          authMethod,
          walletAddress: null,
          noWallet: true,
          noSession: true
        }, { status: 401 });
      }
    }

    // Validate wallet format
    if (!walletAddress.startsWith('0x') || walletAddress.length !== 42) {
      console.error("❌ [Profile API] INVALID WALLET FORMAT:", walletAddress);
      return NextResponse.json({
        message: "Wallet address inválido",
        walletAddress,
        authMethod
      }, { status: 401 });
    }

    // Ensure user exists
    await ensureUser(walletAddress);

    // Get user data directly from users table - optimized query
    const tableName = process.env.NODE_ENV === 'production' ? 'User' : 'users';
    const users = await sql`
      SELECT "id", "name", "email", "image", "walletAddress",
              "connectionCount", "lastConnectionAt", "createdAt",
              "kycLevel", "kycCompleted", "kycData"
      FROM "${sql.unsafe(tableName)}"
      WHERE LOWER("walletAddress") = LOWER(${walletAddress})
    `;
    const user = users[0];

    // Get user projects - Get ALL projects for the user, not just 3
    const projects = await sql`
      SELECT id, title, description, status, created_at, business_category, logo_url, cover_photo_url, applicant_wallet_address, target_amount, raised_amount, slug, applicant_name, applicant_email, applicant_phone
      FROM "projects"
      WHERE LOWER("applicant_wallet_address") = LOWER(${walletAddress})
      ORDER BY "created_at" DESC
    `;


    // Calculate user role
    const adminResults = await sql`
      SELECT COUNT(*) as count FROM "administrators"
      WHERE LOWER("wallet_address") = LOWER(${walletAddress})
    `;
    const isAdmin = Number(adminResults[0]?.count || 0) > 0;
    const isSuperAdmin = walletAddress.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    let role: "admin" | "applicant" | "pandorian";
    if (isAdmin || isSuperAdmin) {
      role = "admin";
    } else if (projects?.length > 0) {
      role = "applicant";
    } else {
      role = "pandorian";
    }

    let systemProjectsManaged: number | undefined;
    if (isAdmin || isSuperAdmin) {
      const totalProjectsResults = await sql`SELECT COUNT(*) as count FROM "projects"`;
      systemProjectsManaged = Number(totalProjectsResults[0]?.count || 0);
    }


    return NextResponse.json({
      ...user,
      projects,
      projectCount: projects?.length,
      role,
      systemProjectsManaged,
      hasPandorasKey: true,
    });
  } catch (error) {
    console.error("💥 [Profile API] CRITICAL ERROR:", {
      authMethod,
      walletAddress,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : "No message",
      errorStack: error instanceof Error ? error.stack : "No stack"
    });

    // Check if it's a quota issue - More comprehensive check
    if (error instanceof Error && (
      error.message.includes('quota') ||
      error.message.includes('limit') ||
      error.message.includes('exceeded') ||
      error.message.includes('rate limit') ||
      error.message.includes('too many') ||
      error.message.includes('connection pool') ||
      error.message.includes('timeout')
    )) {
      return NextResponse.json({
        message: "Database quota exceeded",
        error: "Your database plan has reached its data transfer limit. Please upgrade your plan or contact support.",
        quotaExceeded: true,
        walletAddress,
        authMethod
      }, { status: 503 }); // Service Unavailable
    }

    return NextResponse.json({
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Unknown error",
      walletAddress,
      authMethod
    }, { status: 500 });
  }
}

/**
 * POST: Unified endpoint for KYC completion + profile editing
 */
export async function POST(request: Request) {
  try {
    const requestHeaders = await headers();

    // Try multiple header names in case Vercel filters some
    const headerWallet = requestHeaders.get('x-thirdweb-address') ??
                        requestHeaders.get('x-wallet-address') ??
                        requestHeaders.get('x-user-address');

    const { session } = await getAuth(requestHeaders);
    if (!session?.userId && !headerWallet) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const body = await request.json() as {
      walletAddress: string;
      profileData: {
        name?: string;
        email?: string;
        image?: string;
        kycLevel?: "basic" | "advanced" | "N/A";
        kycCompleted?: boolean;
        fullName?: string;
        phoneNumber?: string;
        dateOfBirth?: string;
        occupation?: string;
        taxId?: string;
        nationality?: string;
        address?: {
          street?: string;
          city?: string;
          state?: string;
          country?: string;
          postalCode?: string;
        };
      };
    };

    const walletAddress = body.walletAddress.toLowerCase();
    if (session.userId && walletAddress !== session.userId.toLowerCase()) {
      return NextResponse.json({ message: "Wallet mismatch" }, { status: 403 });
    }

    // Ensure user exists
    await ensureUser(walletAddress);

    const { profileData } = body;

    // Build unified update query
    const tableName = process.env.NODE_ENV === 'production' ? 'User' : 'users';
    await sql`
      UPDATE "${sql.unsafe(tableName)}"
      SET "name" = ${profileData.name ?? null},
          "email" = ${profileData.email ?? null},
          "image" = ${profileData.image ?? null},
          "kycLevel" = ${profileData.kycLevel ?? "N/A"},
          "kycCompleted" = ${profileData.kycCompleted ?? false},
          "kycData" = ${JSON.stringify({
            fullName: profileData.fullName ?? null,
            phoneNumber: profileData.phoneNumber ?? null,
            dateOfBirth: profileData.dateOfBirth ?? null,
            occupation: profileData.occupation ?? null,
            taxId: profileData.taxId ?? null,
            nationality: profileData.nationality ?? null,
            address: profileData.address ?? null,
          })}
      WHERE LOWER("walletAddress") = LOWER(${walletAddress})
    `;

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      updated: profileData,
    });
  } catch (error) {
    console.error("💥 Error en POST /api/profile:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
