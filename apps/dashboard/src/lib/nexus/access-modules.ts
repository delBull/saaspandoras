/**
 * Módulos de Nexus que se pueden solicitar y el permiso que los abre.
 *
 * Lista cerrada a propósito: una solicitud no puede pedir "cualquier cosa", y el
 * permiso que se escribe al aprobar sale de aquí, no del cuerpo de la petición.
 */
export const ACCESS_MODULES = ['developer', 'dealRoom', 'settings', 'hermesQa', 'academy'] as const;

export type AccessModule = (typeof ACCESS_MODULES)[number];

export const MODULE_PERMISSION_FIELD: Record<AccessModule, string> = {
  developer: 'developer',
  dealRoom: 'dealRoom',
  settings: 'settings',
  hermesQa: 'hermesQa',
  academy: 'academyAdmin',
};

export const MODULE_LABEL: Record<AccessModule, string> = {
  developer: 'Developer Hub',
  dealRoom: 'Deal Rooms',
  settings: 'Settings',
  hermesQa: 'Hermes QA',
  academy: 'Academy (admin)',
};

/** `true` si el módulo pedido es válido. */
export function isAccessModule(value: unknown): value is AccessModule {
  return typeof value === 'string' && (ACCESS_MODULES as readonly string[]).includes(value);
}
