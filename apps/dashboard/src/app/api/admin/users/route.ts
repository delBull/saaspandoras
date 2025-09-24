/* eslint-disable @typescript-eslint/no-explicit-any */
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
        INSERT INTO "User" ("id", "name", "email", "image", "walletAddress", "hasPandorasKey", "connectionCount", "lastConnectionAt", "createdAt")
        VALUES (
          'sample-user-uuid',
          'Usuario de Ejemplo',
          'sample@example.com',
          'https://example.com/avatar.jpg',
          '0x1234567890123456789012345678901234567890',
          true,
          1,
          NOW(),
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
        "connectionCount",
        "lastConnectionAt",
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);

    console.log("Users query result:", usersQuery.length, "users found");

    // Get project counts by email to improve performance
    const projectCountsByEmail: Record<string, number> = {};
    const totalProjectsInDb = { count: 0 };
    try {
      console.log("Fetching project counts...");
      // First count total projects
      const totalQuery = await db.execute(sql`SELECT COUNT(*) as count FROM "projects"`);
      totalProjectsInDb.count = Number(totalQuery[0]?.count as string);
      console.log("Total projects in DB:", totalProjectsInDb.count);

      // Get projects with applicant email - use correct column name
      const allProjects = await db.execute(sql`
        SELECT "applicant_email" as applicantEmail, COUNT(*) as count
        FROM "projects"
        WHERE "applicant_email" IS NOT NULL AND "applicant_email" != ''
        GROUP BY "applicant_email"
      `);

      console.log("Projects with email count:", allProjects.length);
      allProjects.forEach((row: any) => {
        projectCountsByEmail[row.applicantEmail as string] = Number(row.count as string);
      });
    } catch (error) {
      console.warn("Could not fetch project counts by email:", error);
    }

    // Get all admin wallets for role detection
    const adminWallets: string[] = [];
    try {
      const adminQuery = await db.execute(sql`
        SELECT "walletAddress" FROM "administrators"
      `);
      adminQuery.forEach((row: any) => {
        adminWallets.push((row.walletAddress as string).toLowerCase());
      });
    } catch (error) {
      console.warn("Could not fetch admin wallets:", error);
    }

    // Process each user with the collected data
    const usersWithDetails = usersQuery.map((user: any) => {
      // Get project count from pre-calculated data
      const projectCount: number = (user.email && projectCountsByEmail[user.email] !== undefined) ? projectCountsByEmail[user.email]! : 0;

      // Check if admin
      const isAdmin: boolean = adminWallets.includes((user.walletAddress as string).toLowerCase());

      // Determine role
      let role: 'admin' | 'applicant' | 'pandorian';
      if (isAdmin) {
        role = 'admin';
      } else if (projectCount > 0) {
        role = 'applicant';
      } else {
        role = 'pandorian';
      }

      // Determine Pandora's Key status - for now, give to all users since it's required to access platform
      // TODO: Implement proper Pandora's Key verification system
      const hasPandorasKey = true; // All users get it until proper verification is implemented

      const result = {
        ...user,
        projectCount,
        role,
        hasPandorasKey
      };

      return result;
    });

    console.log("Users processed with roles and counts");

    const users: UserData[] = usersWithDetails.map((row: any) => ({
      id: row.id as string,
      name: row.name as string | null,
      email: row.email as string | null,
      image: row.image as string | null,
      walletAddress: row.walletAddress as string,
      hasPandorasKey: row.hasPandorasKey as boolean,
      connectionCount: Number(row.connectionCount),
      lastConnectionAt: row.lastConnectionAt as string,
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
