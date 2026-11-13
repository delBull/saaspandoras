/**
 * 🧪 TESTS: cableado del vocabulario canónico en la Content API.
 *
 * Verifica que:
 *  - el mapa de tipos de contenido emite capacidades CANÓNICAS
 *  - las API keys históricas (`Media.*`) siguen satisfaciendo lo que antes
 *    satisfacían (compatibilidad, sin invalidar keys activas)
 *  - un tipo desconocido no resuelve (fail-closed)
 */

import { describe, it, expect } from 'vitest';
import { isTenantCapability, permissionSatisfied } from '@saasfly/shared';
import {
  CONTENT_TYPE_CAPABILITIES,
  resolveContentCapability,
} from '../capability-map';

describe('Content API — vocabulario canónico', () => {
  it('CM-01: todos los tipos de contenido resuelven a una capability canónica de tenant', () => {
    for (const capability of Object.values(CONTENT_TYPE_CAPABILITIES)) {
      expect(isTenantCapability(capability)).toBe(true);
      expect(capability.startsWith('managed.')).toBe(false);
      expect(capability).toBe(capability.toLowerCase());
    }
  });

  it('CM-02: una API key histórica con Media.Image sigue pudiendo generar imágenes', () => {
    const capability = resolveContentCapability('image');
    expect(capability).toBe('media.image.create');
    expect(permissionSatisfied(['Media.Image'], capability!)).toBe(true);
    // y el nombre nuevo también, para keys rotadas
    expect(permissionSatisfied(['media.image.create'], capability!)).toBe(true);
  });

  it('CM-03: Media.Copy cubre copy, copy_render y caption; Media.Research cubre research', () => {
    for (const type of ['copy', 'copy_render', 'caption']) {
      expect(permissionSatisfied(['Media.Copy'], resolveContentCapability(type)!)).toBe(true);
    }
    for (const type of ['research', 'research_report']) {
      expect(permissionSatisfied(['Media.Research'], resolveContentCapability(type)!)).toBe(true);
    }
  });

  it('CM-04: un permiso que no corresponde NO satisface el tipo', () => {
    expect(permissionSatisfied(['Media.Copy'], resolveContentCapability('image')!)).toBe(false);
    expect(permissionSatisfied(['content.asset.read'], resolveContentCapability('video')!)).toBe(false);
  });

  it('CM-05: un tipo de contenido desconocido no resuelve', () => {
    expect(resolveContentCapability('hologram')).toBeNull();
    expect(resolveContentCapability('')).toBeNull();
  });
});
