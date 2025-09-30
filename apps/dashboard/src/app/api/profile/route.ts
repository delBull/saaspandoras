/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  let walletAddress: string | undefined;

  try {
    const { session } = await getAuth(await headers());

    walletAddress = session?.userId ?? undefined;
    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado - Sesión inválida" }, { status: 401 });
    }

    console.log("🛠️ [Profile API] User wallet:", walletAddress);

    // Get user data directly from User table
    const userResult = await db.execute(sql`
      SELECT "id", "name", "email", "image", "walletAddress",
             "connectionCount", "lastConnectionAt", "createdAt",
             "kycLevel", "kycCompleted", "kycData"
      FROM "User"
      WHERE LOWER("walletAddress") = LOWER(${walletAddress})
    `);

    console.log("🛠️ [Profile API] User data direct query result length:", userResult.length);
    console.log("🛠️ [Profile API] User data direct query first item:", userResult[0]);

    if (userResult.length === 0 || !userResult[0]) {
      console.log("🛠️ [Profile API] User not found for wallet:", walletAddress);
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const userData = userResult[0] as any;

    // Get user projects
    const userProjects = await db.execute(sql`
      SELECT * FROM "projects"
      WHERE LOWER("applicant_wallet_address") = LOWER(${walletAddress})
      ORDER BY "created_at" DESC
    `);

    console.log("🛠️ [Profile API] User projects count:", userProjects.length);

    // Build profile object
    const profile = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      image: userData.image,
      walletAddress: userData.walletAddress,
      connectionCount: userData.connectionCount,
      lastConnectionAt: userData.lastConnectionAt,
      createdAt: userData.createdAt,
      kycLevel: userData.kycLevel,
      kycCompleted: userData.kycCompleted,
      kycData: userData.kycData,
      projects: userProjects
    };

    console.log("🛠️ [Profile API] Constructed profile:", {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      kycLevel: profile.kycLevel,
      kycCompleted: profile.kycCompleted,
      hasKycData: !!profile.kycData
    });


    // Agregar cálculo de rol y proyectos gestionados aquí mismo:
    const [adminCheck] = await db.execute(sql`
      SELECT COUNT(*) as count FROM "administrators"
      WHERE LOWER("wallet_address") = LOWER(${walletAddress})
    `);
    const isAdmin = Number((adminCheck as any).count) > 0;
    const isSuperAdmin = walletAddress.toLowerCase() === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';

    let role: "admin" | "applicant" | "pandorian";
    if (isAdmin || isSuperAdmin) {
      role = "admin";
    } else if (profile.projects.length > 0) {
      role = "applicant";
    } else {
      role = "pandorian";
    }

    let systemProjectsManaged: number | undefined;
    if (isAdmin || isSuperAdmin) {
      const [totalProjects] = await db.execute(sql`SELECT COUNT(*) as count FROM "projects"`);
      systemProjectsManaged = Number((totalProjects as any).count) || 0;
    }

    return NextResponse.json({
      ...profile,
      role,
      projectCount: profile.projects.length,
      systemProjectsManaged,
      hasPandorasKey: true,
    });
  } catch (error) {
    console.error("💥 [Profile API] Critical error occurred:");
    console.error("Error name:", error instanceof Error ? error.name : "Unknown error type");
    console.error("Error message:", error instanceof Error ? error.message : "No message");
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    console.error("Error object:", error);
    console.error("Wallet address that caused error:", walletAddress);
    return NextResponse.json({
      message: "Error interno del servidor",
      error: error instanceof Error ? error.message : "Unknown error",
      walletAddress: walletAddress
    }, { status: 500 });
  }
}
