import { db } from "~/db"; 
import { NextResponse } from "next/server";
import { syncThirdwebUser } from "@/lib/user-sync";
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// const client = postgres(connectionString);
// const db = drizzle(client, { schema: { projects: projectsSchema } });
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, email, name, image } = body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        { message: "Dirección de wallet requerida" },
        { status: 400 }
      );
    }

    // Validar formato de wallet
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return NextResponse.json(
        { message: "Dirección de wallet inválida" },
        { status: 400 }
      );
    }

    console.log('🔄 API call to sync:', { walletAddress, email, name, image });

    // Sincronizar usuario en la base de datos con información completa
    await syncThirdwebUser({
      walletAddress: walletAddress.toLowerCase(),
      email: email ?? null,
      name: name ?? null,
      image: image ?? null,
    });

    return NextResponse.json({ message: "Usuario sincronizado correctamente" });

  } catch (error) {
    console.error("Error en user-sync API:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint para actualizar información de usuario existente
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, email, name, image } = body;

    if (!walletAddress || !email) {
      return NextResponse.json(
        { message: "Wallet y email requeridos" },
        { status: 400 }
      );
    }

    console.log('📝 Updating user profile:', { walletAddress, email, name, image });

    // Actualizar información del usuario existente
    await db.execute(sql`
      UPDATE "users"
      SET "name" = ${name ?? null},
          "email" = ${email},
          "image" = ${image ?? null},
          "lastConnectionAt" = NOW()
      WHERE "walletAddress" = ${walletAddress.toLowerCase()}
    `);

    return NextResponse.json({ message: "Usuario actualizado correctamente" });

  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error actualizando usuario" },
      { status: 500 }
    );
  }
}
