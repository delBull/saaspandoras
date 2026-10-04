import { CapabilityAdapter } from '../capabilities/capability-runtime';

/**
 * Define de manera declarativa un Adapter que resuelve una Capacidad.
 * Retorna una tupla [capabilityId, Adapter] para que el runtime sepa dónde registrarlo.
 */
export function defineAdapter<TInput = any, TOutput = any>(
  capabilityId: string,
  adapter: CapabilityAdapter<TInput, TOutput>
): { capabilityId: string; adapter: CapabilityAdapter<TInput, TOutput> } {
  return { capabilityId, adapter };
}
