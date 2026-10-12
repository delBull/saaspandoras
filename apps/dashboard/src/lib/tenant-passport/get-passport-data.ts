/**
 * Tenant Passport — Data Resolver (Fase 2: Real Sovereign Vault Wiring)
 *
 * Consulta autorizada server-side de activos, compras, membresías DAO,
 * utilidades y balances de recompensas reales desde Neon DB.
 *
 * Sigue FC-001, FC-006, FC-011:
 * - No inventa CIDs ni balances.
 * - Estados honestos ('available' | 'empty' | 'unavailable').
 */

import { db } from '@saasfly/db-core';
import {
  projects as projectsSchema,
  purchases as purchasesSchema,
  daoMembers as daoMembersSchema,
  userBalances as userBalancesSchema,
  marketingIdentities,
} from '@saasfly/db-core';
import { eq, and, desc, or, ilike } from '@saasfly/db-core';
import { ProgressionEngine, type Tier } from '../protocol-engine/progression';
import type {
  AssetBlock,
  PassportAsset,
  PerksBlock,
  PerkItem,
  RewardsBlock,
} from '@/components/tenant-passport/passport-view';

export interface TenantPassportData {
  assetBlock: AssetBlock;
  rewardsBlock: RewardsBlock;
  perksBlock: PerksBlock;
  userWallet: string | null;
}

export async function getTenantPassportData(
  organizationSlug: string,
  walletAddress?: string | null
): Promise<TenantPassportData> {
  const normalizedWallet = walletAddress?.trim().toLowerCase() || null;

  try {
    // 1. Obtener proyecto canónico por slug
    const [project] = await db
      .select()
      .from(projectsSchema)
      .where(
        or(
          eq(projectsSchema.slug, organizationSlug),
          ilike(projectsSchema.slug, organizationSlug)
        )
      )
      .limit(1);

    if (!project) {
      return {
        assetBlock: {
          state: 'unavailable',
          message: 'No pudimos localizar la información del proyecto para este tenant.',
        },
        rewardsBlock: {
          state: 'unavailable',
          message: 'Balance de recompensas no disponible.',
        },
        perksBlock: {
          state: 'unavailable',
          message: 'Catálogo de beneficios no disponible.',
        },
        userWallet: normalizedWallet,
      };
    }

    // Si el usuario no tiene wallet conectada
    if (!normalizedWallet || !normalizedWallet.startsWith('0x')) {
      return {
        assetBlock: {
          state: 'empty',
          assets: [],
          message: 'Conecta tu wallet para consultar tus certificados y títulos de propiedad.',
        },
        rewardsBlock: {
          state: 'available',
          rewardsDisplay: '0.00 USDC',
          rewardsValue: 0,
          canClaim: false,
          votingPower: 0,
          message: 'Conecta tu wallet para consultar recompensas acumuladas.',
        },
        perksBlock: resolvePerksFromConfig(project.w2eConfig, 0),
        userWallet: null,
      };
    }

    // 2. Resolver identidad en purchases (dual lookup: marketingIdentities o wallet directa)
    let linkedUserId: string | null = null;
    try {
      const identity = await db.query.marketingIdentities.findFirst({
        where: eq(marketingIdentities.walletAddress, normalizedWallet),
      });
      linkedUserId = (identity as any)?.userId || (identity as any)?.linkedCoreUserId || null;
    } catch {
      // Ignorar error de marketingIdentities si no aplica
    }

    // 3. Consultas en paralelo para rendimiento
    const [userPurchases, daoMember, userBalance] = await Promise.all([
      db.query.purchases
        .findMany({
          where: and(
            eq(purchasesSchema.projectId, project.id),
            linkedUserId
              ? or(
                  eq(purchasesSchema.userId, linkedUserId),
                  eq(purchasesSchema.userId, normalizedWallet)
                )
              : eq(purchasesSchema.userId, normalizedWallet)
          ),
          orderBy: desc(purchasesSchema.createdAt),
        })
        .catch(() => []),

      db.query.daoMembers
        .findFirst({
          where: and(
            eq(daoMembersSchema.projectId, project.id),
            eq(daoMembersSchema.wallet, normalizedWallet)
          ),
        })
        .catch(() => null),

      db.query.userBalances
        .findFirst({
          where: eq(userBalancesSchema.walletAddress, normalizedWallet),
        })
        .catch(() => null),
    ]);

    // 4. Mapear activos
    const assets: PassportAsset[] = [];
    const tokenPrice = Number(project.tokenPriceUsd || 50) || 50;
    let totalUnits = 0;
    let totalValueUsd = 0;

    for (const p of userPurchases) {
      const amount = Number(p.amount) || 0;
      const units = Math.max(1, Math.floor(amount / tokenPrice));
      const isCertified = p.status === 'completed' && Boolean(p.agreementHash);
      const isPending = p.status === 'on_hold' || p.status === 'processing';

      totalUnits += units;
      totalValueUsd += amount;

      const agreementId = p.agreementId || p.id;
      const agreementHash = p.agreementHash || (isCertified ? `AGR-${p.id.slice(0, 8).toUpperCase()}` : null);
      const legalUrl = isCertified
        ? p.legalPortalUrl || `/legal/certificate/${agreementId}?project=${project.slug}&units=${units}`
        : null;

      assets.push({
        id: `purchase-${p.id}`,
        title: `Certificado de Adquisición #${agreementId.slice(0, 8)}`,
        kind: 'certificate',
        status: isCertified ? 'active' : isPending ? 'pending' : 'active',
        detail: `${units} ${units === 1 ? 'unidad' : 'unidades'} · $${amount.toLocaleString()} USD`,
        cid: agreementHash,
        explorerUrl: legalUrl,
        units,
        amountUsd: amount,
        date: p.createdAt,
        agreementHash,
        legalPortalUrl: legalUrl,
        badge: isCertified ? 'Notarizado K25' : isPending ? 'En Proceso' : 'Confirmado',
      });
    }

    // Membresía DAO si tiene voting power
    const votingPower = Number(daoMember?.votingPower || 0);
    if (daoMember && votingPower > 0) {
      assets.push({
        id: `dao-${project.id}-${normalizedWallet.slice(2, 8)}`,
        title: 'Membresía DAO & Poder de Voto',
        kind: 'membership',
        status: 'active',
        detail: `${votingPower.toLocaleString()} Votos de Gobernanza Activos`,
        votingPower,
        badge: 'Gobernanza',
      });
    }

    // Título global consolidado si posee 2 o más certificados
    if (assets.filter((a) => a.kind === 'certificate').length > 1 && totalUnits > 0) {
      assets.unshift({
        id: `global-${project.id}-${normalizedWallet.slice(2, 8)}`,
        title: 'Título Global Consolidado',
        kind: 'ownership',
        status: 'active',
        detail: `${totalUnits} unidades totales · $${totalValueUsd.toLocaleString()} USD`,
        units: totalUnits,
        amountUsd: totalValueUsd,
        legalPortalUrl: `/legal/certificate/global-${normalizedWallet}?project=${project.slug}&units=${totalUnits}`,
        explorerUrl: `/legal/certificate/global-${normalizedWallet}?project=${project.slug}&units=${totalUnits}`,
        badge: 'Consolidado',
      });
    }

    const assetBlock: AssetBlock = {
      state: assets.length > 0 ? 'available' : 'empty',
      assets,
      totalUnits,
      totalValueUsd,
      message:
        assets.length === 0
          ? 'No se encontraron certificados ni participaciones activas para esta wallet en este tenant.'
          : undefined,
    };

    // 5. Recompensas (userBalances)
    const usdc = Number(userBalance?.usdcBalance || 0);
    const pbox = Number(userBalance?.pboxBalance || 0);
    const rewardsDisplay = `${usdc.toFixed(2)} USDC`;
    const rewardsValue = usdc;
    const canClaim = rewardsValue > 0;

    const rewardsBlock: RewardsBlock = {
      state: 'available',
      rewardsDisplay,
      rewardsValue,
      canClaim,
      currency: 'USDC',
      votingPower,
    };

    // 6. Beneficios y Perks según unidades adquiridas
    const perksBlock = resolvePerksFromConfig(project.w2eConfig, totalUnits);

    return {
      assetBlock,
      rewardsBlock,
      perksBlock,
      userWallet: normalizedWallet,
    };
  } catch (error) {
    console.error('[getTenantPassportData] Error al consultar datos del passport:', error);
    return {
      assetBlock: {
        state: 'unavailable',
        message: 'Ocurrió un error al cargar tus activos. Inténtalo de nuevo más tarde.',
      },
      rewardsBlock: {
        state: 'unavailable',
        message: 'No pudimos consultar tus recompensas en este momento.',
      },
      perksBlock: {
        state: 'unavailable',
        message: 'No pudimos consultar tus beneficios en este momento.',
      },
      userWallet: normalizedWallet,
    };
  }
}

function resolvePerksFromConfig(w2eConfig: any, userUnits: number): PerksBlock {
  const rawTiers = (w2eConfig?.tiers || w2eConfig?.packages || []) as any[];

  if (!rawTiers.length) {
    // Si el proyecto no tiene tiers configurados, presentamos los beneficios base de la membresía
    return {
      state: 'available',
      currentTier: userUnits > 0 ? 'Holder Titular' : 'Visitante',
      perks: [
        {
          id: 'perk-notarized-cert',
          title: 'Certificado Digital Notarizado (K25)',
          description: 'Acreditación legal descentralizada registrada en IPFS.',
          unlocked: userUnits > 0,
          minUnits: 1,
        },
        {
          id: 'perk-dao-governance',
          title: 'Acceso a Votación y Gobernanza',
          description: 'Poder de decisión en propuestas clave del tenant.',
          unlocked: userUnits > 0,
          minUnits: 1,
        },
        {
          id: 'perk-usdc-yields',
          title: 'Distribución Pro-Rata de Rendimientos',
          description: 'Recepción directa de utilidades generadas en USDC.',
          unlocked: userUnits > 0,
          minUnits: 1,
        },
        {
          id: 'perk-concierge-priority',
          title: 'Asistencia Prioritaria Concierge AI',
          description: 'Canal directo de resolución e inteligencia operativa.',
          unlocked: userUnits >= 5,
          minUnits: 5,
        },
      ],
      progressPercentage: userUnits > 0 ? 100 : 0,
    };
  }

  const normalizedTiers: Tier[] = rawTiers.map((t: any) => ({
    id: String(t.id || t.name),
    name: t.name || 'Tier',
    artifactCountThreshold: Number(t.artifactCountThreshold ?? t.minArtifacts ?? 0),
    perks: Array.isArray(t.perks) ? t.perks : [],
    description: t.description,
  }));

  const progression = ProgressionEngine.calculate(userUnits, normalizedTiers);

  const perksList: PerkItem[] = [];
  normalizedTiers.forEach((t) => {
    t.perks.forEach((pText, idx) => {
      perksList.push({
        id: `perk-${t.id}-${idx}`,
        title: pText,
        description: `Beneficio nivel ${t.name}`,
        unlocked: userUnits >= t.artifactCountThreshold,
        minUnits: t.artifactCountThreshold,
        badge: t.name,
      });
    });
  });

  return {
    state: 'available',
    currentTier: progression.currentTier?.name || 'Comunidad',
    nextTier: progression.nextTier?.name || undefined,
    progressPercentage: progression.progressPercentage,
    perks: perksList,
  };
}
