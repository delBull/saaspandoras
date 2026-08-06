import { CapabilityId, ExecutionRequest, ExecutionResult, ServiceProvider, ProviderDefinition } from '../contracts';

/**
 * Clase base para todos los Providers del ecosistema Pandora's.
 * Facilita el boilerplate del contrato de ServiceProvider y fuerza la implementación de la definición.
 */
export abstract class AbstractProvider implements ServiceProvider {
  /**
   * La definición estática del provider que se registrará en el ProviderRegistry.
   */
  abstract get definition(): ProviderDefinition;

  /**
   * El único punto de entrada para ejecutar lógica.
   * La clase hija debe implementar el enrutamiento interno (Facade) hacia sus servicios.
   */
  abstract execute(request: ExecutionRequest): Promise<ExecutionResult>;

  /**
   * Helper para construir respuestas estandarizadas de éxito.
   */
  protected createSuccessResult<T>(
    actionExecuted: string,
    data: T,
    options?: Partial<Omit<ExecutionResult<T>, 'success' | 'actionExecuted' | 'data'>>
  ): ExecutionResult<T> {
    return {
      success: true,
      actionExecuted,
      data,
      ...options,
    };
  }

  /**
   * Helper para construir respuestas estandarizadas de error.
   */
  protected createErrorResult(
    actionExecuted: string,
    code: string,
    message: string,
    details?: any
  ): ExecutionResult<null> {
    return {
      success: false,
      actionExecuted,
      data: null,
      error: {
        code,
        message,
        details,
      },
    };
  }

  /**
   * Valida si el Provider soporta la capability solicitada.
   */
  public supports(capability: CapabilityId): boolean {
    return this.definition.capabilities.includes(capability);
  }
}
