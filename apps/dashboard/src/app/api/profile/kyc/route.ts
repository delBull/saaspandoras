/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { sql } from "drizzle-orm";
import type { KYCData } from "@/types/admin";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { session } = await getAuth(await headers());

    // 🔒 Validación defensiva para userId requerido en KYC
    if (!session?.userId) {
      console.error("🔐 AUTH ERROR: No userId for KYC submission", {
        timestamp: new Date().toISOString(),
        session: JSON.stringify(session),
        headers: await headers()
      });
      return NextResponse.json({ message: "No autorizado - Sesión inválida" }, { status: 403 });
    }

    const userId = session.userId;

    const body = await request.json() as {
      walletAddress: string;
      kycData: KYCData;
    };

    // Verify the wallet address matches the session
    if (body.walletAddress.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ message: "Wallet address mismatch" }, { status: 403 });
    }

    // Validate basic KYC data
    const { kycData } = body;

    if (!kycData.fullName?.trim() || !kycData.phoneNumber?.trim() || !kycData.nationality?.trim()) {
      return NextResponse.json({ message: "Datos KYC incompletos" }, { status: 400 });
    }

    // Validate age if date of birth is provided
    if (kycData.dateOfBirth) {
      const birthDate = new Date(kycData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        if (age <= 18) {
          return NextResponse.json({ message: "Debes ser mayor de 18 años" }, { status: 400 });
        }
      } else if (age < 18) {
        return NextResponse.json({ message: "Debes ser mayor de 18 años" }, { status: 400 });
      }
    }

    // Update user KYC data
    await db.execute(sql`
      UPDATE "User"
      SET "kycLevel" = 'advanced',
          "kycCompleted" = true,
          "kycData" = ${JSON.stringify(kycData)}
      WHERE "walletAddress" = ${body.walletAddress}
    `);

    console.log(`KYC completed for user: ${body.walletAddress}`);

    return NextResponse.json({
      message: "KYC completado exitosamente",
      kycLevel: "advanced",
      kycCompleted: true
    });

  } catch (error) {
    console.error("Error processing KYC:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { session } = await getAuth(await headers());
    if (!session?.userId) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // Get current user KYC status
    const userResult = await db.execute(sql`
      SELECT "kycLevel", "kycCompleted", "kycData"
      FROM "User"
      WHERE "walletAddress" = ${session.userId}
    `);

    if (userResult.length === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const user = userResult[0] as any;

    return NextResponse.json({
      kycLevel: user.kycLevel,
      kycCompleted: user.kycCompleted,
      kycData: user.kycData,
    });

  } catch (error) {
    console.error("Error fetching KYC status:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
