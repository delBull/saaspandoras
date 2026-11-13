/**
 * 🧪 TESTS: VOCABULARIO CANÓNICO DE CAPABILITIES (unificación)
 *
 * Verifican el contrato, no la implementación:
 *  - un solo id canónico por capacidad
 *  - aliases deterministas y cerrados
 *  - fail-closed ante lo desconocido (sin coincidencia aproximada)
 *  - registro ≠ concesión
 *  - rol de plataforma NO confiere capabilities de tenant
 */

import { describe, it, expect } from 'vitest';
import {
  CAPABILITY_COMPAT_ALIASES,
  LEGACY_MODULE_PERMISSIONS,
  TENANT_CAPABILITY_DEFINITIONS,
  TENANT_CAPABILITY_SET,
  canonicalizePermissions,
  getCapabilityAuthorityModel,
  isLegacyModulePermission,
  isTenantCapability,
  mergeCapabilityCatalogs,
  permissionSatisfied,
  resolveCanonicalCapability,
  PlatformCapabilityRegistryService,
  type PlatformActor,
  type PlatformCapabilityDefinition,
} from '@saasfly/shared';

const superAdmin: PlatformActor = {
  id: 'actor_super_cv',
  actorType: 'WALLET',
  role: 'SUPER_ADMIN',
  walletAddress: '0x00c9f7ee6d1808c09b61e561af6c787060bfe7c9',
  sessionStartedAt: new Date().toISOString(),
  isDiscord2faVerified: true,
};

describe('Capability vocabulario canónico', () => {
  it('CV-01: los identificadores canónicos de tenant son únicos, en minúsculas y sin namespace managed.*', () => {
    const ids = TENANT_CAPABILITY_DEFINITIONS.map((d) => d.capability);

    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(37);

    for (const id of ids) {
      expect(id).toBe(id.trim());
      expect(id).toBe(id.toLowerCase());
      expect(id.startsWith('managed.')).toBe(false);
      expect(id).toMatch(/^[a-z][a-z0-9]*(\.[a-z0-9_:]+)+$/);
    }
  });

  it('CV-02: cada alias resuelve de forma determinista y a un canónico existente', () => {
    for (const [alias, canonical] of Object.entries(CAPABILITY_COMPAT_ALIASES)) {
      expect(resolveCanonicalCapability(alias)).toBe(canonical);
      expect(resolveCanonicalCapability(alias)).toBe(canonical); // determinista
      expect(TENANT_CAPABILITY_SET.has(canonical)).toBe(true);
    }
  });

  it('CV-03: no hay coincidencia aproximada, prefijos, case-folding ni trim', () => {
    const unknown = [
      'media.image',            // falta `.create`
      'MEDIA.IMAGE.CREATE',     // mayúsculas
      ' media.image.create',    // espacio
      'media.image.create ',    // espacio final
      'media.image.create.*',   // sufijo
      'media',                  // prefijo
      'Media.Image ',           // alias con espacio
      'growth.manage',          // permiso de módulo, no capability
      '',                       // vacío
    ];

    for (const raw of unknown) {
      expect(resolveCanonicalCapability(raw)).toBeNull();
    }
  });

  it('CV-04: permissionSatisfied es fail-closed y respeta alias en ambas direcciones', () => {
    // API key histórica (`Media.Image`) satisface el canónico
    expect(permissionSatisfied(['Media.Image'], 'media.image.create')).toBe(true);
    // y el canónico satisface la comprobación con el nombre histórico
    expect(permissionSatisfied(['media.image.create'], 'Media.Image')).toBe(true);
    // alias de especificación P0 → canónico
    expect(permissionSatisfied(['managed.content.approve'], 'content.asset.approve')).toBe(true);

    // sin permiso
    expect(permissionSatisfied([], 'content.asset.approve')).toBe(false);
    // un módulo de Nexus NO se expande a capabilities
    expect(permissionSatisfied(['growth.manage'], 'crm.opportunity.write')).toBe(false);
    // requerido desconocido → nunca concedido, ni con comodín
    expect(permissionSatisfied(['*'], 'unknown.capability')).toBe(false);
    // el comodín histórico de API key cubre capacidades registradas
    expect(permissionSatisfied(['*'], 'content.asset.read')).toBe(true);
  });

  it('CV-05: canonicalizePermissions no descarta lo desconocido y deduplica aliases', () => {
    const { canonical, unresolved } = canonicalizePermissions([
      'Media.Image',
      'media.image.create',
      'managed.crm.read',
      'growth.manage',
      'invented.capability',
    ]);

    expect([...canonical].sort()).toEqual(['crm.opportunity.read', 'media.image.create']);
    expect(unresolved).toEqual(['growth.manage', 'invented.capability']);
  });

  it('CV-06: una capability registrada no está concedida, y ningún rol de plataforma la confiere', () => {
    expect(isTenantCapability('content.asset.approve')).toBe(true);
    expect(permissionSatisfied([], 'content.asset.approve')).toBe(false);

    const tenantCaps = [...TENANT_CAPABILITY_SET];
    for (const capability of tenantCaps) {
      const result = PlatformCapabilityRegistryService.evaluateAuthorization(
        superAdmin,
        capability as never,
      );
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('grant de tenant');
    }
  });

  it('CV-07: el modelo de autoridad separa plataforma de tenant', () => {
    expect(getCapabilityAuthorityModel('platform.tenants.read')).toBe('PLATFORM_ROLE');
    expect(getCapabilityAuthorityModel('content.asset.publish')).toBe('TENANT_GRANT');
    expect(getCapabilityAuthorityModel('crm.opportunity.reassign')).toBe('TENANT_GRANT');
    expect(PlatformCapabilityRegistryService.getAuthorityModel('media.image.create')).toBe(
      'TENANT_GRANT',
    );
  });

  it('CV-08: los 25 identificadores de plataforma conservan su autoridad por rol', () => {
    const platformCaps = PlatformCapabilityRegistryService.getAllDefinitions().filter(
      (def) => getCapabilityAuthorityModel(def.capability) === 'PLATFORM_ROLE',
    );
    expect(platformCaps.length).toBe(25);

    expect(
      PlatformCapabilityRegistryService.evaluateAuthorization(superAdmin, 'platform.tenants.suspend')
        .granted,
    ).toBe(true);
  });

  it('CV-09: los metadatos de governance se conservan en el catálogo unificado', () => {
    const approve = PlatformCapabilityRegistryService.getDefinition('content.asset.approve');
    expect(approve.riskLevel).toBe('HIGH');
    expect(approve.governanceRequirement).toBe('SECOND_APPROVAL');
    expect(approve.resource).toBe('Content');

    const reassign = PlatformCapabilityRegistryService.getDefinition('crm.opportunity.reassign');
    expect(reassign.riskLevel).toBe('MEDIUM');
    expect(reassign.governanceRequirement).toBe('SECOND_APPROVAL');
  });

  it('CV-10: la fusión de catálogos falla si un identificador colisiona', () => {
    const definition: PlatformCapabilityDefinition = {
      capability: 'media.image.create',
      resource: 'Media',
      allowedScopes: ['scoped'],
      riskLevel: 'LOW',
      governanceRequirement: 'DIRECT_EXECUTION',
      description: 'colisión deliberada',
    };

    expect(() =>
      mergeCapabilityCatalogs(
        { 'media.image.create': definition } as Record<'media.image.create', PlatformCapabilityDefinition>,
        { 'media.image.create': definition } as Record<'media.image.create', PlatformCapabilityDefinition>,
      ),
    ).toThrowError(/Colisión de identificador canónico/);
  });

  it('CV-11: los permisos de módulo de Nexus se reconocen como legacy y no como capabilities', () => {
    for (const permission of LEGACY_MODULE_PERMISSIONS) {
      expect(isLegacyModulePermission(permission)).toBe(true);
      expect(isTenantCapability(permission)).toBe(false);
      expect(resolveCanonicalCapability(permission)).toBeNull();
    }
  });
});
