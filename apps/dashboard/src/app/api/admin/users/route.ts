/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "~/db";
import { sql } from "drizzle-orm";
import { headers } from "next/headers";
import type { UserData, UserRole } from "@/types/admin";

// 🔐 Helper function for routes that require authenticated user
async function requireAuthenticatedUser(session: any): Promise<{ error: NextResponse | null; userId: string | null }> {
  if (!session?.userId) {
    console.error('🔐 AUTH ERROR: No userId in session', {
      timestamp: new Date().toISOString(),
      session: JSON.stringify(session),
      headers: await headers() // Log headers for debugging
    });
    return {
      error: NextResponse.json({ message: "No autorizado - Sesión inválida" }, { status: 401 }),
      userId: null
    };
  }

  return { error: null, userId: session.userId };
}

export async function GET() {
  try {
    const { session } = await getAuth(await headers());

    // 🔒 Validación defensiva usando el helper
    const { error: authError, userId } = await requireAuthenticatedUser(session);
    if (authError) return authError;

    const userIsAdmin = await isAdmin(userId);

    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // First, try a simple query to check if table exists and has data
    const simpleUserQuery = await db.execute(sql`SELECT COUNT(*) as total FROM "User"`);
    console.log("Simple user count:", simpleUserQuery);
    const totalUsers = simpleUserQuery[0]?.total as string;
    console.log("Total users:", totalUsers);

    // For testing, if no users exist, create a sample user to verify the system works
    if (totalUsers === '0') {
      console.log("No users found in database - creating sample user for testing");

      // Insert a sample user
      await db.execute(sql`
        INSERT INTO "User" ("id", "name", "email", "image", "walletAddress", "hasPandorasKey", "connectionCount", "lastConnectionAt", "createdAt")
        VALUES (
          'sample-user-uuid',
          'Usuario de Ejemplo',
          'sample@example.com',
          '/images/avatars/rasta.png',
          '0x1234567890123456789012345678901234567890',
          true,
          1,
          NOW(),
          NOW()
        )
      `);

      console.log("Sample user created successfully");
    }

    // Get all users with their project counts and roles
    console.log("Executing simplified user query");

    // SUPER ADMIN WALLET TO HIDE FROM USER MANAGEMENT
    const SUPER_ADMIN_WALLET = '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    // 🔢 Get users with project counts in a single query
    const usersWithProjects = await db.execute(sql`
      SELECT
        u."id",
        u."name",
        u."email",
        u."image",
        u."walletAddress",
        u."hasPandorasKey",
        u."connectionCount",
        u."lastConnectionAt",
        u."createdAt",
        u."kycLevel",
        u."kycCompleted",
        u."kycData",
        COALESCE(COUNT(p.*), 0) as "projectCount"
      FROM "User" u
      LEFT JOIN "projects" p
        ON LOWER(u."walletAddress") = LOWER(p."applicant_wallet_address")
      WHERE LOWER(u."walletAddress") != LOWER(${SUPER_ADMIN_WALLET})
      GROUP BY
        u."id",
        u."name",
        u."email",
        u."image",
        u."walletAddress",
        u."hasPandorasKey",
        u."connectionCount",
        u."lastConnectionAt",
        u."createdAt",
        u."kycLevel",
        u."kycCompleted",
        u."kycData"
      ORDER BY u."createdAt" DESC
    `);

    console.log("Users with projects query result:", usersWithProjects.length, "users found");

    // Get total projects for super admin calculation
    const totalProjectsQuery = await db.execute(sql`SELECT COUNT(*) as count FROM "projects"`);
    const totalProjectsInDb = Number(totalProjectsQuery[0]?.count as string) || 0;
    console.log("� Total projects in DB:", totalProjectsInDb);

    // Get all admin wallets for role detection (incluyendo super admins hardcodeados)
    const SUPER_ADMIN_WALLETS = [
      '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' // Tú - siempre admin
    ].map(addr => addr.toLowerCase());

    const adminWallets: string[] = [];
    try {
      const adminQuery = await db.execute(sql`
        SELECT "wallet_address" FROM "administrators"
      `);
      adminQuery.forEach((row: any) => {
        adminWallets.push((row.wallet_address as string).toLowerCase());
      });
    } catch (error) {
      console.warn("Could not fetch admin wallets:", error);
    }

    // Combinar super admins con admins de BD
    const ALL_ADMIN_WALLETS = [...SUPER_ADMIN_WALLETS, ...adminWallets];
    console.log('📊 Total admin wallets for role detection:', ALL_ADMIN_WALLETS.length, ALL_ADMIN_WALLETS);

    // Process each user with the collected data
    const usersWithDetails = usersWithProjects.map((user: any) => {
      const userWallet = (user.walletAddress as string).toLowerCase();
      // Check for SUPER admin wallet address directly (case sensitive check)
      const isSuperAdmin = user.walletAddress === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';
      const isAdmin = ALL_ADMIN_WALLETS.includes(userWallet);

      // Get project count directly from SQL JOIN query
      let projectCount = Number(user.projectCount) || 0;
      let systemProjectsManaged: number | undefined;

      // For super admins, don't show personal projects - they only manage the system
      if (isSuperAdmin) {
        projectCount = 0; // No personal projects for super admin
        systemProjectsManaged = totalProjectsInDb; // System management count
        console.log(`   ✅ SUPER ADMIN: 0 personal projects, manages ${systemProjectsManaged} total projects`);
      } else {
        console.log(`   🏦 WALLET RELATION: ${projectCount} projects for wallet ${userWallet}`);
      }

      // Determine role
      let role: 'admin' | 'applicant' | 'pandorian';
      if (isAdmin) {
        role = 'admin';
      } else if (projectCount > 0) {
        role = 'applicant';
      } else {
        role = 'pandorian';
      }

      // Determine Pandora's Key status - for now, give to all users since it's required to access platform
      // TODO: Implement proper Pandora's Key verification system
      const hasPandorasKey = true; // All users get it until proper verification is implemented

      console.log(`🔍 Processing user ${userWallet.substring(0, 8)}... Count=${projectCount}, Role=${role}`);
      console.log(`   Final: Count=${projectCount}, Role=${role}, Key=${hasPandorasKey}${systemProjectsManaged ? `, Manages=${systemProjectsManaged}` : ''}`);

      const result = {
        ...user,
        projectCount,
        systemProjectsManaged,
        role,
        hasPandorasKey
      };

      return result;
    });

    console.log("Users processed with roles and counts");

    const users: UserData[] = usersWithDetails.map((row: any) => ({
      id: (row as Record<string, unknown>).id as string,
      name: (row as Record<string, unknown>).name as string | null,
      email: (row as Record<string, unknown>).email as string | null,
      image: (row as Record<string, unknown>).image as string | null,
      walletAddress: (row as Record<string, unknown>).walletAddress as string,
      hasPandorasKey: (row as Record<string, unknown>).hasPandorasKey as boolean,
      connectionCount: Number((row as Record<string, unknown>).connectionCount),
      lastConnectionAt: (row as Record<string, unknown>).lastConnectionAt as string,
      createdAt: (row as Record<string, unknown>).createdAt as string,
      role: (row as Record<string, unknown>).role as UserRole,
      projectCount: Number((row as Record<string, unknown>).projectCount),
      systemProjectsManaged: (row as Record<string, unknown>).systemProjectsManaged as number | undefined,
      kycLevel: (row as Record<string, unknown>).kycLevel as 'N/A' | 'basic',
      kycCompleted: (row as Record<string, unknown>).kycCompleted as boolean,
      kycData: (row as Record<string, unknown>).kycData as any || null,
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: "Error al obtener usuarios", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
