import { IDecisionProvider } from './decision-provider';

/**
 * Hermes OS — Module Loader
 * Registers decision providers into the kernel's provider pool.
 * Kept as a standalone module (as referenced by the kernel simulation scripts).
 */
export interface IModuleLoader {
  load(provider: IDecisionProvider): void;
  getProviders(): IDecisionProvider[];
  clear(): void;
}

class ModuleLoader implements IModuleLoader {
  private providers: IDecisionProvider[] = [];

  load(provider: IDecisionProvider): void {
    if (this.providers.some(p => p.id === provider.id)) return;
    this.providers.push(provider);
  }

  getProviders(): IDecisionProvider[] {
    return this.providers;
  }

  clear(): void {
    this.providers = [];
  }
}

export const moduleLoader: IModuleLoader = new ModuleLoader();
