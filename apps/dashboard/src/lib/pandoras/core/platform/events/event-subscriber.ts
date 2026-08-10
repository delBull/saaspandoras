import { ExecutionEvent } from '../../execution/execution-journal';

/**
 * Contrato que cualquier Engine u Observador debe implementar
 * para conectarse formalmente a la plataforma de ejecución.
 */
export interface EventSubscriber {
  readonly subscriberId: string;
  readonly subscribedEventTypes: string[];

  /**
   * Método invocado por el EventBus cuando ocurre un evento de interés.
   */
  handleEvent(event: ExecutionEvent): Promise<void>;
}
