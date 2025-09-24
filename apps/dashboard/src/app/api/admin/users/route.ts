import { NextResponse } from "next/server";
import { getAuth, isAdmin } from "@/lib/auth";
import { db } from "~/db";
import { sql } from "drizzle-orm";
import type { UserData, UserRole } from "@/types/admin";

export async function GET() {
  try {
    const { session } = await getAuth();
    const userIsAdmin = await isAdmin(session?.userId);

    if (!userIsAdmin) {
      return NextResponse.json({ message: "No autorizado" }, { status: 403 });
    }

    // First, try a simple query to check if table exists and has data
    const simpleUserQuery = await db.execute(sql`SELECT COUNT(*) as total FROM "User"`);
    console.log("Simple user count:", simpleUserQuery);
    const totalUsers = simpleUserQuery[0]?.total as string;
    console.log("Total users:", totalUsers);

    // For testing, if no users exist, create a sample user to verify the system works
    if (totalUsers === '0') {
      console.log("No users found in database - creating sample user for testing");

      // Insert a sample user
      await db.execute(sql`
        INSERT INTO "User" ("id", "name", "email", "image", "walletAddress", "hasPandorasKey", "createdAt")
        VALUES (
          'sample-user-uuid',
          'Usuario de Ejemplo',
          'sample@example.com',
          'https://example.com/avatar.jpg',
          '0x1234567890123456789012345678901234567890',
          true,
          NOW()
        )
      `);

      console.log("Sample user created successfully");
    }

    // Get all users with their project counts and roles
    console.log("Executing simplified user query");

    // First get all users
    const usersQuery = await db.execute(sql`
      SELECT
        "id",
        "name",
        "email",
        "image",
        "walletAddress",
        "hasPandorasKey",
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);

    console.log("Users query result:", usersQuery.length, "users found");

    // For each user, get project count and determine role
    const usersWithDetails = await Promise.all(
      usersQuery.map(async (user: any) => {
        let projectCount = 0;

        try {
          // Try to count projects for this user - gracefully handle missing/invalid emails
          if (user.email && user.email !== null) {
            const projectCountQuery = await db.execute(sql`
              SELECT COUNT(*) as count
              FROM "projects"
              WHERE "applicantEmail" = ${user.email}
            `);
            projectCount = Number(projectCountQuery[0]?.count as string);
          }
        } catch (countError) {
          console.warn("Could not count projects for user", user.id, ":", countError);
          projectCount = 0; // Default to 0 if query fails
        }

        let isAdmin = false;
        try {
          // Check if admin
          const adminCheck = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM "administrators"
            WHERE "walletAddress" = ${user.walletAddress}
          `);
          isAdmin = Number(adminCheck[0]?.count as string) > 0;
        } catch (adminError) {
          console.warn("Could not check admin status for user", user.id, ":", adminError);
          isAdmin = false; // Default to false if query fails
        }

        // Determine role
        let role: 'admin' | 'applicant' | 'pandorian';
        if (isAdmin) {
          role = 'admin';
        } else if (projectCount > 0) {
          role = 'applicant';
        } else {
          role = 'pandorian';
        }

        return {
          ...user,
          projectCount,
          role
        };
      })
    );

    console.log("Users processed with roles and counts");

    const users: UserData[] = usersWithDetails.map((row: any) => ({
      id: row.id as string,
      name: row.name as string | null,
      email: row.email as string | null,
      image: row.image as string | null,
      walletAddress: row.walletAddress as string,
      hasPandorasKey: row.hasPandorasKey as boolean,
      createdAt: row.createdAt as string,
      role: row.role as UserRole,
      projectCount: Number(row.projectCount),
    }));

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { message: "Error al obtener usuarios", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
