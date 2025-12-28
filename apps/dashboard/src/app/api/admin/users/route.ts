import { NextResponse } from "next/server";
import { headers } from "next/headers";
import postgres from "postgres";
import type { UserData } from "@/types/admin";
import { getSuperAdminWallet } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ✅ Singleton seguro para postgres.js (evita pools infinitos)
let sql: ReturnType<typeof postgres> | null = null;
// Dynamic imports para evitar problemas de build (igual que otros endpoints)
let getAuth: any = null;
let isAdmin: any = null;

async function loadDependencies() {
  if (!getAuth || !isAdmin) {
    const authModule = await import("@/lib/auth");
    getAuth = authModule.getAuth;
    isAdmin = authModule.isAdmin;
  }
}

function getDatabaseConnection() {
  if (!sql) {
    sql = postgres(process.env.DATABASE_URL!, {
      ssl: process.env.NODE_ENV === 'production' ? 'require' : false, // SSL solo en producción
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      connection: {
        application_name: 'pandoras-users-api'
      }
    });
  }
  return sql;
}

// ADMIN ONLY - Users management endpoint
export async function GET() {
  try {
    await loadDependencies(); // Importar funciones dinámicamente

    console.log("🛠️ [Admin/Users] API called - starting authentication check");

    // Debug: verificar que las funciones se cargaron correctamente
    console.log("🛠️ [Admin/Users] getAuth available:", typeof getAuth);
    console.log("🛠️ [Admin/Users] isAdmin available:", typeof isAdmin);

    const { session } = await getAuth(await headers());
    console.log("🛠️ [Admin/Users] session obtained:", !!session);

    const walletAddress = session?.address ?? session?.userId;
    if (!walletAddress) {
      return NextResponse.json(
        { message: "No autorizado - Sesión inválida" },
        { status: 401 }
      );
    }

    const userIsAdmin = await isAdmin(walletAddress);
    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const SUPER_ADMIN_WALLETS = [getSuperAdminWallet()] as const;

    const sql = getDatabaseConnection();

    // ----------- QUERIES ORIGINALES REACTIVADAS -----------
    const userCountResult = await sql`SELECT COUNT(*) as count FROM "users"`;
    const userCount = Number(userCountResult[0]?.count || 0);

    if (userCount === 0) {
      return NextResponse.json([]);
    }

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

    const totalProjectsResult =
      await sql`SELECT COUNT(*) as count FROM "projects"`;
    const totalProjectsInDb = Number(totalProjectsResult[0]?.count || 0);

    const adminWalletsResult =
      await sql`SELECT "wallet_address" FROM "administrators"`;
    const adminWallets = adminWalletsResult
      .filter((row: any) => row?.wallet_address)
      .map((row: any) => row.wallet_address.toLowerCase());

    const ALL_ADMIN_WALLETS = [...SUPER_ADMIN_WALLETS, ...adminWallets];

    const usersWithRoles = usersQuery.map((user: any) => {
      const userWallet = user.walletAddress?.toLowerCase();
      const isSuperAdmin = userWallet === SUPER_ADMIN_WALLETS[0];
      const isAdmin = ALL_ADMIN_WALLETS.includes(userWallet);

      let role: "admin" | "applicant" | "pandorian";
      let systemProjectsManaged: number | undefined;

      if (isSuperAdmin || isAdmin) {
        role = "admin";
        systemProjectsManaged = totalProjectsInDb;
      } else if (Number(user.projectCount) > 0) {
        role = "applicant";
      } else {
        role = "pandorian";
      }

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
        role,
        projectCount: Number(user.projectCount),
        systemProjectsManaged,
        kycLevel: user.kycLevel,
        kycCompleted: user.kycCompleted,
        kycData: user.kycData,
      } as UserData;
    });

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    console.error("Error retrieving users:", error);
    return NextResponse.json(
      { message: "Error al obtener usuarios", details: String(error) },
      { status: 500 }
    );
  }
}
