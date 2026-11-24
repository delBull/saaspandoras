/**
 * 🏛️ Pandora's Hermes OS — Universal Interlocutor & Executive Authority Resolver
 *
 * Resolves the identity of any person contacting Hermes across all four entry surfaces:
 * 1. WhatsApp (Meta Cloud API / twilio / phone matching)
 * 2. Telegram (Bot / MiniApp / Channel Inbound / telegramId & username)
 * 3. Hermes Intelligence (Web / Portal / Authenticated Wallet & Session)
 * 4. Nexus Terminal (Command Center / Super Admin session)
 *
 * Special Powers:
 * - Detects Marco (El Jefe / Fundador de Pandora's Growth OS) across all channels.
 * - Grants Boss Executive Privilege (Zero Restrictions, God-level clearance, Directives intake).
 * - Identifies registered Collaborators & Contacts by name.
 * - Auto-provisions and tags unknown inbound contacts as tracked leads.
 * - Supports dynamic contact registration & business directives directly from the Boss.
 */

import { db } from '@saasfly/db-core';
import { 
  nexusCollaborators, 
  users, 
  telegramBindings, 
  marketingIdentities, 
  channelIdentityBindings, 
  marketingLeads,
  projects 
} from '@saasfly/db-core/schema';
import { eq, or, sql, desc } from "@saasfly/db-core";
import { isAdmin } from '@saasfly/auth-sdk';
// @ts-ignore
import { resolveEffectivePermissions, NexusRole, NexusPermissions } from '@saasfly/shared';
import { FounderCapability, ALL_FOUNDER_CAPABILITIES } from '../executive/types';
import type { CanonicalIdentityRecord } from './canonical-identity-graph';
import type { TenantContextRecord } from './tenant-context-resolver';

export interface InterlocutorQuery {
  channel: 'whatsapp' | 'telegram' | 'web' | 'nexus';
  externalUserId?: string;
  phone?: string;
  telegramId?: string;
  telegramUsername?: string;
  walletAddress?: string;
  email?: string;
  nameHint?: string;
  tenantSlug?: string;
}

export interface ResolvedInterlocutor {
  isBoss: boolean;
  name: string;
  role: string;
  title?: string;
  actorId: string;
  phone?: string;
  telegramId?: string;
  walletAddress?: string;
  email?: string;
  isCollaborator?: boolean;
  isLead?: boolean;
  isNewLead?: boolean;
  isVerified?: boolean;
  nameSource?: 'VERIFIED' | 'SYSTEM_RESOLVED' | 'SELF_DECLARED' | 'ANONYMOUS';
  selfDeclaredName?: string;
  executivePrivilege?: boolean;
  capabilities?: FounderCapability[];
  founderExecutiveMode?: boolean;
  welcomeDirective?: string;
  permissions?: string[];
  tenantSlug?: string;
  canonicalIdentity?: CanonicalIdentityRecord;
  tenantContext?: TenantContextRecord;
}

const ALL_BOSS_PERMISSIONS = [
  '*',
  'users.manage',
  'tenants.manage',
  'finance.manage',
  'growth.manage',
  'marketing.manage',
  'nexus.manage',
  'compliance.manage',
  'calendar.manage',
  'ecosystem',
  'institutionalBooks',
  'schedule.book',
  'portal.view',
  'deal_room.view',
];

function extractGrantedPermissions(perms: NexusPermissions | Record<string, any>): string[] {
  return Object.entries(perms)
    .filter(([_, granted]) => Boolean(granted))
    .map(([perm]) => perm);
}



function cleanDigits(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Canonical phone identity.
 *
 * `prefix` is the country/trunk part the carrier/Meta includes (52, 1, 57…) and
 * `national` is the subscriber number. Mexico's mobile trunk ("1") is folded into
 * +52 so `521XXXXXXXXXX` and `52XXXXXXXXXX` are the same person.
 *
 * Two numbers are the same identity when:
 *  - both are identical in normalized E.164 form, or
 *  - at least one side is stored without a country prefix (a human typing the
 *    local 10 digits) and the national numbers agree.
 *
 * When BOTH sides carry a prefix, the prefixes must agree. That is the fix for
 * the old "last 10 digits" rule, where `+1 322 214 9409` resolved as the Mexican
 * `+52 322 214 9409`.
 */
export interface CanonicalPhone {
  /** Normalized E.164 digits without '+'. */
  e164: string;
  /** Country/trunk prefix as dialed; MX mobile trunk folded into '52'. */
  prefix: string;
  /** Subscriber number (last 10 digits). */
  national: string;
}

/**
 * Country assumed for numbers stored without a prefix. The platform's identity
 * base is Mexican and legacy records (collaborators, leads, pod contacts) are
 * stored as local 10-digit numbers; without an assumption they could never be
 * matched against Meta's international format. Configurable for other regions.
 */
const DEFAULT_PHONE_COUNTRY = cleanDigits(process.env.HERMES_DEFAULT_COUNTRY_CODE) || '52';

export function canonicalPhone(phone?: string | null): CanonicalPhone | null {
  let digits = cleanDigits(phone);
  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length < 8) return null;

  // Mexico: fold the mobile trunk — 52 1 XXX XXX XXXX → 52 XXX XXX XXXX.
  if (digits.length === 13 && digits.startsWith('521')) {
    digits = `52${digits.slice(3)}`;
  }

  // Local subscriber number without a country prefix.
  if (digits.length <= 10) {
    const national = digits.slice(-10);
    return { e164: `${DEFAULT_PHONE_COUNTRY}${national}`, prefix: DEFAULT_PHONE_COUNTRY, national };
  }

  const national = digits.slice(-10);
  const prefix = digits.slice(0, digits.length - 10);
  return { e164: digits, prefix, national };
}

export function phonesShareIdentity(a?: string | null, b?: string | null): boolean {
  const ca = canonicalPhone(a);
  const cb = canonicalPhone(b);
  if (!ca || !cb) return false;
  if (ca.e164 === cb.e164) return true;
  return ca.prefix === cb.prefix && ca.national === cb.national;
}

/**
 * Garantía institucional: TODO contacto registrado por el Boss recibe una
 * directiva de bienvenida personalizada por nombre y rol — aunque Marco no
 * dicte una explícitamente. El contexto específico se puede enriquecer después.
 */
function buildDefaultWelcomeDirective(params: {
  name: string;
  role?: string;
  notes?: string;
  channel?: string;
}): string {
  const name = params.name.trim();
  const role = (params.role || 'LEAD').toUpperCase();
  const persona = role === 'INVESTOR'
    ? 'Cliente potencial → trato V.I.P, calidez institucional, claridad patrimonial, acceso al Deal Room y a la agenda de Technical Discovery.'
    : role === 'COLLABORATOR' || role === 'OPERATOR' || role === 'ADMIN'
      ? 'Colaborador del ecosistema → tono de socio operativo: pregunta su contexto del día, ofrécele Nexus, agenda soberana y Hermes OS como copiloto.'
      : 'Prospecto / contacto de crecimiento → tono cálido-institucional, interés por su objetivo, sin presión, caminos naturales de exploración.';
  return [
    `Bienvenida personalizada para ${name} (registrado por orden ejecutiva del Fundador):`,
    `1. Sálvalo SIEMPRE por su nombre: "${name}". Nunca lo trates como lead frío.`,
    `2. Postura según su rol (${role}): ${persona}`,
    params.notes ? `3. Contexto que Hermes ya conoce: ${params.notes}` : `3. Si aún no conoces su contexto, pregúntale directamente qué lo trajo al ecosistema — escucha antes de vender.`,
    '4. Nunca repitas preguntas de datos básicos si ya están registrados en el ecosistema.',
  ].filter(Boolean).join('\n');
}

export class InterlocutorResolver {
  /**
   * Evaluates whether an identity attribute belongs to the Boss / Founder (Marco).
   */
  static isBossIdentity(params: {
    walletAddress?: string;
    phone?: string;
    telegramId?: string;
    telegramUsername?: string;
    email?: string;
  }): boolean {
    const { walletAddress, phone, telegramId, telegramUsername, email } = params;

    // 1. Wallet check
    if (walletAddress) {
      const lowerWallet = walletAddress.toLowerCase();
      const marcoWallet = (process.env.MARCO_ADMIN_WALLET || '').toLowerCase();
      if (marcoWallet && lowerWallet === marcoWallet) return true;
      const superWallet = (process.env.SUPER_ADMIN_WALLET || process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9').toLowerCase();
      if (superWallet && lowerWallet === superWallet) return true;
    }

    // 2. Phone check (E.164, country-aware). A number from another country that
    //    happens to share the last 10 digits must NOT resolve as the Boss.
    if (phone) {
      const bossPhones = [
        process.env.MARCO_PHONE,
        process.env.FOUNDER_PHONE,
        process.env.BOSS_PHONE,
        ...(process.env.ADMIN_PHONES ? process.env.ADMIN_PHONES.split(',') : []),
        // Documented fallback for the Founder's MX line (keep env override first).
        '523222741987',
        '5213222741987',
        '3222741987',
      ]
        .filter(Boolean)
        .map(p => cleanDigits(p as string));

      if (bossPhones.some(bp => bp && phonesShareIdentity(phone, bp))) {
        return true;
      }
    }

    // 3. Telegram ID / Username check
    if (telegramId) {
      const tid = String(telegramId).trim();
      const bossTgIds = [
        process.env.MARCO_TELEGRAM_ID,
        process.env.FOUNDER_TELEGRAM_ID,
        ...(process.env.ADMIN_TELEGRAM_IDS ? process.env.ADMIN_TELEGRAM_IDS.split(',') : []),
        '798431743', // Marco actual Telegram ID
        '555111222', // Test / canonical founder mock ID
      ]
        .filter(Boolean)
        .map(id => String(id).trim());

      if (bossTgIds.includes(tid)) return true;
    }

    if (telegramUsername) {
      const cleanUser = telegramUsername.toLowerCase().replace(/^@/, '');
      const bossUsernames = [
        (process.env.MARCO_TELEGRAM_USERNAME || '').toLowerCase().replace(/^@/, ''),
        'mardelbull',
        'delbull',
        'operator_marco',
        'marco_pandoras',
      ].filter(Boolean);

      if (bossUsernames.includes(cleanUser)) return true;
    }

    // 4. Email check
    if (email) {
      const cleanEmail = email.toLowerCase().trim();
      const bossEmails = [
        'admin@pandoras.finance',
        'marco.munoz9@gmail.com',
        (process.env.ADMIN_EMAIL || '').toLowerCase().trim(),
        (process.env.NEXUS_ADMIN_EMAIL || '').toLowerCase().trim(),
        ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : []),
      ].filter(Boolean);

      if (bossEmails.includes(cleanEmail)) return true;
    }

    return false;
  }

  /**
   * Omnichannel Resolver: Takes whatever caller data is known and determines
   * who Hermes is talking to, whether it's Marco (The Boss), an active Collaborator,
   * a known Lead, or an unregistered visitor.
   *
   * Grounded in the Universal Identity SDK (F1-F5) and Tenant Context Resolver.
   */
  static async resolve(query: InterlocutorQuery): Promise<ResolvedInterlocutor> {
    const rawPhone = cleanDigits(query.phone || (query.channel === 'whatsapp' ? query.externalUserId : undefined));
    const rawTgId = query.telegramId || (query.channel === 'telegram' ? query.externalUserId : undefined);
    const rawWallet = query.walletAddress?.toLowerCase();
    const rawEmail = query.email?.toLowerCase().trim();
    const rawTgUsername = query.telegramUsername?.toLowerCase().replace(/^@/, '');

    // ── STEP 0: Universal Canonical Identity Grounding (F1-F5) ───────────────
    let canonicalIdentity: CanonicalIdentityRecord | null = null;
    try {
      const { resolveCanonicalIdentity } = await import('./index');
      if (rawWallet) {
        canonicalIdentity = await resolveCanonicalIdentity({ type: 'wallet', value: rawWallet }, { autoCreate: false });
      } else if (rawTgId) {
        canonicalIdentity = await resolveCanonicalIdentity({ type: 'telegram', value: rawTgId }, { autoCreate: false });
      } else if (rawPhone) {
        canonicalIdentity = await resolveCanonicalIdentity({ type: 'phone', value: rawPhone }, { autoCreate: false });
      } else if (rawEmail) {
        canonicalIdentity = await resolveCanonicalIdentity({ type: 'email', value: rawEmail }, { autoCreate: false });
      }
    } catch (canonErr) {
      console.warn('[InterlocutorResolver] Non-blocking canonical identity resolution notice:', canonErr);
    }

    const effectiveWallet = rawWallet || (canonicalIdentity?.identifiers?.wallet ? canonicalIdentity.identifiers.wallet.toLowerCase() : undefined);
    const effectivePhone = rawPhone || (canonicalIdentity?.identifiers?.phone ? cleanDigits(canonicalIdentity.identifiers.phone) : undefined);
    const effectiveEmail = rawEmail || (canonicalIdentity?.identifiers?.email ? canonicalIdentity.identifiers.email.toLowerCase().trim() : undefined);
    const effectiveTgId = rawTgId || (canonicalIdentity?.identifiers?.telegramId ? canonicalIdentity.identifiers.telegramId : undefined);
    const effectiveTgUsername = rawTgUsername;

    const res = await this.resolveInternal({
      ...query,
      walletAddress: effectiveWallet,
      phone: effectivePhone,
      email: effectiveEmail,
      telegramId: effectiveTgId,
      telegramUsername: effectiveTgUsername,
    });

    // ── STEP FINAL: Enrich with Canonical Identity & Authoritative Tenant Context
    res.canonicalIdentity = canonicalIdentity || undefined;
    if (query.tenantSlug) {
      try {
        const { resolveTenantContext } = await import('./index');
        const identityTarget = canonicalIdentity || res.actorId;
        const tenantCtx = await resolveTenantContext(identityTarget, query.tenantSlug);
        if (tenantCtx) {
          res.tenantContext = tenantCtx;
        }
      } catch (tErr) {
        console.warn('[InterlocutorResolver] Error resolving tenantContext:', tErr);
      }
    }

    return res;
  }

  private static async resolveInternal(query: InterlocutorQuery): Promise<ResolvedInterlocutor> {
    const rawPhone = cleanDigits(query.phone || (query.channel === 'whatsapp' ? query.externalUserId : undefined));
    const rawTgId = query.telegramId || (query.channel === 'telegram' ? query.externalUserId : undefined);
    const rawWallet = query.walletAddress?.toLowerCase();
    const rawEmail = query.email?.toLowerCase().trim();
    const rawTgUsername = query.telegramUsername?.toLowerCase().replace(/^@/, '');

    // ── STEP 1: Verify if caller is the Boss (Marco) ─────────────────────────
    const isDirectBoss = this.isBossIdentity({
      walletAddress: rawWallet,
      phone: rawPhone,
      telegramId: rawTgId,
      telegramUsername: rawTgUsername,
      email: rawEmail,
    });

    if (isDirectBoss) {
      return {
        isBoss: true,
        isVerified: true,
        nameSource: 'VERIFIED',
        name: 'Marco',
        role: 'FOUNDER_BOSS',
        title: "Jefe / Fundador de Pandora's Growth OS",
        actorId: 'marco_founder',
        phone: rawPhone || undefined,
        telegramId: rawTgId || undefined,
        walletAddress: rawWallet || process.env.MARCO_ADMIN_WALLET || undefined,
        email: rawEmail || 'admin@pandoras.finance',
        executivePrivilege: true,
        capabilities: ALL_FOUNDER_CAPABILITIES,
        founderExecutiveMode: true,
        permissions: ALL_BOSS_PERMISSIONS,
        tenantSlug: query.tenantSlug,
      };
    }

    // If wallet is known, check database admin status
    if (rawWallet) {
      try {
        const isDbAdmin = await isAdmin(rawWallet);
        if (isDbAdmin) {
          // If it's one of the primary wallets or admin, treat as Boss / Executive
          const isPrimaryAdmin = rawWallet === (process.env.SUPER_ADMIN_WALLET || '').toLowerCase() || rawWallet === (process.env.MARCO_ADMIN_WALLET || '').toLowerCase();
          const adminPerms = isPrimaryAdmin 
            ? ALL_BOSS_PERMISSIONS 
            : extractGrantedPermissions(resolveEffectivePermissions('ADMIN'));

          return {
            isBoss: isPrimaryAdmin,
            name: isPrimaryAdmin ? 'Marco' : (query.nameHint || 'Administrador'),
            role: isPrimaryAdmin ? 'FOUNDER_BOSS' : 'ADMIN',
            title: isPrimaryAdmin ? "Jefe / Fundador de Pandora's Growth OS" : 'Administrador del Ecosistema',
            actorId: isPrimaryAdmin ? 'marco_founder' : `admin_${rawWallet.slice(2, 10)}`,
            walletAddress: rawWallet,
            email: rawEmail,
            executivePrivilege: isPrimaryAdmin,
            capabilities: isPrimaryAdmin ? ALL_FOUNDER_CAPABILITIES : undefined,
            founderExecutiveMode: isPrimaryAdmin,
            permissions: adminPerms,
            tenantSlug: query.tenantSlug,
          };
        }
      } catch (err) {
        console.warn('[InterlocutorResolver] Error checking isAdmin:', err);
      }
    }

    // ── STEP 2: Check Nexus Collaborators (Email OR WhatsApp phone) ──────────
    // The SQL prefilter compares the last 10 digits (cheap, index-less but small
    // table); the authoritative decision is `phonesShareIdentity`, which also
    // requires the country prefix to agree. Without that second pass a foreign
    // number sharing the last 10 digits would resolve as a collaborator.
    const phoneDigits = cleanDigits(rawPhone);
    const phoneSuffix10 = phoneDigits.slice(-10);
    if (rawEmail || phoneSuffix10) {
      try {
        const collabConditions = [];
        if (rawEmail) collabConditions.push(eq(nexusCollaborators.email, rawEmail));
        if (phoneSuffix10) {
          collabConditions.push(sql`right(regexp_replace(coalesce(${nexusCollaborators.whatsappPhone}, ''), '[^0-9]', '', 'g'), 10) = ${phoneSuffix10}`);
        }
        const collabCandidates = await db
          .select({
            id: nexusCollaborators.id,
            name: nexusCollaborators.name,
            email: nexusCollaborators.email,
            role: nexusCollaborators.role,
            permissions: nexusCollaborators.permissions,
            whatsappPhone: nexusCollaborators.whatsappPhone,
          })
          .from(nexusCollaborators)
          .where(or(...collabConditions))
          .limit(5);

        const collab = collabCandidates.find(c => rawEmail && c.email === rawEmail)
          ?? collabCandidates.find(c => c.whatsappPhone && phonesShareIdentity(c.whatsappPhone, phoneDigits));

        if (collabCandidates.length > 0 && !collab) {
          console.warn(
            `[InterlocutorResolver] Phone suffix matched ${collabCandidates.length} collaborator(s) but none is the same identity (country mismatch). Rejecting loose match.`,
          );
        }

        let collabWelcomeDirective: string | undefined;
        try {
          const welcomeLeadConditions = [];
          if (collab?.email) welcomeLeadConditions.push(eq(marketingLeads.email, collab.email));
          if (phoneSuffix10) {
            welcomeLeadConditions.push(sql`right(regexp_replace(coalesce(${marketingLeads.phoneNumber}, ''), '[^0-9]', '', 'g'), 10) = ${phoneSuffix10}`);
          }
          if (welcomeLeadConditions.length > 0) {
            const welcomeLeads = await db
              .select({ phoneNumber: marketingLeads.phoneNumber, metadata: marketingLeads.metadata })
              .from(marketingLeads)
              .where(or(...welcomeLeadConditions))
              .orderBy(desc(marketingLeads.lastEngagementAt))
              .limit(5);
            const welcomeLead = collab?.email
              ? welcomeLeads[0]
              : welcomeLeads.find(l => l.phoneNumber && phonesShareIdentity(l.phoneNumber, phoneDigits));
            collabWelcomeDirective = (welcomeLead?.metadata as any)?.customWelcome || undefined;
          }
        } catch {
          /* non-blocking welcome directive hydration */
        }

        if (collab && collab.id && (collab.name || collab.email)) {
          const isSuperAdminCollab = collab.email === 'admin@pandoras.finance';
          // STRICT SECURITY BOUND: Role and authority are governed by verified channel or explicit RBAC, NEVER by loose name matching
          const isBossCollab = isSuperAdminCollab || 
            this.isBossIdentity({ email: collab.email, phone: rawPhone }) || 
            collab.role === 'OWNER' || 
            collab.role === 'SUPER_ADMIN';
          const collabRole = (collab.role?.toUpperCase() || 'COLLABORATOR') as NexusRole;
          const effectivePerms = isBossCollab 
            ? ALL_BOSS_PERMISSIONS 
            : extractGrantedPermissions(resolveEffectivePermissions(collabRole, collab.permissions as any));

          return {
            isBoss: Boolean(isBossCollab),
            isVerified: true,
            nameSource: 'VERIFIED',
            name: collab.name,
            role: isBossCollab ? 'FOUNDER_BOSS' : collabRole,
            title: isBossCollab ? "Jefe / Fundador de Pandora's Growth OS" : `Colaborador Nexus (${collabRole})`,
            actorId: isBossCollab ? 'marco_founder' : `nexus_collab_${collab.id}`,
            phone: rawPhone,
            email: collab.email,
            isCollaborator: true,
            executivePrivilege: Boolean(isBossCollab),
            permissions: effectivePerms,
            tenantSlug: query.tenantSlug,
            welcomeDirective: collabWelcomeDirective,
          };
        }
      } catch (err) {
        console.warn('[InterlocutorResolver] Error querying nexusCollaborators:', err);
      }
    }

    // ── STEP 3: Check Users Table (Telegram ID, Wallet, or Email) ─────────────
    if (rawTgId || rawWallet || rawEmail || rawTgUsername) {
      try {
        const user = await db.query.users.findFirst({
          where: (u, { or, eq }) => {
            const conditions = [];
            if (rawTgId) conditions.push(eq(u.telegramId, rawTgId));
            if (rawWallet) conditions.push(eq(u.walletAddress, rawWallet));
            if (rawEmail) conditions.push(eq(u.email, rawEmail));
            if (rawTgUsername) conditions.push(eq(u.telegramUsername, rawTgUsername));
            return or(...conditions);
          }
        });

        if (user) {
          // STRICT SECURITY BOUND: Super Admin authority requires verified channel identity or super_admin role, never conversational name matching
          const isSuperAdmin = user.role === 'super_admin' || 
            this.isBossIdentity({
              walletAddress: user.walletAddress ?? undefined,
              email: user.email ?? undefined,
              telegramId: user.telegramId ?? undefined,
              telegramUsername: user.telegramUsername ?? undefined,
            }) ||
            (user.role === 'admin' && (user.walletAddress === (process.env.SUPER_ADMIN_WALLET || '').toLowerCase() || user.walletAddress === (process.env.MARCO_ADMIN_WALLET || '').toLowerCase()));
          const displayName = user.name || user.firstName || user.username || query.nameHint || 'Usuario';

          let canonicalRole = user.role ? user.role.toUpperCase() : 'USER';
          let title = `Usuario Registrado (${user.role})`;
          let perms: string[] = ['portal.view', 'schedule.book'];

          if (isSuperAdmin) {
            canonicalRole = 'FOUNDER_BOSS';
            title = "Jefe / Fundador de Pandora's Growth OS";
            perms = ALL_BOSS_PERMISSIONS;
          } else if (['ADMIN', 'ADMIN_OPERATIONS', 'ADMIN_MARKETING', 'ADMIN_COMPLIANCE', 'TENANT_ADMIN', 'OPERATOR', 'MARKETING', 'VIEWER'].includes(canonicalRole)) {
            const effectivePerms = resolveEffectivePermissions(canonicalRole as NexusRole);
            perms = extractGrantedPermissions(effectivePerms);
            if (canonicalRole === 'ADMIN_OPERATIONS') title = 'Administrador de Operaciones';
            else if (canonicalRole === 'ADMIN_MARKETING') title = 'Administrador de Marketing & Crecimiento';
            else if (canonicalRole === 'ADMIN_COMPLIANCE') title = 'Oficial de Cumplimiento & Seguridad';
            else if (canonicalRole === 'TENANT_ADMIN') title = 'Administrador de Tenant';
          } else if (user.role?.toLowerCase() === 'investor') {
            canonicalRole = 'INVESTOR';
            title = 'Inversionista / Participante Registrado';
            perms = ['portal.view', 'deal_room.view', 'proposals.vote', 'certificates.claim', 'schedule.book'];
          }

          return {
            isBoss: Boolean(isSuperAdmin),
            isVerified: true,
            nameSource: 'VERIFIED',
            name: displayName,
            role: canonicalRole,
            title,
            actorId: isSuperAdmin ? 'marco_founder' : `user_${user.id}`,
            walletAddress: user.walletAddress || undefined,
            telegramId: user.telegramId || rawTgId,
            email: user.email || undefined,
            executivePrivilege: Boolean(isSuperAdmin),
            permissions: perms,
            tenantSlug: query.tenantSlug,
          };
        }
      } catch (err) {
        console.warn('[InterlocutorResolver] Error querying users:', err);
      }
    }

    // ── STEP 4: Check Marketing Leads / Identidades Registradas ────────────────
    if (rawPhone || rawEmail || rawTgId) {
      try {
        const leadConditions = [];
        if (rawPhone) {
          // SQL prefilter by last 10 digits; canonical verification below so a
          // foreign number sharing those digits does not inherit a lead's role.
          const suffix = cleanDigits(rawPhone).slice(-10);
          leadConditions.push(sql`right(regexp_replace(coalesce(${marketingLeads.phoneNumber}, ''), '[^0-9]', '', 'g'), 10) = ${suffix}`);
        }
        if (rawEmail) leadConditions.push(eq(marketingLeads.email, rawEmail));

        const leadCandidates = leadConditions.length > 0
          ? await db
              .select()
              .from(marketingLeads)
              .where(or(...leadConditions))
              .orderBy(desc(marketingLeads.lastEngagementAt))
              .limit(5)
          : [];

        const lead = leadCandidates.find(l => rawEmail && l.email === rawEmail)
          ?? leadCandidates.find(l => l.phoneNumber && phonesShareIdentity(l.phoneNumber, phoneDigits));

        if (lead && lead.name) {
          let role = 'LEAD';
          let title = 'Contacto / Prospecto Registrado';
          let perms = ['schedule.book'];

          if (lead.leadType === 'investor' || lead.intent === 'invest' || (lead.metadata as any)?.isInvestor) {
            role = 'INVESTOR';
            title = 'Inversionista Registrado';
            perms = ['portal.view', 'deal_room.view', 'schedule.book'];
          } else if (lead.leadType === 'buyer') {
            role = 'BUYER';
            title = 'Comprador Registrado';
            perms = ['portal.view', 'schedule.book'];
          } else if (lead.leadType === 'partner') {
            role = 'PARTNER';
            title = 'Partner de Ecosistema';
            perms = ['portal.view', 'schedule.book'];
          }

          const welcomeDirective = (lead.metadata as any)?.customWelcome || undefined;

          return {
            isBoss: false,
            isVerified: Boolean(lead.walletAddress),
            nameSource: 'SYSTEM_RESOLVED',
            name: lead.name,
            role,
            title,
            actorId: `lead_${lead.id}`,
            phone: lead.phoneNumber || rawPhone,
            email: lead.email || rawEmail,
            isLead: true,
            welcomeDirective,
            permissions: perms,
            tenantSlug: query.tenantSlug,
          };
        }
      } catch (err) {
        console.warn('[InterlocutorResolver] Error querying marketingLeads:', err);
      }
    }

    // ── STEP 5: New / Unregistered Inbound Contact ───────────────────────────
    // Auto-register lead so that subsequent messages recognize them by name/channel!
    const effectiveName = query.nameHint || (rawPhone ? `Contacto ${rawPhone.slice(-4)}` : (query.telegramUsername ? `@${query.telegramUsername}` : 'Visitante'));
    const actorId = rawPhone ? `wa_lead_${rawPhone}` : (rawTgId ? `tg_lead_${rawTgId}` : `anon_${Date.now()}`);

    // Non-blocking auto-lead capture (deduped by phone SUFFIX to avoid
    // duplicate anonymous identities for the same person across +52/521/+34 variants)
    try {
      if (rawPhone || rawEmail) {
        const suffix = phoneSuffix10 || (rawPhone ? cleanDigits(rawPhone).slice(-10) : '');
        if (rawPhone && suffix) {
          const dupCount = await db
            .select({ n: sql<number>`count(*)::int` })
            .from(marketingLeads)
            .where(sql`right(regexp_replace(coalesce(${marketingLeads.phoneNumber}, ''), '[^0-9]', '', 'g'), 10) = ${suffix}`);
          if ((dupCount[0]?.n ?? 0) > 0) {
            // Same person already tracked — skip duplicate capture
            return {
              isBoss: false,
              isVerified: false,
              nameSource: 'ANONYMOUS',
              name: effectiveName,
              role: 'NEW_LEAD',
              title: 'Nuevo Contacto',
              actorId,
              phone: rawPhone || undefined,
              telegramId: rawTgId || undefined,
              isNewLead: false,
            };
          }
        }

        // Resolve target project or find any active project to satisfy not-null FK
        let projectId: number | null = null;
        const targetSlug = query.tenantSlug || 'pandoras';
        const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetSlug);
        const proj = await db.query.projects.findFirst({
          where: (p, { or, eq }) => isTargetUuid ? or(eq(p.slug, targetSlug), eq(p.organizationId, targetSlug)) : eq(p.slug, targetSlug),
          columns: { id: true }
        });
        if (proj) {
          projectId = proj.id;
        } else {
          const fallbackProj = await db.query.projects.findFirst({ columns: { id: true } });
          if (fallbackProj) projectId = fallbackProj.id;
        }

        if (projectId) {
          await db.insert(marketingLeads).values({
            projectId,
          name: effectiveName,
          phoneNumber: rawPhone || null,
          email: rawEmail || null,
          origin: query.channel,
          source: `hermes_${query.channel}`,
          status: 'active',
          intent: 'explore',
          metadata: {
            firstSeenAt: new Date().toISOString(),
            channel: query.channel,
            externalUserId: query.externalUserId,
            nameHint: query.nameHint,
          },
        }).onConflictDoNothing();
        }
      }
    } catch (leadErr) {
      console.warn('[InterlocutorResolver] Non-blocking lead auto-capture notice:', leadErr);
    }

    return {
      isBoss: false,
      isVerified: false,
      nameSource: 'ANONYMOUS',
      name: effectiveName,
      role: 'NEW_LEAD',
      title: 'Nuevo Contacto',
      actorId,
      phone: rawPhone || undefined,
      telegramId: rawTgId || undefined,
      isNewLead: true,
      permissions: ['schedule.book'],
      tenantSlug: query.tenantSlug,
    };
  }

  /**
   * Executive Command: Marco (The Boss) instructs Hermes to register a new contact
   * and configure a custom personalized welcome message for them.
   */
  static async registerContactFromBoss(params: {
    name: string;
    phone?: string;
    telegramId?: string;
    telegramUsername?: string;
    email?: string;
    role?: string;
    notes?: string;
    welcomeMessage?: string;
    tenantSlug?: string;
  }): Promise<{ success: boolean; contactId: string; message: string }> {
    const cleanPhone = cleanDigits(params.phone);
    const cleanEmail = params.email?.toLowerCase().trim();
    const role = params.role || 'LEAD';

    let projectId = 1;
    const targetSlug = params.tenantSlug || 'pandoras';
    const p = await db.query.projects.findFirst({
      where: (pr, { or, eq }) => or(eq(pr.slug, targetSlug), eq(pr.organizationId, targetSlug)),
      columns: { id: true }
    });
    if (p) projectId = p.id;

    const isInvestorRole = role.toUpperCase() === 'INVESTOR';

    // 1. Insert into marketingLeads
    const [insertedLead] = await db.insert(marketingLeads).values({
      projectId,
      name: params.name.trim(),
      phoneNumber: cleanPhone || null,
      email: cleanEmail || null,
      leadType: isInvestorRole ? 'investor' : (role.toLowerCase() || 'user_prospect'),
      status: 'active',
      intent: isInvestorRole ? 'invest' : 'explore',
      quality: isInvestorRole ? 'high' : 'medium',
      origin: 'boss_directive',
      source: 'marco_executive_order',
      metadata: {
        registeredByBoss: true,
        isInvestor: isInvestorRole,
        assignedRole: role,
        bossNotes: params.notes,
        customWelcome: params.welcomeMessage || buildDefaultWelcomeDirective(params),
        welcomeDirective: params.welcomeMessage || buildDefaultWelcomeDirective(params),
        telegramId: params.telegramId,
        telegramUsername: params.telegramUsername,
        registeredAt: new Date().toISOString(),
      }
    }).returning({ id: marketingLeads.id });

    // 2. If it's a collaborator/admin, also provision in nexusCollaborators
    const adminCollaboratorRoles = ['COLLABORATOR', 'OPERATOR', 'ADMIN', 'ADMIN_OPERATIONS', 'ADMIN_MARKETING', 'ADMIN_COMPLIANCE'];
    if (adminCollaboratorRoles.includes(role.toUpperCase())) {
      if (cleanEmail) {
        try {
          await db.execute(sql`
            INSERT INTO "nexus_collaborators" ("name", "email", "role", "status", "token", "expires_at", "created_at")
            VALUES (${params.name.trim()}, ${cleanEmail}, ${role.toUpperCase()}, 'ACTIVE', ${`boss_auth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`}, ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}, NOW())
            ON CONFLICT ("email") DO NOTHING;
          `);
        } catch {
          try {
            await db.execute(sql`
              INSERT INTO "nexus_collaborators" ("name", "email", "role", "token", "expires_at", "created_at")
              VALUES (${params.name.trim()}, ${cleanEmail}, ${role.toUpperCase()}, ${`boss_auth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`}, ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}, NOW())
              ON CONFLICT ("email") DO NOTHING;
            `);
          } catch (fallbackErr) {
            console.warn('[InterlocutorResolver] Non-blocking collaborator insertion notice:', fallbackErr);
          }
        }
      }
    }

    const finalContactId = String(insertedLead?.id || 'lead_registered');

    // 🌐 Sovereign Seal: pinea la doctrina de contacto (K25 envelope + CID derivable)
    // al nodo IPFS soberano — audit trail inmutable de qué se le instruyó a Hermes.
    if (insertedLead?.id) {
      import('../identity/contact-doctrine')
        .then(({ sealContactDoctrine }) => sealContactDoctrine(insertedLead.id!, { trigger: 'boss_directive' }))
        .catch((err) => console.warn('[InterlocutorResolver] Non-blocking contact doctrine seal notice:', err?.message));
    }

    return {
      success: true,
      contactId: String(insertedLead?.id || 'lead_registered'),
      message: `Contacto '${params.name}' registrado exitosamente con rol ${role} bajo orden ejecutiva del Fundador Marco.`,
    };
  }

  /**
   * Executive Command: Marco (The Boss) instructs Hermes to promote/convert an existing
   * contact or collaborator into a specific administrator with designated role & permissions.
   */
  static async promoteContactFromBoss(params: {
    targetIdentifier: string;
    targetRole: string;
    permissions?: string[];
    notes?: string;
    tenantSlug?: string;
  }): Promise<{ success: boolean; contactName: string; assignedRole: string; message: string }> {
    const rawTarget = params.targetIdentifier.trim();
    const cleanTargetEmail = rawTarget.toLowerCase().match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
    const cleanTargetPhone = cleanDigits(rawTarget);
    const normalizedRole = params.targetRole.toUpperCase();

    let targetName = rawTarget;
    let targetEmail = cleanTargetEmail;
    let targetWallet: string | null = null;
    let matchedUserId: string | null = null;

    // 1. Search in users table
    try {
      const user = await db.query.users.findFirst({
        where: (u, { or, eq, ilike }) => {
          const conditions = [];
          if (cleanTargetEmail) conditions.push(eq(u.email, cleanTargetEmail));
          if (rawTarget.startsWith('0x')) conditions.push(eq(u.walletAddress, rawTarget.toLowerCase()));
          conditions.push(ilike(u.name, `%${rawTarget}%`));
          return or(...conditions);
        }
      });

      if (user) {
        matchedUserId = user.id;
        targetName = user.name || user.firstName || targetName;
        targetEmail = targetEmail || user.email || undefined;
        targetWallet = user.walletAddress;

        // Update user role in users table
        await db.update(users)
          .set({ role: normalizedRole.toLowerCase() as any })
          .where(eq(users.id, user.id));
      }
    } catch (userErr) {
      console.warn('[InterlocutorResolver] Non-blocking user lookup warning:', userErr);
    }

    // 2. Search & Update in marketingLeads
    try {
      const lead = await db.query.marketingLeads.findFirst({
        where: (l, { or, eq, ilike }) => {
          const conditions = [];
          if (cleanTargetEmail) conditions.push(eq(l.email, cleanTargetEmail));
          if (cleanTargetPhone && cleanTargetPhone.length >= 8) conditions.push(eq(l.phoneNumber, cleanTargetPhone));
          conditions.push(ilike(l.name, `%${rawTarget}%`));
          return or(...conditions);
        }
      });

      if (lead) {
        targetName = lead.name || targetName;
        targetEmail = targetEmail || lead.email || undefined;

        await db.update(marketingLeads)
          .set({
            leadType: normalizedRole.toLowerCase(),
            status: 'active',
            metadata: {
              ...(lead.metadata as any || {}),
              promotedByBoss: true,
              assignedRole: normalizedRole,
              promotedAt: new Date().toISOString(),
              bossNotes: params.notes,
            }
          })
          .where(eq(marketingLeads.id, lead.id));
      }
    } catch (leadErr) {
      console.warn('[InterlocutorResolver] Non-blocking lead promotion warning:', leadErr);
    }

    // 3. Upsert into nexusCollaborators for Nexus & Admin Console access
    if (targetEmail) {
      try {
        await db.execute(sql`
          INSERT INTO "nexus_collaborators" ("name", "email", "role", "status", "token", "expires_at", "created_at")
          VALUES (${targetName}, ${targetEmail}, ${normalizedRole}, 'ACTIVE', ${`nx_boss_promo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`}, ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}, NOW())
          ON CONFLICT ("email") DO UPDATE SET "role" = ${normalizedRole};
        `);
      } catch {
        try {
          await db.execute(sql`
            INSERT INTO "nexus_collaborators" ("name", "email", "role", "token", "expires_at", "created_at")
            VALUES (${targetName}, ${targetEmail}, ${normalizedRole}, ${`nx_boss_promo_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`}, ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)}, NOW())
            ON CONFLICT ("email") DO UPDATE SET "role" = ${normalizedRole};
          `);
        } catch (fallbackErr) {
          console.warn('[InterlocutorResolver] Non-blocking collaborator promotion warning:', fallbackErr);
        }
      }
    }

    return {
      success: true,
      contactName: targetName,
      assignedRole: normalizedRole,
      message: `Contacto '${targetName}' promovido exitosamente al rol '${normalizedRole}' por orden ejecutiva del Fundador Marco.`,
    };
  }

  /**
   * Capability-based authority check (Role != Capability)
   */
  public static hasFounderCapability(
    interlocutor: ResolvedInterlocutor | null | undefined,
    cap: FounderCapability
  ): boolean {
    if (!interlocutor) return false;
    const caps = interlocutor.capabilities || (interlocutor as any).founderCapabilities;
    return Boolean(caps?.includes(cap));
  }
}
