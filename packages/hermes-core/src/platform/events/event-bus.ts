import { ExecutionEvent } from '../../execution/execution-journal';

/**
 * Define el contrato abstracto para la autopista de eventos.
 * El Kernel inyecta eventos aquí, y los Engines escuchan.
 */
export interface IPlatformEventBus {
  /**
   * Publica un evento inmutable proveniente del Kernel o cualquier otro motor principal.
   */
  publish(event: ExecutionEvent): Promise<void>;

  /**
   * Suscribe un manejador a tipos específicos de eventos.
   * @param eventTypes Ej: ['STAGE_FINISHED', 'EXECUTION_COMPLETED']
   * @param subscriber Identificador del motor/componente que escucha.
   * @param handler Función que se invoca cuando el evento ocurre.
   */
  subscribe(
    eventTypes: string[], 
    subscriber: string, 
    handler: (event: ExecutionEvent) => Promise<void>
  ): void;
}
