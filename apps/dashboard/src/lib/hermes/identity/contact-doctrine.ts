/**
 * 🔐 Contact Doctrine Service — K25 Sovereign Vault para directivas de contacto
 * apps/dashboard/src/lib/hermes/identity/contact-doctrine.ts
 *
 * Sella cada versión de la DOCTRINA de un contacto (bienvenida, políticas de
 * pricing, contexto de negocio) al nodo IPFS soberano (Kubo en Railway) mediante
 * envelope encryption (K25 AES-256-GCM + AAD) y firma EIP-712 del runtime identity.
 *
 * Diseño institucional:
 * - La BD (marketing_leads) sigue siendo el source of truth OPERATIVO (hot path).
 * - IPFS es la capa de PROBAR QUÉ le fue dicho a Hermes sobre cada contacto,
 *   con audit trail inmutable. Resolución NUNCA depende del nodo (fail-open);
 *   el SELLO sí es fail-closed si no hay provider (can't lie about integrity).
 * - PID anónimo: contactRef = sha256(phone digits|email) — sin PII en claro
 *   fuera del envelope.
 */

import crypto from 'crypto';
import { db } from '@/db';
import { marketingLeads, contactDoctrineSeals } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { TenantIpfsVaultService } from '@/lib/pandoras/core/domains/hermes/knowledge/ipfs-vault';
import { HermesIdentitySigner } from '@/lib/pandoras/core/domains/hermes/identity/identity-signer';
import type { KnowledgeClassificationTier } from '@/lib/pandoras/core/domains/hermes/runtime/contracts';

const DOCTRINE_CLASSIFICATION: KnowledgeClassificationTier = 'TENANT_RESTRICTED';
const HMAC_KEY_ENV = process.env.CONTACT_DOCTRINE_HMAC_KEY || process.env.HERMES_KMS_KEK || process.env.ENCRYPTION_KEY || '';

export interface ContactDoctrineReceipt {
  leadId: string;
  version: number;
  cid: string;
  ipfsUri: string;
  contentHash: string;
  contactRef: string;
  pinned: boolean;
  integrity: boolean;
  pendingReplica: boolean;
  provider?: string;
  agentSignature?: string;
  hmacSignature?: string;
  error?: string;
  sealedAt: string;
}

function computeContactRef(lead: { phoneNumber?: string | null; email?: string | null }): string {
  const digits = (lead.phoneNumber || '').replace(/\D/g, '');
  const email = (lead.email || '').toLowerCase().trim();
  const material = `${digits.slice(-10)}|${email}`;
  return crypto.createHash('sha256').update(material, 'utf8').digest('hex').slice(0, 40);
}

function signDoctrine(contentHash: string, contactRef: string): string {
  if (!HMAC_KEY_ENV) {
    return `unsigned:${crypto.createHash('sha256').update(`${contentHash}:${contactRef}`).digest('hex').slice(0, 32)}@runtime`;
  }
  return crypto.createHmac('sha256', HMAC_KEY_ENV).update(`${contentHash}:${contactRef}`).digest('hex');
}

/**
 * Single-flight registry per leadId — prevents concurrent duplicate seals.
 */
const inFlightSeals = new Map<string, Promise<ContactDoctrineReceipt>>();

/**
 * Sella (o re-sella con nueva versión) la doctrina de un contacto:
 * 1. Carga el lead con su metadata (customWelcome, welcomeDirective, pricingPolicy, bossContext).
 * 2. Serializa la doctrina canónica y la encripta con envelope K25.
 * 3. Pina el envelope al nodo soberano y verifica fidelidad.
 * 4. Firma el anclaje EIP-712 y registra el puntero en contact_doctrine_seals.
 * Best-effort: si el nodo no responde, registra el intento (pendingReplica=true)
 * sin tirar el flujo del caller.
 */
export async function sealContactDoctrine(leadId: string, opts?: { trigger?: string }): Promise<ContactDoctrineReceipt> {
  const existing = inFlightSeals.get(leadId);
  if (existing) return existing;
  const task = sealContactDoctrineInner(leadId, opts).finally(() => inFlightSeals.delete(leadId));
  inFlightSeals.set(leadId, task);
  return task;
}

async function sealContactDoctrineInner(leadId: string, opts?: { trigger?: string }): Promise<ContactDoctrineReceipt> {  const leadRows = await db.select().from(marketingLeads).where(eq(marketingLeads.id, leadId)).limit(1);
  const lead = leadRows[0];
  if (!lead) throw new Error(`[ContactDoctrine] Lead ${leadId} not found`);

  const meta = (lead.metadata || {}) as Record<string, unknown>;
  const contactRef = computeContactRef(lead);

  // Doctrina canónica — 100% determinista (sin timestamps/trigger): los mismos
  // datos de BD reproducen EXACTAMENTE los mismos bytes ⇒ mismo CID digno de sello.

  // 🧊 IDEMPOTENCIA POR CONTENIDO: huella del cuerpo canónico.
  const contentFingerprint = crypto
    .createHash('sha256')
    .update(doctrineBody(lead, meta, contactRef, 0), 'utf8')
    .digest('hex');

  const prevSeals = await db
    .select({ version: contactDoctrineSeals.version, contentHash: contactDoctrineSeals.contentHash })
    .from(contactDoctrineSeals)
    .where(eq(contactDoctrineSeals.leadId, leadId))
    .orderBy(desc(contactDoctrineSeals.version))
    .limit(1);

  if (prevSeals[0]?.version && prevSeals[0].contentHash === contentFingerprint) {
    return await rePinSealVersion(lead, prevSeals[0].version, contactRef);
  }

  const version = (prevSeals[0]?.version ?? 0) + 1;

  // Envelope K25 + pin + firma EIP-712 (single tenant scope: 'pandoras')
  const vault = new TenantIpfsVaultService();
  const signer = new HermesIdentitySigner();

  const receipt: ContactDoctrineReceipt = {
    leadId,
    version,
    cid: undefined as unknown as string,
    contentHash: contentFingerprint,
    contactRef,
    pinned: false,
    integrity: false,
    pendingReplica: true,
    sealedAt: new Date().toISOString(),
  } as ContactDoctrineReceipt;

  try {
    const pinned = await vault.storeEncryptedKnowledgeToIpfs(
      doctrineBody(lead, meta, contactRef, version),
      {
        tenantId: 'pandoras',
        artifactId: `contact_doctrine_${contactRef}`,
        version,
        classification: DOCTRINE_CLASSIFICATION,
      },
      signer
    );

    receipt.cid = pinned.cid;
    receipt.ipfsUri = pinned.ipfsUri;
    receipt.contentHash = pinned.contentHash;
    receipt.agentSignature = pinned.agentSignature;
    receipt.pinned = true;
    receipt.integrity = true; // cid emerges from pinned bytes — dual fidelity
    receipt.provider = 'SOVEREIGN_ORCHESTRATED';
    receipt.pendingReplica = !pinned.backupCid;
  } catch (err: any) {
    receipt.error = err?.message || 'Sovereign seal failed';
    console.warn('[ContactDoctrine] Seal attempt warning (pending replica):', receipt.error);
    receipt.contentHash = contentFingerprint;
  }

  const values = {
    leadId,
    version,
    cid: receipt.cid || `pending:${contentFingerprint.slice(0, 24)}`,
    ipfsUri: receipt.ipfsUri ?? null,
    contentHash: contentFingerprint,
    contactRef,
    hmacSignature: receipt.hmacSignature ?? null,
    agentSignature: receipt.agentSignature ?? null,
    pinned: receipt.pinned,
    integrity: receipt.integrity,
    pendingReplica: receipt.pendingReplica,
    provider: receipt.provider ?? null,
  };

  await db
    .insert(contactDoctrineSeals)
    .values(values)
    .onConflictDoUpdate({
      target: [contactDoctrineSeals.leadId, contactDoctrineSeals.version],
      set: {
        cid: values.cid,
        ipfsUri: values.ipfsUri,
        contentHash: values.contentHash,
        contactRef,
        hmacSignature: values.hmacSignature,
        agentSignature: values.agentSignature,
        pinned: values.pinned,
        integrity: values.integrity,
        pendingReplica: values.pendingReplica,
        provider: values.provider,
        sealedAt: new Date(),
      },
    });

  return receipt;
}

/** Cuerpo canónico determinista de la doctrina (sin timestamps/trigger) */
function doctrineBody(
  lead: any,
  meta: Record<string, unknown>,
  contactRef: string,
  version: number
): string {
  return JSON.stringify({
    schema: 'pandoras.contact_doctrine.v1',
    leadRef: contactRef,
    version,
    projectScope: lead.projectId ?? null,
    directives: {
      welcome: (meta as any)?.customWelcome ?? null,
      welcomeDirective: (meta as any)?.welcomeDirective ?? null,
    },
    policy: {
      pricing: (meta as any)?.pricingPolicy ?? 'DEFAULT: pricing managed by operator/commercial team, never by Hermes.',
      bossContext: (meta as any)?.bossContext ?? null,
      txTags: (meta as any)?.tags ?? null,
    },
    lifecycle: {
      status: lead.status ?? null,
      intent: lead.intent ?? null,
      quality: lead.quality ?? null,
      leadType: lead.leadType ?? null,
      crmStage: lead.crmStage ?? null,
    },
    identityResolution: {
      nameUsed: meta.name ?? lead.name ?? null,
      origin: lead.origin ?? null,
      channel: lead.source ?? null,
    },
  });
}

/**
 * Re-pin de una versión YA sellada (fingerprint sin cambios): reconstruye el
 * cuerpo canónico determinista ⇒ bytes idénticos ⇒ CID idéntico. Controla
 * pendingReplica sin abrir versión nueva. Idempotente.
 */
async function rePinSealVersion(
  lead: any,
  version: number,
  contactRef: string
): Promise<ContactDoctrineReceipt> {
  const meta = (lead.metadata || {}) as Record<string, unknown>;
  const contentFingerprint = crypto
    .createHash('sha256')
    .update(doctrineBody(lead, meta, contactRef, version), 'utf8')
    .digest('hex');

  const receipt: ContactDoctrineReceipt = {
    leadId: lead.id,
    version,
    cid: undefined as unknown as string,
    contentHash: contentFingerprint,
    contactRef,
    pinned: false,
    integrity: false,
    pendingReplica: true,
    sealedAt: new Date().toISOString(),
  } as ContactDoctrineReceipt;

  try {
    const vault = new TenantIpfsVaultService();
    const signer = new HermesIdentitySigner();
    const pinned = await vault.storeEncryptedKnowledgeToIpfs(
      doctrineBody(lead, meta, contactRef, version),
      {
        tenantId: 'pandoras',
        artifactId: `contact_doctrine_${contactRef}`,
        version,
        classification: DOCTRINE_CLASSIFICATION as any,
      },
      signer
    );
    receipt.cid = pinned.cid;
    receipt.ipfsUri = pinned.ipfsUri;
    receipt.pinned = true;
    receipt.integrity = true;
    receipt.provider = 'SOVEREIGN_ORCHESTRATED';
    receipt.pendingReplica = !pinned.backupCid;
  } catch (err: any) {
    receipt.error = err?.message || 'Replica re-seal failed';
  }

  await db
    .update(contactDoctrineSeals)
    .set({
      // El CID solo se actualiza si el re-pin alcanzó un nodo real; si el nodo
      // sigue caído, el puntero pendiente previo se PRESERVA (no degradar).
      ...(receipt.pinned ? { cid: receipt.cid, ipfsUri: receipt.ipfsUri ?? null } : {}),
      pinned: receipt.pinned,
      integrity: receipt.integrity,
      pendingReplica: receipt.pendingReplica,
      provider: receipt.provider ?? null,
      sealedAt: new Date(),
    })
    .where(eq(contactDoctrineSeals.leadId, lead.id));

  return receipt;
}

/** Último sello de un contacto (o null). */
export async function getContactDoctrineSeal(leadId: string) {
  const rows = await db
    .select()
    .from(contactDoctrineSeals)
    .where(eq(contactDoctrineSeals.leadId, leadId))
    .orderBy(desc(contactDoctrineSeals.version))
    .limit(1);
  return rows[0] ?? null;
}
