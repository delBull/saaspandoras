/**
 * 🏛️ VOCABULARIO CANÓNICO DE CAPABILITIES
 * packages/shared/src/admin/capability-vocabulary.ts
 *
 * FUENTE ÚNICA DE VERDAD de identificadores, metadatos y aliases de compatibilidad.
 *
 * ── REGLAS (contrato) ────────────────────────────────────────────────────────
 * 1. Un solo identificador canónico por capacidad. Los nombres antiguos son
 *    ALIASES de compatibilidad, nunca autoridades independientes.
 * 2. La resolución es EXACTA y determinista: no hay coincidencia aproximada,
 *    prefijos, case-folding ni traducción automática. Lo desconocido no resuelve.
 * 3. Fail-closed: si un permiso no resuelve, NO se concede. El llamador decide
 *    si devuelve 403 o lo registra como permiso no reconocido.
 * 4. Una capability REGISTRADA no implica CONCEDIDA. El registro define nombres
 *    y metadatos; la concesión depende de identidad + scope + grant + policy.
 * 5. La modalidad comercial (self-service / managed) NO determina el nombre.
 *    Por eso no existe el namespace `managed.*`.
 *
 * ── VOCABULARIOS HISTÓRICOS CUBIERTOS (solo lectura, vía alias) ──────────────
 * a) API keys de Content API: `Media.Image`, `Media.Copy`, ... (PascalCase)
 * b) Grants de Hermes:      `media.image.create`, `demand.view`, ... (ya canónicos)
 * c) Catálogo de plataforma: `platform.*`, `hq.crm.*`, `ops.*` (siguen intactos)
 * d) Especificaciones P0   : `managed.crm.*`, `managed.media.*`, `managed.content.approve`
 */

import type { PlatformCapabilityDefinition } from './platform-capability-registry.service';

/**
 * Capacidades de TENANT (operables dentro de una organización).
 * Su autoridad es un grant de tenant resuelto en servidor, NUNCA un rol de
 * plataforma. Ver `getCapabilityAuthorityModel`.
 */
const TENANT_CAPABILITY_DEFS = [
  // ── Media: producción ────────────────────────────────────────────────────
  {
    capability: 'media.image.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar imágenes del tenant (Pixel)',
  },
  {
    capability: 'media.video.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar video y reels del tenant (Pixel)',
  },
  {
    capability: 'media.copy.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar copy y piezas editoriales cortas (Minerva)',
  },
  {
    capability: 'media.editorial.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar contenido editorial y de newsletter (Atlas/Minerva)',
  },
  {
    capability: 'media.audio.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar audio y podcast del tenant',
  },
  {
    capability: 'media.newsletter.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar newsletters del tenant (Atlas)',
  },
  {
    capability: 'media.podcast.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar podcasts del tenant (Media Co)',
  },
  {
    capability: 'media.research.create',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar reportes de investigación e inteligencia (Minerva)',
  },

  // ── Media: distribución ──────────────────────────────────────────────────
  {
    capability: 'media.publish.channel:telegram',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Publicar contenido en el canal Telegram del tenant',
  },
  {
    capability: 'media.publish.channel:x',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Publicar contenido en el canal X del tenant',
  },
  {
    capability: 'media.publish.channel:newsletter',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Publicar contenido en el newsletter del tenant',
  },

  // ── Demand (Growth OS) ───────────────────────────────────────────────────
  {
    capability: 'demand.view',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar el Demand Console del tenant',
  },
  {
    capability: 'demand.plan',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Planificar campañas y estrategia de demanda',
  },
  {
    capability: 'demand.approve',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Aprobar campañas antes de su ejecución (implica gasto)',
  },
  {
    capability: 'demand.distribute',
    resource: 'Media',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Distribuir campañas aprobadas en canales habilitados',
  },

  // ── Content delivery (P0.3) ──────────────────────────────────────────────
  {
    capability: 'content.asset.read',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar artefactos de contenido del tenant y sus versiones',
  },
  {
    capability: 'content.asset.create',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Crear, almacenar y modificar artefactos de contenido',
  },
  {
    capability: 'content.asset.approve',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Aprobar o rechazar una versión; exige identidad humana distinta del creador y del último editor',
  },
  {
    capability: 'content.asset.publish',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Publicar una versión aprobada para entrega',
  },
  {
    capability: 'content.asset.revoke',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Revocar la entrega de un artefacto o versión',
  },
  {
    capability: 'content.asset.delete',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Eliminar un artefacto y su almacenamiento físico asociado',
  },
  {
    capability: 'content.token.issue',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Emitir tokens de entrega de alcance limitado para terceros',
  },
  {
    capability: 'content.asset.public_exception',
    resource: 'Content',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Autorizar la excepción de acceso público indexable para un tipo de activo',
  },

  // ── CRM (P0.2) ───────────────────────────────────────────────────────────
  {
    capability: 'crm.contact.read',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar contactos y leads del tenant',
  },
  {
    capability: 'crm.contact.write',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Crear y actualizar contactos y leads del tenant',
  },
  {
    capability: 'crm.pipeline.read',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar pipelines y etapas del tenant',
  },
  {
    capability: 'crm.pipeline.write',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Crear o modificar pipelines y etapas del tenant',
  },
  {
    capability: 'crm.opportunity.read',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar oportunidades y su historial de actividad',
  },
  {
    capability: 'crm.opportunity.write',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Crear y actualizar oportunidades; registrar actividad',
  },
  {
    capability: 'crm.opportunity.reassign',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Reasignar el propietario de una oportunidad (aprobación obligatoria al cruzar equipos)',
  },
  {
    capability: 'crm.opportunity.close',
    resource: 'CRM',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Cerrar una oportunidad como ganada o perdida; registrar closed_revenue_usd',
  },

  // ── Reporting (P0.4) ─────────────────────────────────────────────────────
  {
    capability: 'reporting.report.read',
    resource: 'Reporting',
    allowedScopes: ['scoped'],
    riskLevel: 'LOW',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar reportes y snapshots del tenant',
  },
  {
    capability: 'reporting.report.generate',
    resource: 'Reporting',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Generar un snapshot de reporte reproducible',
  },
  {
    capability: 'reporting.spend.write',
    resource: 'Reporting',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Registrar gasto publicitario con evidencia (sin integración de Ads)',
  },

  // ── Governance (P0.1) ────────────────────────────────────────────────────
  {
    capability: 'governance.approval.review',
    resource: 'Governance',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Resolver solicitudes de aprobación pendientes del tenant',
  },
  {
    capability: 'governance.grant.read',
    resource: 'Governance',
    allowedScopes: ['scoped'],
    riskLevel: 'MEDIUM',
    governanceRequirement: 'DIRECT_EXECUTION',
    description: 'Consultar los grants efectivos de una identidad en el tenant',
  },
  {
    capability: 'governance.grant.manage',
    resource: 'Governance',
    allowedScopes: ['scoped'],
    riskLevel: 'HIGH',
    governanceRequirement: 'SECOND_APPROVAL',
    description: 'Conceder o revocar grants de tenant (revocación efectiva en la siguiente petición)',
  },
] as const satisfies ReadonlyArray<{
  capability: string;
  resource: PlatformCapabilityDefinition['resource'];
  allowedScopes: PlatformCapabilityDefinition['allowedScopes'];
  riskLevel: PlatformCapabilityDefinition['riskLevel'];
  governanceRequirement: PlatformCapabilityDefinition['governanceRequirement'];
  description: string;
}>;

export type TenantCapability = (typeof TENANT_CAPABILITY_DEFS)[number]['capability'];

/** Definiciones mutables listas para el catálogo unificado. */
export const TENANT_CAPABILITY_DEFINITIONS: ReadonlyArray<
  PlatformCapabilityDefinition & { capability: TenantCapability }
> = TENANT_CAPABILITY_DEFS.map((definition) => ({
  ...definition,
  allowedScopes: [...definition.allowedScopes],
})) as ReadonlyArray<PlatformCapabilityDefinition & { capability: TenantCapability }>;

/** Índice O(1) de capacidades de tenant canónicas. */
export const TENANT_CAPABILITY_SET: ReadonlySet<string> = new Set<string>(
  TENANT_CAPABILITY_DEFS.map((d) => d.capability),
);

/**
 * ALIASES DE COMPATIBILIDAD — tabla explícita y cerrada.
 * Clave: nombre histórico EXACTO. Valor: identificador canónico.
 * Añadir un alias aquí es una decisión de contrato, no una inferencia.
 */
export const CAPABILITY_COMPAT_ALIASES: Readonly<Record<string, TenantCapability>> = Object.freeze({
  // (a) API keys de Content API — PascalCase
  'Media.Image': 'media.image.create',
  'Media.Video': 'media.video.create',
  'Media.Copy': 'media.copy.create',
  'Media.Editorial': 'media.editorial.create',
  'Media.Audio': 'media.audio.create',
  'Media.Research': 'media.research.create',
  'Media.Newsletter': 'media.newsletter.create',

  // (d) Especificaciones P0 — namespace `managed.*` (nunca autoridad)
  'managed.crm.read': 'crm.opportunity.read',
  'managed.crm.write': 'crm.opportunity.write',
  'managed.media.read': 'content.asset.read',
  'managed.media.write': 'content.asset.create',
  'managed.content.approve': 'content.asset.approve',
  'managed.content.publish': 'content.asset.publish',

  // (e) Sinónimo declarado en especificaciones P0.2/P0.3 para creación de artefactos.
  // El canónico es el que YA usa producción (`content.asset.create`).
  'content.asset.write': 'content.asset.create',
} satisfies Record<string, TenantCapability>);

/**
 * (f) RBAC de Nexus — permisos de MÓDULO (`CANONICAL_CAPABILITIES`), booleanos por
 * colaborador en `nexus_collaborators.permissions`.
 *
 * NO son capabilities y NO se expanden automáticamente: `growth.manage` no
 * satisface `crm.opportunity.write`, porque esa traducción concedería permisos
 * que nadie otorgó. Su descomposición es trabajo de P0.1.
 */
export const LEGACY_MODULE_PERMISSIONS: ReadonlySet<string> = new Set([
  'users.manage',
  'tenants.manage',
  'finance.manage',
  'growth.manage',
  'marketing.manage',
  'nexus.manage',
  'ecosystem',
]);

/** `true` si el identificador es un permiso de módulo histórico (no una capability). */
export function isLegacyModulePermission(raw: string): boolean {
  return LEGACY_MODULE_PERMISSIONS.has(raw);
}

/**
 * Resuelve un identificador histórico a su forma canónica.
 *
 * Determinista y fail-closed: coincidencia EXACTA contra el conjunto canónico o
 * contra la tabla de aliases. Sin trim, sin case-folding, sin prefijos.
 *
 * @returns el id canónico, o `null` si no está registrado.
 */
export function resolveCanonicalCapability(raw: string): TenantCapability | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  if (TENANT_CAPABILITY_SET.has(raw)) return raw as TenantCapability;
  return Object.prototype.hasOwnProperty.call(CAPABILITY_COMPAT_ALIASES, raw)
    ? CAPABILITY_COMPAT_ALIASES[raw]!
    : null;
}

/** `true` solo si el identificador es canónico de tenant (no alias, no desconocido). */
export function isTenantCapability(raw: string): raw is TenantCapability {
  return TENANT_CAPABILITY_SET.has(raw);
}

/**
 * Canoniza una lista de permisos concedidos.
 *
 * Los permisos no reconocidos NO se descartan en silencio: se devuelven en
 * `unresolved` para que el llamador pueda auditarlos o rechazar la petición.
 */
export function canonicalizePermissions(granted: readonly string[]): {
  canonical: Set<TenantCapability>;
  unresolved: string[];
} {
  const canonical = new Set<TenantCapability>();
  const unresolved: string[] = [];
  for (const raw of granted) {
    const resolved = resolveCanonicalCapability(raw);
    if (resolved) canonical.add(resolved);
    else unresolved.push(raw);
  }
  return { canonical, unresolved };
}

/**
 * ¿Los permisos concedidos satisfacen la capability requerida?
 *
 * - `required` debe ser canónico o alias declarado; si no resuelve → `false` (fail-closed).
 * - Un alias concedido satisface su canónico, y viceversa (compatibilidad bidireccional).
 * - `*` se admite SOLO porque es el contrato histórico de las API keys de tenant
 *   (`authorizeContentClient`). No es un comodín de plataforma.
 */
export function permissionSatisfied(granted: readonly string[], required: string): boolean {
  const requiredCanonical = resolveCanonicalCapability(required);
  if (!requiredCanonical) return false;
  if (granted.includes('*')) return true;

  for (const raw of granted) {
    if (resolveCanonicalCapability(raw) === requiredCanonical) return true;
  }
  return false;
}

/** Modelo de autoridad de una capability. */
export type CapabilityAuthorityModel = 'PLATFORM_ROLE' | 'TENANT_GRANT';

/**
 * Las capacidades de tenant se autorizan por grant de tenant (identidad + scope +
 * policy), nunca por rol de plataforma. Cualquier otra se evalúa por rol.
 */
export function getCapabilityAuthorityModel(capability: string): CapabilityAuthorityModel {
  return TENANT_CAPABILITY_SET.has(capability) ? 'TENANT_GRANT' : 'PLATFORM_ROLE';
}

/**
 * Fusiona dos catálogos disjuntos preservando el tipado.
 * Falla en construcción si una capability de tenant colisiona con una de plataforma.
 */
export function mergeCapabilityCatalogs<PlatformKey extends string, TenantKey extends string>(
  platform: Record<PlatformKey, PlatformCapabilityDefinition>,
  tenant: Record<TenantKey, PlatformCapabilityDefinition>,
): Record<PlatformKey | TenantKey, PlatformCapabilityDefinition> {
  for (const key of Object.keys(tenant)) {
    if (Object.prototype.hasOwnProperty.call(platform, key)) {
      throw new Error(
        `[CapabilityVocabulary] Colisión de identificador canónico entre catálogos: '${key}'`,
      );
    }
  }
  return { ...platform, ...tenant };
}
