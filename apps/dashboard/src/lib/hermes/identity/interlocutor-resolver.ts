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

import { db } from '@/db';
import { 
  nexusCollaborators, 
  users, 
  telegramBindings, 
  marketingIdentities, 
  channelIdentityBindings, 
  marketingLeads,
  projects 
} from '@/db/schema';
import { eq, or, sql, desc } from 'drizzle-orm';
import { isAdmin } from '@/lib/auth';
import { resolveEffectivePermissions, NexusRole, NexusPermissions } from '@/lib/nexus/nexus-rbac';
import { FounderCapability, ALL_FOUNDER_CAPABILITIES } from '../executive/types';

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
  executivePrivilege?: boolean;
  capabilities?: FounderCapability[];
  founderExecutiveMode?: boolean;
  welcomeDirective?: string;
  permissions?: string[];
  tenantSlug?: string;
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

const CANONICAL_ADMIN_WALLETS = [
  '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
  '0x00c9f7ee9252cbe5eb7b370605a9b7c44756f40b',
  '0x121a897f0f5a9b7c44756f40bdb2c8e87d2834fa',
  '0x96631d6c5295f1f08334888c5d6f3a246fa9c3ba',
];

function cleanDigits(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '');
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
      if (CANONICAL_ADMIN_WALLETS.includes(lowerWallet)) return true;
      const marcoWallet = (process.env.MARCO_ADMIN_WALLET || '').toLowerCase();
      if (marcoWallet && lowerWallet === marcoWallet) return true;
      const superWallet = (process.env.SUPER_ADMIN_WALLET || process.env.NEXT_PUBLIC_SUPER_ADMIN_WALLET || '').toLowerCase();
      if (superWallet && lowerWallet === superWallet) return true;
    }

    // 2. Phone check (E.164 digits)
    if (phone) {
      const digits = cleanDigits(phone);
      const bossPhones = [
        process.env.MARCO_PHONE,
        process.env.FOUNDER_PHONE,
        process.env.BOSS_PHONE,
        ...(process.env.ADMIN_PHONES ? process.env.ADMIN_PHONES.split(',') : []),
        '523222741987', // Known institutional phone
      ]
        .filter(Boolean)
        .map(p => cleanDigits(p));

      if (bossPhones.some(bp => bp && (digits.endsWith(bp) || bp.endsWith(digits)))) {
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
   */
  static async resolve(query: InterlocutorQuery): Promise<ResolvedInterlocutor> {
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
        name: 'Marco',
        role: 'FOUNDER_BOSS',
        title: "Jefe / Fundador de Pandora's Growth OS",
        actorId: 'marco_founder',
        phone: rawPhone || undefined,
        telegramId: rawTgId || undefined,
        walletAddress: rawWallet || '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
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
          const isPrimaryAdmin = CANONICAL_ADMIN_WALLETS.includes(rawWallet) || rawWallet === (process.env.MARCO_ADMIN_WALLET || '').toLowerCase();
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
    // Phone matching is SUFFIX-based (last 10 digits) to absorb regional variants:
    // Meta Cloud API delivers MX numbers as '521XXXXXXXXXX' while collaborators
    // may be stored as '+52XXXXXXXXXX' — exact equality would break resolution.
    const phoneDigits = cleanDigits(rawPhone);
    const phoneSuffix10 = phoneDigits.slice(-10);
    if (rawEmail || phoneSuffix10) {
      try {
        const collabConditions = [];
        if (rawEmail) collabConditions.push(eq(nexusCollaborators.email, rawEmail));
        if (phoneSuffix10) {
          collabConditions.push(sql`right(regexp_replace(coalesce(${nexusCollaborators.whatsappPhone}, ''), '[^0-9]', '', 'g'), 10) = ${phoneSuffix10}`);
        }
        let collab: any = await db
          .select({
            id: nexusCollaborators.id,
            name: nexusCollaborators.name,
            email: nexusCollaborators.email,
            role: nexusCollaborators.role,
            permissions: nexusCollaborators.permissions,
          })
          .from(nexusCollaborators)
          .where(or(...collabConditions))
          .limit(1);

        let collabWelcomeDirective: string | undefined;
        try {
          const welcomeLeadConditions = [];
          if (collab?.email) welcomeLeadConditions.push(eq(marketingLeads.email, collab.email));
          if (phoneSuffix10) {
            welcomeLeadConditions.push(sql`right(regexp_replace(coalesce(${marketingLeads.phoneNumber}, ''), '[^0-9]', '', 'g'), 10) = ${phoneSuffix10}`);
          }
          if (welcomeLeadConditions.length > 0) {
            const [welcomeLead] = await db
              .select({ metadata: marketingLeads.metadata })
              .from(marketingLeads)
              .where(or(...welcomeLeadConditions))
              .orderBy(desc(marketingLeads.lastEngagementAt))
              .limit(1);
            collabWelcomeDirective = (welcomeLead?.metadata as any)?.customWelcome || undefined;
          }
        } catch {
          /* non-blocking welcome directive hydration */
        }

        if (collab && collab.id && (collab.name || collab.email)) {
          const isSuperAdminCollab = collab.email === 'admin@pandoras.finance';
          const isBossCollab = isSuperAdminCollab || (collab.name && collab.name.toLowerCase().includes('marco'));
          const collabRole = (collab.role?.toUpperCase() || 'COLLABORATOR') as NexusRole;
          const effectivePerms = isBossCollab 
            ? ALL_BOSS_PERMISSIONS 
            : extractGrantedPermissions(resolveEffectivePermissions(collabRole, collab.permissions as any));

          return {
            isBoss: Boolean(isBossCollab),
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
          const isSuperAdmin = user.role === 'super_admin' || user.role === 'admin' && (CANONICAL_ADMIN_WALLETS.includes(user.walletAddress || '') || user.name?.toLowerCase().includes('marco'));
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
        const lead = await db.query.marketingLeads.findFirst({
          where: (l, { or, eq }) => {
            const conditions = [];
            if (rawPhone) {
              // Suffix-based phone matching (last 10 digits) — absorbs +52/521/523/+34 regional variants
              const suffix = cleanDigits(rawPhone).slice(-10);
              conditions.push(sql`right(regexp_replace(coalesce(${marketingLeads.phoneNumber}, ''), '[^0-9]', '', 'g'), 10) = ${suffix}`);
            }
            if (rawEmail) conditions.push(eq(l.email, rawEmail));
            return or(...conditions);
          },
          orderBy: [desc(marketingLeads.lastEngagementAt)]
        });

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

        // Resolve target project or fallback to pandoras / snarai
        let projectId = 17; // S'Narai default or Pandoras
        if (query.tenantSlug) {
          const proj = await db.query.projects.findFirst({
            where: (p, { or, eq }) => or(eq(p.slug, query.tenantSlug!), eq(p.organizationId, query.tenantSlug!)),
            columns: { id: true }
          });
          if (proj) projectId = proj.id;
        }

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
    } catch (leadErr) {
      console.warn('[InterlocutorResolver] Non-blocking lead auto-capture notice:', leadErr);
    }

    return {
      isBoss: false,
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

    let projectId = 17;
    if (params.tenantSlug) {
      const p = await db.query.projects.findFirst({
        where: (pr, { or, eq }) => or(eq(pr.slug, params.tenantSlug!), eq(pr.organizationId, params.tenantSlug!)),
        columns: { id: true }
      });
      if (p) projectId = p.id;
    }

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
      import('@/lib/hermes/identity/contact-doctrine')
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
