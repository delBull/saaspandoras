import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import postgres from "postgres";
import type { UserData } from "@/types/admin";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

// Database connection helper
function getDatabaseConnection() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  return postgres(connectionString, {
    prepare: false // Disable prepared statements for compatibility
  });
}

// ADMIN ONLY - Users management endpoint
export async function GET() {
  try {
    console.log('🛠️ [Admin/Users] API called - starting authentication check');

    const { session } = await getAuth(await headers());
    console.log('🛠️ [Admin/Users] Session received:', {
      hasSession: !!session,
      hasUserId: !!session?.userId,
      hasAddress: !!session?.address,
      userId: session?.userId?.substring(0, 10) + '...',
      address: session?.address?.substring(0, 10) + '...'
    });

    const walletAddress = session?.address ?? session?.userId;
    if (!walletAddress) {
      console.error('🛠️ [Admin/Users] No wallet address in session');
      return NextResponse.json({ message: "No autorizado - Sesión inválida" }, { status: 401 });
    }

    console.log('🛠️ [Admin/Users] User authenticated:', walletAddress?.substring(0, 10) + '...');

    const userIsAdmin = await isAdmin(walletAddress);
    console.log('🛠️ [Admin/Users] Is admin check result:', userIsAdmin);

    if (!userIsAdmin) {
      console.error('🛠️ [Admin/Users] User is not admin:', walletAddress?.substring(0, 10) + '...');
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    console.log('🛠️ [Admin/Users] Fetching users from database...');

    // Define constants first
    const SUPER_ADMIN_WALLETS = ['0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9'] as const;

    // Get database connection for this request
    const sql = getDatabaseConnection();

    // Use postgres.js directly - the simplest possible query
    try {
      console.log('🛠️ [Admin/Users] Testing basic query...');

      // First, check if we have any users
      const userCountResult = await sql`SELECT COUNT(*) as count FROM "users"`;
      const userCount = Number(userCountResult[0]?.count || 0);
      console.log('🛠️ [Admin/Users] User count:', userCount);

      if (userCount === 0) {
        console.log('🛠️ [Admin/Users] No users found, returning empty array');
        // Cleanup connection
        await sql.end();
        return NextResponse.json([]);
      }

      // Get users with their project counts using a simpler approach
      // Count ALL projects (including drafts) - the admin should see all user activity
      const usersQuery = await sql`
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
          COALESCE(project_counts.project_count, 0) as "projectCount"
        FROM "users" u
        LEFT JOIN (
          SELECT
            LOWER(p."applicant_wallet_address") as wallet_lower,
            COUNT(p.id) as project_count
          FROM "projects" p
          WHERE p."applicant_wallet_address" IS NOT NULL
            AND p."applicant_wallet_address" != ''
          GROUP BY LOWER(p."applicant_wallet_address")
        ) project_counts ON LOWER(u."walletAddress") = project_counts.wallet_lower
        WHERE LOWER(u."walletAddress") != LOWER(${SUPER_ADMIN_WALLETS[0]})
        ORDER BY u."createdAt" DESC
      `;

      console.log('🛠️ [Admin/Users] Users query executed successfully');
      console.log('🛠️ [Admin/Users] Found users:', usersQuery.length);

      if (usersQuery.length > 0) {
        console.log('🛠️ [Admin/Users] Sample user:', {
          id: usersQuery[0]?.id,
          walletAddress: usersQuery[0]?.walletAddress,
          projectCount: usersQuery[0]?.projectCount
        });
      }

      // Get total projects for admin calculations
      const totalProjectsResult = await sql`SELECT COUNT(*) as count FROM "projects"`;
      const totalProjectsInDb = Number(totalProjectsResult[0]?.count || 0);
      console.log('🛠️ [Admin/Users] Total projects in DB:', totalProjectsInDb);

      // Get admin wallets
      const adminWalletsResult = await sql`SELECT "wallet_address" FROM "administrators"`;
      const adminWallets = adminWalletsResult
        .filter((row: any) => row?.wallet_address)
        .map((row: any) => row.wallet_address.toLowerCase());
      const ALL_ADMIN_WALLETS = [...SUPER_ADMIN_WALLETS, ...adminWallets];

      console.log('🛠️ [Admin/Users] Admin wallets:', ALL_ADMIN_WALLETS.length);

      // Process users with role calculation
      const usersWithRoles = usersQuery.map((user: any) => {
        const userWallet = user.walletAddress?.toLowerCase();
        const isSuperAdmin = user.walletAddress === SUPER_ADMIN_WALLETS[0];
        const isAdmin = userWallet && ALL_ADMIN_WALLETS.includes(userWallet);

        let role: 'admin' | 'applicant' | 'pandorian';
        let systemProjectsManaged: number | undefined;

        if (isSuperAdmin) {
          role = 'admin';
          systemProjectsManaged = totalProjectsInDb;
        } else if (isAdmin) {
          role = 'admin';
          systemProjectsManaged = totalProjectsInDb;
        } else if (Number(user.projectCount) > 0) {
          role = 'applicant';
        } else {
          role = 'pandorian';
        }

        console.log(`🛠️ [Admin/Users] User ${userWallet?.substring(0, 8)}: role=${role}, projects=${user.projectCount}`);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          walletAddress: user.walletAddress,
          hasPandorasKey: user.hasPandorasKey,
          connectionCount: Number(user.connectionCount),
          lastConnectionAt: user.lastConnectionAt,
          createdAt: user.createdAt,
          role: role,
          projectCount: Number(user.projectCount),
          systemProjectsManaged: systemProjectsManaged,
          kycLevel: user.kycLevel,
          kycCompleted: user.kycCompleted,
          kycData: user.kycData,
        } as UserData;
      });

      console.log('🛠️ [Admin/Users] Processed users:', usersWithRoles.length);
      console.log('🛠️ [Admin/Users] Sample processed user:', usersWithRoles[0] ? {
        id: usersWithRoles[0].id,
        walletAddress: usersWithRoles[0].walletAddress,
        role: usersWithRoles[0].role,
        projectCount: usersWithRoles[0].projectCount
      } : 'No users');

      return NextResponse.json(usersWithRoles);
    } catch (queryError) {
      console.error('🛠️ [Admin/Users] Query failed:', queryError);

      // Fallback: Try the simplest possible query
      try {
        const simpleQuery = await sql`SELECT "id", "walletAddress" FROM "users" LIMIT 1`;
        console.log('🛠️ [Admin/Users] Simple query works:', simpleQuery.length);

        return NextResponse.json({
          message: "Complex query failed but simple query works",
          simpleQueryWorks: simpleQuery.length > 0,
          error: queryError instanceof Error ? queryError.message : 'Unknown error'
        });
      } catch (simpleError) {
        console.error('🛠️ [Admin/Users] Even simple query failed:', simpleError);
        return NextResponse.json(
          { message: "Database query failed", error: simpleError instanceof Error ? simpleError.message : 'Unknown error' },
          { status: 500 }
        );
      }
    }
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
