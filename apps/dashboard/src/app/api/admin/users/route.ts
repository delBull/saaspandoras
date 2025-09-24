/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment */
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
          '/images/avatars/rasta.png',
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
        "createdAt",
        "kycLevel",
        "kycCompleted",
        "kycData"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);

    console.log("Users query result:", usersQuery.length, "users found");

    // Get comprehensive project counts - MORE ROBUST COUNTING SYSTEM
    const projectCountsByEmail: Record<string, number> = {};
    const totalProjectsInDb = { count: 0 };

    try {
      console.log("🔢 Fetching comprehensive project counts...");

      // First get total projects for super admin calculation
      const totalQuery = await db.execute(sql`SELECT COUNT(*) as count FROM "projects"`);
      totalProjectsInDb.count = Number(totalQuery[0]?.count as string);
      console.log("📊 Total projects in DB:", totalProjectsInDb.count);

      // Get projects by applicant email (original logic)
      const applicantProjects = await db.execute(sql`
        SELECT
          "applicant_email" as applicantEmail,
          COUNT(*) as count,
          STRING_AGG("status", ', ') as statuses,
          COUNT(CASE WHEN "status" IN ('draft', 'pending', 'approved', 'live', 'completed', 'incomplete', 'rejected') THEN 1 END) as all_status_count
        FROM "projects"
        WHERE "applicant_email" IS NOT NULL AND "applicant_email" != ''
        GROUP BY "applicant_email"
      `);

      console.log("📧 Projects by applicant email:", applicantProjects.length);
      console.log("Available project emails:", applicantProjects.map((p: any) =>
        `"${p.applicantEmail}" (${p.all_status_count} total)`
      ).join(', '));

      // Store comprehensive counts: ALL PROJECTS regardless of status (draft→rejected)
      applicantProjects.forEach((row: any) => {
        const email = row.applicantEmail as string;
        const allStatusCount = Number(row.all_status_count);
        projectCountsByEmail[email] = allStatusCount;
        console.log(`📈 ${email}: ${allStatusCount} projects (${row.statuses})`);
      });

      console.log("🎯 Final project counts by email:", projectCountsByEmail);

    } catch (error) {
      console.warn("⚠️ Could not fetch comprehensive project counts:", error);
    }

    // Get all admin wallets for role detection (incluyendo super admins hardcodeados)
    const SUPER_ADMIN_WALLETS = [
      '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9' // Tú - siempre admin
    ].map(addr => addr.toLowerCase());

    const adminWallets: string[] = [];
    try {
      const adminQuery = await db.execute(sql`
        SELECT "wallet_address" FROM "administrators"
      `);
      adminQuery.forEach((row: any) => {
        adminWallets.push((row.wallet_address as string).toLowerCase());
      });
    } catch (error) {
      console.warn("Could not fetch admin wallets:", error);
    }

    // Combinar super admins con admins de BD
    const ALL_ADMIN_WALLETS = [...SUPER_ADMIN_WALLETS, ...adminWallets];
    console.log('📊 Total admin wallets for role detection:', ALL_ADMIN_WALLETS.length, ALL_ADMIN_WALLETS);

    // Process each user with the collected data
    const usersWithDetails = usersQuery.map((user: any) => {
      const userWallet = (user.walletAddress as string).toLowerCase();
      // Check for SUPER admin wallet address directly (case sensitive check)
      const isSuperAdmin = user.walletAddress === '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9';
      const isAdmin = ALL_ADMIN_WALLETS.includes(userWallet);

      // Enhanced logging for debugging
      console.log(`🔍 Processing user ${userWallet.substring(0, 8)}...`);
      console.log(`   Wallet: ${user.walletAddress}`);
      console.log(`   Email: ${user.email || 'null'}`);
      console.log(`   Is super admin: ${isSuperAdmin}`);
      console.log(`   Is admin (any): ${isAdmin}`);

      // For super admins (YOU), show total project count ALWAYS
      // For regular admins, show projects with their email
      // For regular users, show only their projects
      let projectCount: number;
      if (isSuperAdmin) {
        projectCount = totalProjectsInDb.count; // Super admin sees ALL projects in system
        console.log(`   ✅ FORCE SUPER ADMIN: Assigning ${projectCount} total projects`);
      } else {
        // Check if user has projects via email
        const userEmail = user.email;
        if (userEmail && projectCountsByEmail[userEmail] !== undefined) {
          projectCount = projectCountsByEmail[userEmail]!;
          console.log(`   📧 EMAIL MATCH: ${projectCount} projects for ${userEmail}`);
        } else {
          projectCount = 0;
          console.log(`   ❌ No projects found via email or admin status`);
        }
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

      // Determine Pandora's Key status - for now, give to all users since it's required to access platform
      // TODO: Implement proper Pandora's Key verification system
      const hasPandorasKey = true; // All users get it until proper verification is implemented

      console.log(`   Final: Count=${projectCount}, Role=${role}, Key=${hasPandorasKey}`);
      console.log(`   ---`);

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
      id: (row as Record<string, unknown>).id as string,
      name: (row as Record<string, unknown>).name as string | null,
      email: (row as Record<string, unknown>).email as string | null,
      image: (row as Record<string, unknown>).image as string | null,
      walletAddress: (row as Record<string, unknown>).walletAddress as string,
      hasPandorasKey: (row as Record<string, unknown>).hasPandorasKey as boolean,
      connectionCount: Number((row as Record<string, unknown>).connectionCount),
      lastConnectionAt: (row as Record<string, unknown>).lastConnectionAt as string,
      createdAt: (row as Record<string, unknown>).createdAt as string,
      role: (row as Record<string, unknown>).role as UserRole,
      projectCount: Number((row as Record<string, unknown>).projectCount),
      kycLevel: (row as Record<string, unknown>).kycLevel as 'basic' | 'advanced',
      kycCompleted: (row as Record<string, unknown>).kycCompleted as boolean,
      kycData: (row as Record<string, unknown>).kycData as any || null,
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
