'use server';

import { db } from '@/db';
import { administrators, nexusCollaborators } from '@/db/schema';
import { getNexusAuthContext } from '@/lib/nexus/nexus-rbac';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const VALID_ROLES = ['ADMIN', 'SUPER_ADMIN'];
// Ethereum address: 0x + 40 hex chars
const WALLET_REGEX = /^0x[0-9a-fA-F]{40}$/;

export async function grantAdminPrivilegesAction(formData: FormData) {
  try {
    const auth = await getNexusAuthContext();
    if (auth.role !== 'SUPER_ADMIN') {
      return { error: 'No tienes privilegios de SUPER_ADMIN para otorgar acceso.' };
    }

    const email = (formData.get('email') as string | null)?.trim() || '';
    const role = (formData.get('role') as string | null)?.trim() || '';
    const walletAddress = (formData.get('walletAddress') as string | null)?.trim() || '';

    if (!role || !VALID_ROLES.includes(role)) {
      return { error: `El rol debe ser uno de: ${VALID_ROLES.join(', ')}.` };
    }

    // Modalidad 1: Por Colaborador del Nexus (email)
    if (email) {
      const [collab] = await db
        .select()
        .from(nexusCollaborators)
        .where(eq(nexusCollaborators.email, email.toLowerCase()))
        .limit(1);

      if (!collab) return { error: 'El colaborador no existe en el Nexus.' };

      // Actualizar rol en nexusCollaborators (fuente de verdad de colaboradores)
      await db.update(nexusCollaborators)
        .set({ role })
        .where(eq(nexusCollaborators.email, email.toLowerCase()));

      // Si se provee una wallet adicional, debe ser una dirección ETH válida.
      // El formulario permite esto para asociar la identidad Web3 del colaborador
      // al panel de admin legacy. Se valida que sea una dirección real, no aleatoria.
      if (walletAddress) {
        if (!WALLET_REGEX.test(walletAddress)) {
          return { error: 'La wallet provista no es una dirección Ethereum válida (0x...).' };
        }

        // Check if this wallet is already an admin to avoid duplicate key error
        const [existingAdmin] = await db
          .select({ id: administrators.id })
          .from(administrators)
          .where(eq(administrators.walletAddress, walletAddress))
          .limit(1);

        if (existingAdmin) {
          // Update role instead of inserting duplicate
          await db.update(administrators)
            .set({ role, addedBy: auth.wallet || auth.email || 'Admin' })
            .where(eq(administrators.walletAddress, walletAddress));
        } else {
          await db.insert(administrators).values({
            walletAddress,
            role,
            addedBy: auth.wallet || auth.email || 'Admin',
          });
        }
      }

      revalidatePath('/admin');
      return { success: `Privilegios ${role} otorgados a ${collab.name || email}` };
    }

    // Modalidad 2: Por Wallet Directa (sin colaborador Nexus existente)
    if (walletAddress) {
      if (!WALLET_REGEX.test(walletAddress)) {
        return { error: 'La wallet provista no es una dirección Ethereum válida (0x...).' };
      }

      const [existingAdmin] = await db
        .select({ id: administrators.id })
        .from(administrators)
        .where(eq(administrators.walletAddress, walletAddress))
        .limit(1);

      if (existingAdmin) {
        await db.update(administrators)
          .set({ role, addedBy: auth.wallet || auth.email || 'Admin' })
          .where(eq(administrators.walletAddress, walletAddress));
      } else {
        await db.insert(administrators).values({
          walletAddress,
          role,
          addedBy: auth.wallet || auth.email || 'Admin',
        });
      }

      revalidatePath('/admin');
      return { success: `Privilegios ${role} otorgados a la wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` };
    }

    return { error: 'Debes proveer un Colaborador del Nexus o una Wallet directa.' };
  } catch (error: any) {
    console.error('Error in grantAdminPrivilegesAction:', error);
    return { error: 'Error interno al otorgar privilegios.' };
  }
}
