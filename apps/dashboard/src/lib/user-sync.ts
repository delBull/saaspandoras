import { db } from '~/db';
import { sql } from 'drizzle-orm';

export async function syncThirdwebUser(userData: {
  walletAddress: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}) {
  try {
    console.log('🔄 Syncing Thirdweb user:', userData.walletAddress);

    // Leer TODAS las wallets admin de la tabla administrators automáticamente
    const adminWallets = await db.execute(sql`
      SELECT "walletAddress", "alias" FROM "administrators"
    `);

    console.log('📊 Admin wallets in DB:', adminWallets.length);
    adminWallets.forEach((admin: any) => {
      console.log('📊 Admin wallet:', admin.walletAddress, 'alias:', admin.alias);
    });

    const ADMIN_WALLETS = adminWallets.map(row => (row.walletAddress as string).toLowerCase());
    const isSystemAdmin = ADMIN_WALLETS.includes(userData.walletAddress.toLowerCase());

    console.log('📊 Current user wallet:', userData.walletAddress, 'Is admin?', isSystemAdmin, 'Has email?', userData.email, 'Has name?', userData.name);

    // Verificar si usuario existe
    const existing = await db.execute(sql`
      SELECT id, "connectionCount" FROM "User" WHERE "walletAddress" = ${userData.walletAddress}
    `);

    if (existing.length > 0) {
      // ✅ Usuario existe - INCREMENTAR conexiones + actualizar datos
      const currentCount = Number(existing[0]?.connectionCount as string);
      const newCount = currentCount + 1;

      await db.execute(sql`
        UPDATE "User"
        SET "name" = COALESCE(${userData.name}, "name"),
            "email" = COALESCE(${userData.email}, "email"),
            "image" = COALESCE(${userData.image}, "image"),
            "connectionCount" = ${newCount},
            "lastConnectionAt" = NOW()
        WHERE "walletAddress" = ${userData.walletAddress}
      `);

      console.log('✅ User updated - New connection count:', newCount);

      // Si es admin del sistema pero no está en la tabla administrators, agregarlo automáticamente
      if (isSystemAdmin) {
        const adminExists = await db.execute(sql`
          SELECT COUNT(*) as count FROM "administrators" WHERE "walletAddress" = ${userData.walletAddress}
        `);

        if (Number(adminExists[0]?.count as string) === 0) {
          await db.execute(sql`
            INSERT INTO "administrators" ("walletAddress", "alias", "role", "addedBy", "createdAt")
            VALUES (${userData.walletAddress}, 'System Admin', 'admin', 'system', NOW())
          `);
          console.log('✅ Admin privileges granted automatically');
        }
      }

    } else {
      // ❌ Usuario no existe - CREAR nuevo
      await db.execute(sql`
        INSERT INTO "User" ("id", "walletAddress", "email", "name", "image", "hasPandorasKey", "connectionCount", "lastConnectionAt", "createdAt")
        VALUES (
          ${crypto.randomUUID()},
          ${userData.walletAddress},
          ${userData.email || null},
          ${userData.name || null},
          ${userData.image || null},
          ${isSystemAdmin},  -- Admins automáticamente tienen Pandora's Key
          1,
          NOW(),
          NOW()
        )
      `);

      console.log('✅ New user created from Thirdweb auth - wallet:', userData.walletAddress);

      // Verificar después de crear que existe
      const verifyCreate = await db.execute(sql`SELECT COUNT(*) as count FROM "User" WHERE "walletAddress" = ${userData.walletAddress}`);
      console.log('✅ User creation verification - count:', Number(verifyCreate[0]?.count as string));

      // Si es admin del sistema, agregarlo automáticamente a administradores
      if (isSystemAdmin) {
        await db.execute(sql`
          INSERT INTO "administrators" ("walletAddress", "alias", "role", "addedBy", "createdAt")
          VALUES (${userData.walletAddress}, 'System Admin', 'admin', 'system', NOW())
        `);
        console.log('✅ Admin privileges granted automatically for new user');
      }
    }
  } catch (error) {
    console.error('❌ Error syncing user:', error);
  }
}
