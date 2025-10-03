/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { sql } from "drizzle-orm";
import { ensureUser } from "@/lib/user";

export const runtime = "nodejs";

export async function GET() {
  let walletAddress: string | undefined;
  let authMethod: 'header' | 'session' | 'none' = 'none';

  try {
    const requestHeaders = await headers();

    // 🔍 DEBUG: LOG ALL HEADERS (ONLY FOR DEBUGGING - REMOVE IN PRODUCTION)
    console.log("🏷️ [Profile API] All request headers:");
    requestHeaders.forEach((value, key) => {
      console.log(`Header: ${key} = ${value}`);
    });

    // 🔍 First try to get wallet from header (same as admin API)
    const headerWallet = requestHeaders.get('x-thirdweb-address');
    console.log("🔍 [Profile API] x-thirdweb-address header value:", headerWallet);

    if (headerWallet) {
      walletAddress = headerWallet.toLowerCase().trim(); // Ensure lowercase and trim
      authMethod = 'header';
      console.log("✅ [Profile API] AUTH METHOD - HEADER:", walletAddress);
    } else {
      console.log("❌ [Profile API] NO 'x-thirdweb-address' header found");

      // Fallback to session auth (if no header provided)
      console.log("🔄 [Profile API] Falling back to session auth...");
      const { session } = await getAuth(requestHeaders);
      walletAddress = session?.userId ?? undefined;
      authMethod = 'session';

      console.log("🔄 [Profile API] AUTH METHOD - SESSION:", {
        userId: session?.userId,
        hasAuth: !!session?.userId
      });

      if (!walletAddress) {
        console.error("❌ [Profile API] NO AUTH METHOD WORKED - Returning 401");
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

    console.log("🎯 [Profile API] AUTHORIZED REQUEST - METHOD:", authMethod, "WALLET:", walletAddress);

    // Ensure user exists
    await ensureUser(walletAddress);

    // Get user data directly from User table
    const [user] = await db.execute(sql`
      SELECT "id", "name", "email", "image", "walletAddress",
             "connectionCount", "lastConnectionAt", "createdAt",
             "kycLevel", "kycCompleted", "kycData"
      FROM "User"
      WHERE LOWER("walletAddress") = LOWER(${walletAddress})
    `);

    console.log("✅ [Profile API] User data retrieved:", {
      id: user?.id,
      name: user?.name,
      email: user?.email,
      kycLevel: user?.kycLevel,
      kycCompleted: user?.kycCompleted,
      authMethod
    });

    // Get user projects
    const projects = await db.execute(sql`
      SELECT * FROM "projects"
      WHERE LOWER("applicant_wallet_address") = LOWER(${walletAddress})
      ORDER BY "created_at" DESC
    `);

    console.log("✅ [Profile API] User projects count:", projects?.length);

    // Calculate user role
    const [adminCheck] = await db.execute(sql`
      SELECT COUNT(*) as count FROM "administrators"
      WHERE LOWER("wallet_address") = LOWER(${walletAddress})
    `);
    const isAdmin = Number((adminCheck as any).count) > 0;
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
      const [totalProjects] = await db.execute(sql`SELECT COUNT(*) as count FROM "projects"`);
      systemProjectsManaged = Number((totalProjects as any).count) || 0;
    }

    console.log("🎉 [Profile API] SUCCESS RESPONSE - authMethod:", authMethod);

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
    const { session } = await getAuth(await headers());
    if (!session?.userId) {
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
    if (walletAddress !== session.userId.toLowerCase()) {
      return NextResponse.json({ message: "Wallet mismatch" }, { status: 403 });
    }

    console.log("🚀 [Profile API] POST - Updating profile for:", walletAddress);

    // Ensure user exists
    await ensureUser(walletAddress);

    const { profileData } = body;

    // Build unified update query
    const updateQuery = sql`
      UPDATE "User"
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

    console.log("💾 [Profile API] Executing unified update");

    await db.execute(updateQuery);

    console.log("✅ [Profile API] Profile updated successfully:", {
      wallet: walletAddress,
      name: profileData.name,
      email: profileData.email,
      kycCompleted: profileData.kycCompleted,
    });

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      updated: profileData,
    });
  } catch (error) {
    console.error("💥 Error en POST /api/profile:", error);
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 });
  }
}
