import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "~/db";
import { users } from "~/db/schema";
import { eq, sql } from "drizzle-orm";

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
    console.log("🚀 POST /api/profile/edit - ===== START REQUEST =====");

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
    console.log(`👤 POST /api/profile/edit - User authenticated: ${userId}`);

    const body = await request.json() as {
      walletAddress: string;
      profileData: ProfileUpdateData;
    };

    console.log(`📨 POST /api/profile/edit - Received request body:`, JSON.stringify(body, null, 2));
    console.log(`🏠 Requested wallet to update: ${body.walletAddress}`);
    console.log(`👤 Session user: ${userId}`);
    console.log(`📝 Data to save:`, {
      name: body.profileData.name,
      email: body.profileData.email,
      occupation: body.profileData.occupation,
      nationality: body.profileData.nationality
    });

    // Verify the wallet address matches the session
    if (body.walletAddress.toLowerCase() !== userId.toLowerCase()) {
      console.log(`POST /api/profile/edit - Wallet mismatch: ${body.walletAddress} vs ${userId}`);
      return NextResponse.json({ message: "Wallet address mismatch" }, { status: 403 });
    }

    const { profileData } = body;

    // Validate basic required fields
    if (!profileData.name?.trim()) {
      console.log("POST /api/profile/edit - Name validation failed");
      return NextResponse.json({ message: "Nombre es requerido" }, { status: 400 });
    }

    if (!profileData.email?.trim()) {
      console.log("POST /api/profile/edit - Email validation failed");
      return NextResponse.json({ message: "Email es requerido" }, { status: 400 });
    }

    // If KYC is completed, validate required fields
    if (profileData.kycCompleted) {
      if (!profileData.fullName?.trim() || !profileData.phoneNumber?.trim() ||
          !profileData.nationality?.trim() || !profileData.address?.country?.trim()) {
        console.log("POST /api/profile/edit - KYC fields validation failed");
        return NextResponse.json({ message: "Campos KYC requeridos incompletos" }, { status: 400 });
      }
    }

    console.log("POST /api/profile/edit - Validations passed, preparing DB update");

    // Update user profile data using direct SQL for debugging
    const updateQuery = sql`
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
          })}
      WHERE LOWER("walletAddress") = LOWER(${body.walletAddress})
    `;

    console.log("POST /api/profile/edit - Executing query:", updateQuery);

    const updateResult = await db.execute(updateQuery);
    console.log("POST /api/profile/edit - Query result:", updateResult);

    console.log(`Profile updated successfully for user: ${body.walletAddress}`);
    console.log('Updated fields:', {
      name: profileData.name,
      email: profileData.email,
      kycCompleted: profileData.kycCompleted,
      kycDataSample: {
        occupation: profileData.occupation,
        nationality: profileData.nationality,
        hasAddress: !!profileData.address?.country
      }
    });

    return NextResponse.json({
      message: "Perfil actualizado exitosamente",
      profileData
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    return NextResponse.json(
      { message: "Error interno del servidor", details: error instanceof Error ? error.message : "Unknown error" },
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

    console.log(`GET /api/profile/edit - Fetching data for user: ${session.userId}`);

    // Get current user profile data using Drizzle ORM
    const userResult = await db.select({
      name: users.name,
      email: users.email,
      image: users.image,
      kycLevel: users.kycLevel,
      kycCompleted: users.kycCompleted,
      kycData: users.kycData,
    })
    .from(users)
    .where(eq(users.walletAddress, session.userId))
    .limit(1);

    if (userResult.length === 0) {
      console.log(`GET /api/profile/edit - User not found: ${session.userId}`);
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 });
    }

    const user = userResult[0];

    if (!user) {
      console.log(`GET /api/profile/edit - User data is undefined: ${session.userId}`);
      return NextResponse.json({ message: "Datos de usuario no encontrados" }, { status: 404 });
    }

    console.log(`GET /api/profile/edit - User data retrieved for: ${session.userId}`, {
      name: user.name,
      kycLevel: user.kycLevel,
      kycCompleted: user.kycCompleted
    });

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
