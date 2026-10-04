import { PandorasRuntime } from './create-runtime';
import { PackManifest } from './define-pack';

export interface PandorasAppConfig {
  runtime: PandorasRuntime;
  /** Los Packs declarativos a instalar en el OS */
  packs: PackManifest[];
}

/**
 * Bootstraps la integración de los Packs sobre el OS en ejecución.
 */
export function createPandorasApp(config: PandorasAppConfig) {
  const { runtime, packs } = config;

  let totalWorkflows = 0;
  let totalCapabilities = 0;
  let totalAdapters = 0;

  for (const pack of packs) {
    console.log(`\n📦 [PandorasApp] Instalando Pack: ${pack.name} (v${pack.version})`);
    
    // Fail-fast logic for SDK version could be added here in the future
    // if (!semver.satisfies(runtime.version, pack.sdkVersion)) throw new CompatibilityError()

    if (pack.workflows) {
      for (const w of pack.workflows) {
        runtime.workflowRegistry.register(w.definition, w.metadata);
        totalWorkflows++;
      }
    }

    if (pack.capabilities) {
      for (const c of pack.capabilities) {
        runtime.capabilityRegistry.registerCapability(c);
        totalCapabilities++;
      }
    }

    if (pack.adapters) {
      for (const a of pack.adapters) {
        runtime.capabilityRegistry.registerAdapter(a.capabilityId, a.adapter);
        totalAdapters++;
      }
    }
  }

  console.log(`\n✅ [PandorasApp] Instalación finalizada: ${totalWorkflows} workflows, ${totalCapabilities} capabilities, ${totalAdapters} adapters.`);
}
