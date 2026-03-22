import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

import { db } from "~/db";
import { administrators } from "@/db/schema";
import { SUPER_ADMIN_WALLET } from "@/lib/constants";
import { validateAdminSession } from "@/lib/admin-auth";
import { logger } from "@/lib/logger";

// Force dynamic runtime
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const addAdminSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Dirección de wallet inválida."),
  alias: z.string().max(100, "El alias no puede tener más de 100 caracteres.").optional(),
});

export async function GET(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  const requestId = logger.generateRequestId();
  const userId = session!.userId;

  try {
    // Super admins hardcodeados que aparecen en la UI (creados dinámicamente)
    const SUPER_ADMINS = [
      {
        id: 999,
        wallet_address: SUPER_ADMIN_WALLET.toLowerCase(),
        alias: "Super Admin",
        role: "admin",
        added_by: "system",
        created_at: new Date("2024-01-01T00:00:00.000Z"),
        updated_at: new Date("2024-01-01T00:00:00.000Z")
      }
    ];

    logger.info({
      requestId,
      userId,
      event: "GET_ADMINS_START",
      path: "/api/admin/administrators"
    });
    
    try {
      await db.execute(sql`SELECT 1 FROM administrators LIMIT 1`);
    } catch (testError) {
      logger.error({
        requestId,
        userId,
        event: "DB_HEALTH_CHECK_FAILED",
        error: testError instanceof Error ? testError.message : String(testError)
      });
      return NextResponse.json({ 
        error: "Table access failed", 
        requestId
      }, { status: 500 });
    }

    const dbAdmins = await db.query.administrators.findMany();
    // Combinar admins de BD con super admins hardcodeados
    const allAdmins = [...SUPER_ADMINS, ...dbAdmins];

    logger.info({
      requestId,
      userId,
      event: "GET_ADMINS_SUCCESS",
      metadata: { count: allAdmins.length }
    });

    return NextResponse.json(allAdmins);
  } catch (error) {
    logger.error({
      requestId,
      userId,
      event: "GET_ADMINS_ERROR",
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : "Undefined error" 
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/administrators
 * Añade un nuevo administrador.
 * Solo accesible por el Super Admin.
 */
export async function POST(request: Request) {
  const { session, errorResponse } = await validateAdminSession(request.headers);
  if (errorResponse) return errorResponse;

  const requestId = logger.generateRequestId();
  const userId = session!.userId;

  const body: unknown = await request.json();

  logger.info({
    requestId,
    userId,
    event: "POST_ADMIN_START",
    metadata: { newAdmin: (body as any)?.walletAddress }
  });

  // Check if user is super admin
  const isSuperAdmin = userId.toLowerCase() === SUPER_ADMIN_WALLET.toLowerCase();

  if (!isSuperAdmin) {
    logger.warn({
      requestId,
      userId,
      event: "POST_ADMIN_FORBIDDEN"
    });
    return NextResponse.json({ message: "No autorizado. Solo Super Admin.", requestId }, { status: 403 });
  }

  const validation = addAdminSchema.safeParse(body);
  if (!validation.success) {
    logger.warn({
      requestId,
      userId,
      event: "POST_ADMIN_INVALID_DATA",
      error: JSON.stringify(validation.error.flatten())
    });
    return NextResponse.json({ message: "Datos inválidos", errors: validation.error.flatten(), requestId }, { status: 400 });
  }

  const newAddress = validation.data.walletAddress.toLowerCase();

  try {
    const [newAdmin] = await db.insert(administrators).values({
      walletAddress: newAddress,
      alias: validation.data.alias?.trim() ?? null,
      addedBy: userId,
    }).returning();

    logger.info({
      requestId,
      userId,
      event: "POST_ADMIN_SUCCESS",
      metadata: { added: newAddress }
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    logger.error({
      requestId,
      userId,
      event: "POST_ADMIN_ERROR",
      error: error instanceof Error ? error.message : String(error)
    });
    return NextResponse.json({ message: "Esta wallet ya es un administrador o hubo un error.", requestId }, { status: 409 });
  }
}
