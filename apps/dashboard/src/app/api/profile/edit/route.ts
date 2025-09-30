/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { sql } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";

interface ProfileUpdateData {
  name: string;
  email: string;
  image: string;
  kycLevel: 'basic' | 'advanced' | 'N/A';
  kycCompleted: boolean;
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  occupation: string;
  taxId: string;
  nationality: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export async function POST(request: Request) {
  try {
    const { session } = await getAuth(await headers());

    // 🔒 Validación defensiva para userId requerido
    if (!session?.userId) {
      console.error("🔐 AUTH ERROR: No userId for profile edit", {
        timestamp: new Date().toISOString(),
        session: JSON.stringify(session),
        headers: await headers()
      });
      return NextResponse.json({ message: "No autorizado - Sesión inválida" }, { status: 403 });
    }

    const userId = session.userId;

    const body = await request.json() as {
      walletAddress: string;
      profileData: ProfileUpdateData;
    };

    // Verify the wallet address matches the session
    if (body.walletAddress.toLowerCase() !== userId.toLowerCase()) {
      return NextResponse.json({ message: "Wallet address mismatch" }, { status: 403 });
    }

    const { profileData } = body;

    // Validate basic required fields
    if (!profileData.name?.trim()) {
      return NextResponse.json({ message: "Nombre es requerido" }, { status: 400 });
    }

    if (!profileData.email?.trim()) {
      return NextResponse.json({ message: "Email es requerido" }, { status: 400 });
    }

    // If KYC is completed, validate required fields
    if (profileData.kycCompleted) {
      if (!profileData.fullName?.trim() || !profileData.phoneNumber?.trim() ||
          !profileData.nationality?.trim() || !profileData.address?.country?.trim()) {
        return NextResponse.json({ message: "Campos KYC requeridos incompletos" }, { status: 400 });
      }
    }

    // Update user profile data
    await db.execute(sql`
      UPDATE "User"
      SET "name" = ${profileData.name},
          "email" = ${profileData.email},
          "image" = ${profileData.image},
          "kycLevel" = ${profileData.kycLevel},
          "kycCompleted" = ${profileData.kycCompleted},
          "kycData" = ${JSON.stringify({
            fullName: profileData.fullName,
            phoneNumber: profileData.phoneNumber,
            dateOfBirth: profileData.dateOfBirth,
            occupation: profileData.occupation,
            taxId: profileData.taxId,
            nationality: profileData.nationality,
            address: profileData.address,
          })},
          "updatedAt" = NOW()
      WHERE "walletAddress" = ${body.walletAddress}
    `);

    console.log(`Profile updated for user: ${body.walletAddress}`);

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      profileData
    });

  } catch (error) {
    console.error("Error updating profile:", error);
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

    // Get current user profile data
    const userResult = await db.execute(sql`
      SELECT "name", "email", "image", "kycLevel", "kycCompleted", "kycData"
      FROM "User"
      WHERE "walletAddress" = ${session.userId}
    `);

    if (userResult.length === 0) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const user = userResult[0] as any;

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      kycLevel: user.kycLevel,
      kycCompleted: user.kycCompleted,
      kycData: user.kycData,
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
