/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { sql } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { session } = await getAuth(await headers());

    const walletAddress = session?.userId;
    if (!walletAddress) {
      return NextResponse.json({ message: "No autorizado - Sesión inválida" }, { status: 401 });
    }

    const result = await db.execute(sql`
      SELECT json_build_object(
        'id', u."id",
        'name', u."name",
        'email', u."email",
        'image', u."image",
        'walletAddress', u."walletAddress",
        'connectionCount', u."connectionCount",
        'lastConnectionAt', u."lastConnectionAt",
        'createdAt', u."createdAt",
        'kycLevel', u."kycLevel",
        'kycCompleted', u."kycCompleted",
        'kycData', u."kycData",
        'projects', COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]')
      ) AS profile
      FROM "User" u
      LEFT JOIN "projects" p
        ON LOWER(u."walletAddress") = LOWER(p."applicant_wallet_address")
      WHERE LOWER(u."walletAddress") = LOWER(${walletAddress})
      GROUP BY u."id"
    `);

    if (result.length === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const profile = (result[0] as any).profile;

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
    console.error("Error optimized profile:", error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
