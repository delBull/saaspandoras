import { type NextRequest, NextResponse } from "next/server";
import { db } from "~/db";
// import { drizzle } from "drizzle-orm/postgres-js";
// import postgres from "postgres";

// Initialize database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables");
}

// const client = postgres(connectionString);
// const db = drizzle(client, { schema: { projects: projectsSchema } });
import { projects } from "@/db/schema"; // Importa tu esquema
import { isAdmin } from "@/lib/auth";
import { headers } from "next/headers";
import { sql, and, or, isNotNull, ne, isNull, eq } from "drizzle-orm";

// ⚠️ EXPLICITAMENTE USAR Node.js RUNTIME para APIs que usan PostgreSQL
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Endpoint de diagnóstico TEMPORAL para inspeccionar los datos de un proyecto.
 * Uso: GET /api/admin/projects/sync-owners?id=<ID_DEL_PROYECTO>
 */
export async function GET(request: NextRequest) {
  console.log('🩺 DIAGNOSTIC: ===== STARTING DIAGNOSTIC REQUEST =====');
  try {
    const requestHeaders = await headers();
    const walletAddress = requestHeaders.get('x-wallet-address');
    if (!await isAdmin(walletAddress)) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json({ message: "Por favor, proporciona un 'id' de proyecto en la URL." }, { status: 400 });
    }

    console.log(`🩺 DIAGNOSTIC: Fetching data for project ID: ${projectId}`);

    const projectData = await db.execute(sql`SELECT * FROM projects WHERE id = ${Number(projectId)}`);

    if (!projectData || projectData.length === 0) {
      return NextResponse.json({ message: "Proyecto no encontrado" }, { status: 404 });
    }

    return NextResponse.json(projectData[0]);
  } catch (error) {
    return NextResponse.json({ message: "Error en el diagnóstico", error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

/**
 * Endpoint para sincronizar los nombres de los propietarios de los proyectos.
 * Actualiza el campo `applicant_name` con el valor de `update_authority_address`
 * para todos los proyectos donde el nombre es nulo pero la wallet existe.
 * Esta es una operación de corrección de datos para proyectos existentes.
 */
export async function POST() {
  console.log('🔄 SYNC: ===== STARTING OWNER SYNC REQUEST =====');

  try {
    // 1. Verificar que el usuario es administrador
    const requestHeaders = await headers();
    const walletAddress = requestHeaders.get('x-thirdweb-address') ??
                         requestHeaders.get('x-wallet-address') ??
                         requestHeaders.get('x-user-address');

    const userIsAdmin = await isAdmin(walletAddress);

    if (!userIsAdmin) {
      console.log('🔄 SYNC: Access denied - user is not admin');
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    console.log('🔄 SYNC: Admin authorized. Proceeding with sync.');

    // 2. Buscar proyectos que necesitan sincronización usando Drizzle ORM
    const projectsToSync = await db.select({
        id: projects.id,
        title: projects.title,
        applicantName: projects.applicantName, // Corrected from snake_case
        applicantWalletAddress: projects.applicantWalletAddress, // Corrected from snake_case
        updateAuthorityAddress: projects.updateAuthorityAddress // Corrected from snake_case
      })
      .from(projects)
      .where(
        // La condición correcta: buscar proyectos donde la wallet del aplicante NO está definida.
        and(
          or(isNull(projects.applicantWalletAddress), eq(projects.applicantWalletAddress, '')),
          isNotNull(projects.updateAuthorityAddress),
          ne(projects.updateAuthorityAddress, '')
        )
      );

    console.log(`🔄 SYNC: Found ${projectsToSync.length} projects with empty applicant_name.`);
    
    if (projectsToSync.length === 0) {
      console.log('🔄 SYNC: No projects found with an empty applicant_name. The issue might be in the frontend data fetching.');
      return NextResponse.json({ message: "No se encontraron creaciones con nombre de propietario vacío.", projectsUpdated: 0 }, { status: 200 });
    }

    console.log('🔄 SYNC: Projects to be updated (showing first 5):', projectsToSync.slice(0, 5));

    // 3. Ejecutar la actualización
    let updatedCount = 0;
    for (const project of projectsToSync) {
      // La fuente de verdad para proyectos antiguos es 'update_authority_address'
      const sourceWallet = project.updateAuthorityAddress;
      if (sourceWallet?.startsWith('0x')) {
        await db.update(projects)
          .set({ 
            applicantWalletAddress: sourceWallet, // <-- Rellenar la wallet de propiedad
            applicantName: sourceWallet           // <-- Rellenar el nombre para consistencia
          })
          .where(eq(projects.id, project.id));
        updatedCount++;
      }
    }

    console.log(`🔄 SYNC: ===== SYNC COMPLETED: ${updatedCount} projects updated =====`);

    return NextResponse.json(
      {
        message: "Sincronización completada exitosamente.",
        projectsUpdated: updatedCount,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("🔄 SYNC: ===== ERROR IN SYNC =====");
    console.error("🔄 SYNC: Error:", error);
    return NextResponse.json(
      { message: "Error interno del servidor al sincronizar propietarios." },
      { status: 500 }
    );
  }
}
