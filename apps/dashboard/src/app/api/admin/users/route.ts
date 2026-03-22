import { NextResponse } from "next/server";
import { sql as drizzleSql } from "drizzle-orm";
import { db } from "~/db";
import { validateAdminSession } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";
import { getSuperAdminWallet } from "@/lib/constants";
import type { UserData } from "@/types/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ADMIN ONLY - Users management endpoint
export async function GET(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  const requestId = logger.generateRequestId();
  const userId = session!.userId;

  try {
    logger.info({
      requestId,
      userId,
      event: "GET_USERS_START",
      path: "/api/admin/users"
    });

    const SUPER_ADMIN_WALLET = (getSuperAdminWallet() || "0x_no_super_admin").toLowerCase();

    // ----------- QUERIES REFACTORIZADAS CON DRIZZLE / DB EXECUTE -----------
    
    // First, check if there are any users
    const userCountResult = await db.execute(drizzleSql`SELECT COUNT(*) as count FROM "users"`);
    const userCount = Number((userCountResult[0] as any)?.count || 0);

    if (userCount === 0) {
      logger.info({ requestId, userId, event: "GET_USERS_EMPTY" });
      return NextResponse.json([]);
    }

    // Fetch users with project counts using a robust join
    const usersQuery = await db.execute(drizzleSql`
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
      WHERE LOWER(u."walletAddress") != ${SUPER_ADMIN_WALLET}
      ORDER BY u."createdAt" DESC
    `);

    // Get total projects for admin role metrics
    const totalProjectsResult = await db.execute(drizzleSql`SELECT COUNT(*) as count FROM "projects"`);
    const totalProjectsInDb = Number((totalProjectsResult[0] as any)?.count || 0);

    // Get all admin wallets to determine roles
    const adminWalletsResult = await db.execute(drizzleSql`SELECT "wallet_address" FROM "administrators"`);
    const adminWallets = (adminWalletsResult as any[])
      .filter((row: any) => row?.wallet_address)
      .map((row: any) => row.wallet_address.toLowerCase());

    const ALL_ADMIN_WALLETS = [SUPER_ADMIN_WALLET, ...adminWallets];

    const usersWithRoles = (usersQuery as any[]).map((user: any) => {
      const userWallet = user.walletAddress?.toLowerCase();
      const isSuperAdmin = userWallet === SUPER_ADMIN_WALLET;
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

    logger.info({
      requestId,
      userId,
      event: "GET_USERS_SUCCESS",
      metadata: { count: usersWithRoles.length }
    });

    return NextResponse.json(usersWithRoles);
  } catch (error) {
    logger.error({
      requestId,
      userId,
      event: "GET_USERS_ERROR",
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json(
      { error: "Error al obtener usuarios", requestId, details: String(error) },
      { status: 500 }
    );
  }
}
